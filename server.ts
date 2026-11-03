import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { dbManager, UserDoc, MessageDoc, GroupDoc, StatusDoc, CallLogDoc } from './server/db.ts';
import {
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  getOtpAuthUrl,
} from './server/totp.ts';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json({ limit: '25mb' }));

// Active WebSocket connections map: userId -> Set of WebSockets
const activeSockets = new Map<string, Set<WebSocket>>();

function broadcastToAll(payload: any) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function sendToUser(userId: string, payload: any) {
  const sockets = activeSockets.get(userId);
  if (sockets) {
    const data = JSON.stringify(payload);
    sockets.forEach((s) => {
      if (s.readyState === WebSocket.OPEN) {
        s.send(data);
      }
    });
  }
}

function sendToUsers(userIds: string[], payload: any) {
  userIds.forEach((id) => sendToUser(id, payload));
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  let authenticatedUserId: string | null = null;

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'auth': {
          authenticatedUserId = msg.userId;
          if (authenticatedUserId) {
            if (!activeSockets.has(authenticatedUserId)) {
              activeSockets.set(authenticatedUserId, new Set());
            }
            activeSockets.get(authenticatedUserId)!.add(ws);

            await dbManager.updateUserStatus(authenticatedUserId, 'online');
            broadcastToAll({
              type: 'user_status_changed',
              userId: authenticatedUserId,
              status: 'online',
            });
          }
          break;
        }

        case 'status_update': {
          if (authenticatedUserId && msg.status) {
            await dbManager.updateUserStatus(authenticatedUserId, msg.status);
            broadcastToAll({
              type: 'user_status_changed',
              userId: authenticatedUserId,
              status: msg.status,
            });
          }
          break;
        }

        case 'typing': {
          if (msg.channel === 'open') {
            broadcastToAll({
              type: 'user_typing',
              channel: 'open',
              userId: authenticatedUserId,
              name: msg.name,
              isTyping: msg.isTyping,
            });
          } else if (msg.channel === 'group' && msg.groupId) {
            const group = await dbManager.getGroupById(msg.groupId);
            if (group) {
              sendToUsers(group.memberIds, {
                type: 'user_typing',
                channel: 'group',
                groupId: msg.groupId,
                userId: authenticatedUserId,
                name: msg.name,
                isTyping: msg.isTyping,
              });
            }
          } else if (msg.recipientId) {
            sendToUser(msg.recipientId, {
              type: 'user_typing',
              channel: 'direct',
              userId: authenticatedUserId,
              name: msg.name,
              isTyping: msg.isTyping,
            });
          }
          break;
        }

        // WebRTC Signaling Events
        case 'call_initiate': {
          const targetId = msg.targetUserId;
          sendToUser(targetId, {
            type: 'incoming_call',
            callerId: authenticatedUserId,
            callerName: msg.callerName,
            callerPhone: msg.callerPhone,
            callerAvatar: msg.callerAvatar,
            callType: msg.callType || 'video',
            sdpOffer: msg.sdpOffer,
          });
          break;
        }

        case 'call_answer': {
          sendToUser(msg.callerId, {
            type: 'call_accepted',
            calleeId: authenticatedUserId,
            sdpAnswer: msg.sdpAnswer,
          });
          break;
        }

        case 'ice_candidate': {
          sendToUser(msg.targetUserId, {
            type: 'ice_candidate',
            fromUserId: authenticatedUserId,
            candidate: msg.candidate,
          });
          break;
        }

        case 'call_decline': {
          sendToUser(msg.callerId, {
            type: 'call_declined',
            calleeId: authenticatedUserId,
            reason: msg.reason || 'User declined the call',
          });
          break;
        }

        case 'call_hangup': {
          sendToUser(msg.targetUserId, {
            type: 'call_ended',
            byUserId: authenticatedUserId,
          });
          break;
        }

        case 'heartbeat': {
          ws.send(JSON.stringify({ type: 'heartbeat_ack', time: Date.now() }));
          break;
        }
      }
    } catch (err) {
      console.error('[WebSocket message error]', err);
    }
  });

  ws.on('close', async () => {
    if (authenticatedUserId && activeSockets.has(authenticatedUserId)) {
      const set = activeSockets.get(authenticatedUserId)!;
      set.delete(ws);
      if (set.size === 0) {
        activeSockets.delete(authenticatedUserId);
        await dbManager.updateUserStatus(authenticatedUserId, 'offline');
        broadcastToAll({
          type: 'user_status_changed',
          userId: authenticatedUserId,
          status: 'offline',
        });
      }
    }
  });
});

// ===== REST API Routes =====

// System Status
app.get('/api/system/status', (req, res) => {
  const status = dbManager.getStatus();
  res.json({
    app: 'LK ONLINE',
    version: '2.5.0',
    mongodb: status,
    activeConnections: activeSockets.size,
  });
});

// Step 1: Register init
app.post('/api/auth/register-init', async (req, res) => {
  try {
    const { phone, name, password } = req.body;
    if (!phone || !name || !password) {
      return res.status(400).json({ error: 'කරුණාකර සියලු විස්තර සම්පූර්ණ කරන්න.' });
    }

    const cleanPhone = phone.trim();
    const existing = await dbManager.getUserByPhone(cleanPhone);
    if (existing) {
      return res.status(409).json({ error: 'මෙම දුරකථන අංකය දැනටමත් ලියාපදිංචි කර ඇත! කරුණාකර Log In වන්න.' });
    }

    const secret = generateTotpSecret(20);
    const otpAuthUrl = getOtpAuthUrl(cleanPhone, secret, 'LK ONLINE');

    res.json({
      success: true,
      secret,
      otpAuthUrl,
      phone: cleanPhone,
      name: name.trim(),
    });
  } catch (error) {
    console.error('register-init error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Step 2: Register verify
app.post('/api/auth/register-verify', async (req, res) => {
  try {
    const { phone, name, password, secret, otp, avatar } = req.body;
    if (!phone || !name || !password || !secret || !otp) {
      return res.status(400).json({ error: 'අවශ්‍ය සියලු දත්ත සහ OTP අංකය ලබා දෙන්න.' });
    }

    const isValid = verifyTotpCode(secret, otp);
    if (!isValid) {
      return res.status(400).json({
        error: 'වලංගු නොවන Authenticator කේතයක්! කරුණාකර Authenticator එකෙන් ලබාගත් නිවැරදි ඉලක්කම් 6ක OTP ඇතුළත් කරන්න. ෆේක් ඒවා ප්‍රතික්ෂේප කරනු ලැබේ.',
      });
    }

    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const isSpecialMod = cleanPhone === '0760264995' || cleanName.toLowerCase() === 'zanta mod';

    const newUser: UserDoc = {
      id: isSpecialMod ? 'u_zanta_mod_special' : 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      phone: cleanPhone,
      name: cleanName,
      password: password,
      authenticatorSecret: secret,
      avatar:
        avatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=09090b`,
      bio: isSpecialMod ? 'LK ONLINE Master Mod & VIP Verified 👑' : 'LK ONLINE Member 🇱🇰',
      status: 'online',
      isVerified: isSpecialMod ? true : false,
      customBadge: isSpecialMod ? 'VERIFIED MOD 👑' : undefined,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    };

    await dbManager.saveUser(newUser);

    broadcastToAll({
      type: 'user_registered',
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        avatar: newUser.avatar,
        status: newUser.status,
        isVerified: newUser.isVerified,
        customBadge: newUser.customBadge,
      },
    });

    const { password: _, authenticatorSecret: __, ...safeUser } = newUser;
    res.json({
      success: true,
      user: safeUser,
      token: newUser.id,
      message: 'ලියාපදිංචිය සාර්ථකයි!',
    });
  } catch (error) {
    console.error('register-verify error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Step 3: Login check (number + name + password match accurately -> generate YOU OTP)
app.post('/api/auth/login-check', async (req, res) => {
  try {
    const { phone, name, password } = req.body;
    if (!phone || !name || !password) {
      return res.status(400).json({ error: 'කරුණාකර දුරකථන අංකය, නම සහ මුරපදය සියල්ල ඇතුළත් කරන්න.' });
    }

    const cleanPhone = phone.trim();
    const user = await dbManager.getUserByPhone(cleanPhone);

    if (!user) {
      return res.status(404).json({ error: 'මෙම දුරකථන අංකයෙන් ගිණුමක් හමු නොවීය. කරුණාකර රෙජිස්ටර් වන්න.' });
    }

    const nameMatches = user.name.trim().toLowerCase() === name.trim().toLowerCase();
    const passwordMatches = user.password === password;

    if (!nameMatches || !passwordMatches) {
      return res.status(401).json({
        error: 'දුරකථන අංකය, නම හෝ මුරපදය නිවැරදිව මැච් නොවේ!',
      });
    }

    // Auto verify zanta mod on login
    if (user.phone === '0760264995') {
      user.isVerified = true;
      user.customBadge = 'VERIFIED MOD 👑';
      await dbManager.saveUser(user);
    }

    const currentOtp = generateTotpCode(user.authenticatorSecret);

    res.json({
      success: true,
      currentOtp, // Provided for the "YOU OTP" copy box
      secret: user.authenticatorSecret,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        isVerified: user.isVerified,
        customBadge: user.customBadge,
      },
    });
  } catch (error) {
    console.error('login-check error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Step 4: Login verify
app.post('/api/auth/login-verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'දුරකථන අංකය සහ OTP කේතය ලබා දෙන්න.' });
    }

    const user = await dbManager.getUserByPhone(phone.trim());
    if (!user) {
      return res.status(404).json({ error: 'ගිණුම හමු නොවීය.' });
    }

    const isValid = verifyTotpCode(user.authenticatorSecret, otp);
    if (!isValid) {
      return res.status(400).json({
        error: 'වලංගු නොවන Authenticator කේතයක්! කරුණාකර නිවැරදි OTP එක ඇතුළත් කරන්න. ෆේක් ඒවා ප්‍රතික්ෂේප කරනු ලැබේ.',
      });
    }

    await dbManager.updateUserStatus(user.id, 'online');

    const { password: _, authenticatorSecret: __, ...safeUser } = user;
    res.json({
      success: true,
      user: safeUser,
      token: user.id,
    });
  } catch (error) {
    console.error('login-verify error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/auth/me', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const user = await dbManager.getUserById(token);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const { password: _, authenticatorSecret: __, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Profile update (name, bio, avatar, verified badge toggle)
app.post('/api/profile/update', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { name, bio, avatar, isVerified } = req.body;
    const updated = await dbManager.updateProfile(token, { name, bio, avatar, isVerified });

    if (!updated) return res.status(404).json({ error: 'User not found' });

    broadcastToAll({
      type: 'user_profile_updated',
      user: {
        id: updated.id,
        name: updated.name,
        bio: updated.bio,
        avatar: updated.avatar,
        isVerified: updated.isVerified,
        customBadge: updated.customBadge,
      },
    });

    const { password: _, authenticatorSecret: __, ...safeUser } = updated;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('profile update error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all registered users
app.get('/api/users', async (req, res) => {
  const users = await dbManager.getAllUsers();
  res.json({ users });
});

// ===== Messages Routes =====

// Open Channel messages
app.get('/api/messages/channel', async (req, res) => {
  const messages = await dbManager.getChannelMessages(200);
  res.json({ messages });
});

app.post('/api/messages/channel', async (req, res) => {
  try {
    const { senderId, text, sticker, emoji, mediaUrl, mediaType, voiceAudio, voiceDuration, replyTo } = req.body;
    const sender = await dbManager.getUserById(senderId);
    if (!sender) return res.status(401).json({ error: 'User not recognized' });

    if (!text && !sticker && !emoji && !mediaUrl && !voiceAudio) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const msg: MessageDoc = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      channel: 'open',
      senderId: sender.id,
      senderName: sender.name,
      senderPhone: sender.phone,
      senderAvatar: sender.avatar,
      senderVerified: sender.isVerified,
      text: text?.trim(),
      sticker,
      emoji,
      mediaUrl,
      mediaType,
      voiceAudio,
      voiceDuration,
      replyTo,
      timestamp: Date.now(),
      reactions: {},
    };

    await dbManager.saveMessage(msg);

    broadcastToAll({
      type: 'new_message',
      message: msg,
    });

    res.json({ success: true, message: msg });
  } catch (error) {
    console.error('post channel message error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Direct Messages (1-on-1)
app.get('/api/messages/direct/:targetUserId', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const { targetUserId } = req.params;

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const messages = await dbManager.getDirectMessages(token, targetUserId, 200);
  res.json({ messages });
});

app.post('/api/messages/direct', async (req, res) => {
  try {
    const { senderId, recipientId, text, sticker, emoji, mediaUrl, mediaType, voiceAudio, voiceDuration, replyTo, callInfo } = req.body;
    const sender = await dbManager.getUserById(senderId);
    const recipient = await dbManager.getUserById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ error: 'Sender or recipient not found' });
    }

    const msg: MessageDoc = {
      id: 'dm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      channel: 'direct',
      senderId: sender.id,
      senderName: sender.name,
      senderPhone: sender.phone,
      senderAvatar: sender.avatar,
      senderVerified: sender.isVerified,
      recipientId: recipient.id,
      text: text?.trim(),
      sticker,
      emoji,
      mediaUrl,
      mediaType,
      voiceAudio,
      voiceDuration,
      replyTo,
      callInfo,
      timestamp: Date.now(),
      reactions: {},
    };

    await dbManager.saveMessage(msg);

    // Deliver to recipient and sender via WebSocket
    sendToUser(recipientId, {
      type: 'new_direct_message',
      message: msg,
    });
    sendToUser(senderId, {
      type: 'new_direct_message',
      message: msg,
    });

    res.json({ success: true, message: msg });
  } catch (error) {
    console.error('post direct message error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle reaction
app.post('/api/messages/react', async (req, res) => {
  try {
    const { messageId, emoji, userId } = req.body;
    if (!messageId || !emoji || !userId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const updated = await dbManager.toggleReaction(messageId, emoji, userId);
    if (updated) {
      broadcastToAll({
        type: 'message_reaction_updated',
        messageId,
        reactions: updated.reactions,
      });
      return res.json({ success: true, reactions: updated.reactions });
    }
    res.status(404).json({ error: 'Message not found' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Groups API =====
app.get('/api/groups', async (req, res) => {
  const groups = await dbManager.getAllGroups();
  res.json({ groups });
});

app.post('/api/groups', async (req, res) => {
  try {
    const { name, description, icon, ownerId, memberIds } = req.body;
    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Group name and owner are required' });
    }

    const members = Array.from(new Set([ownerId, ...(memberIds || [])]));

    const newGroup: GroupDoc = {
      id: 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      description: description?.trim(),
      icon: icon || '👥',
      ownerId,
      adminIds: [ownerId],
      memberIds: members,
      createdAt: Date.now(),
    };

    await dbManager.createGroup(newGroup);

    // Notify all members
    broadcastToAll({
      type: 'new_group_created',
      group: newGroup,
    });

    res.json({ success: true, group: newGroup });
  } catch (error) {
    console.error('group create error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Grant Admin rights (Strict rule: Owner can grant admin, but CANNOT remove admins!)
app.post('/api/groups/:groupId/admin', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId, requesterId } = req.body;

    const result = await dbManager.addAdminToGroup(groupId, memberId, requesterId);
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }

    broadcastToAll({
      type: 'group_updated',
      group: result.group,
    });

    res.json({ success: true, group: result.group });
  } catch (error) {
    console.error('grant admin error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Group messages
app.get('/api/messages/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const messages = await dbManager.getGroupMessages(groupId, 200);
  res.json({ messages });
});

app.post('/api/messages/group', async (req, res) => {
  try {
    const { groupId, senderId, text, sticker, emoji, mediaUrl, mediaType, voiceAudio, voiceDuration, replyTo } = req.body;
    const group = await dbManager.getGroupById(groupId);
    const sender = await dbManager.getUserById(senderId);

    if (!group || !sender) {
      return res.status(404).json({ error: 'Group or sender not found' });
    }

    const msg: MessageDoc = {
      id: 'gmsg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      channel: 'group',
      groupId,
      senderId: sender.id,
      senderName: sender.name,
      senderPhone: sender.phone,
      senderAvatar: sender.avatar,
      senderVerified: sender.isVerified,
      text: text?.trim(),
      sticker,
      emoji,
      mediaUrl,
      mediaType,
      voiceAudio,
      voiceDuration,
      replyTo,
      timestamp: Date.now(),
      reactions: {},
    };

    await dbManager.saveMessage(msg);

    // Broadcast to all group members
    sendToUsers(group.memberIds, {
      type: 'new_group_message',
      message: msg,
    });

    res.json({ success: true, message: msg });
  } catch (error) {
    console.error('post group message error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== 24-Hour Status / Stories API =====
app.get('/api/statuses', async (req, res) => {
  const statuses = await dbManager.getActiveStatuses();
  res.json({ statuses });
});

app.post('/api/statuses', async (req, res) => {
  try {
    const { userId, text, bgGradient, mediaUrl } = req.body;
    const user = await dbManager.getUserById(userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const now = Date.now();
    const newStatus: StatusDoc = {
      id: 'st_' + now + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userPhone: user.phone,
      userVerified: user.isVerified,
      text: text?.trim(),
      bgGradient: bgGradient || 'from-red-600 via-rose-700 to-black',
      mediaUrl,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24-hour expiration!
      reactions: {},
      replies: [],
    };

    await dbManager.createStatus(newStatus);

    broadcastToAll({
      type: 'new_status',
      status: newStatus,
    });

    res.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('create status error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/statuses/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji, userId } = req.body;
    const updated = await dbManager.addReactionToStatus(id, emoji, userId);
    if (!updated) return res.status(404).json({ error: 'Status not found' });

    broadcastToAll({
      type: 'status_reaction_updated',
      statusId: id,
      reactions: updated.reactions,
    });

    res.json({ success: true, reactions: updated.reactions });
  } catch (error) {
    console.error('status react error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/statuses/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, text } = req.body;
    const status = (await dbManager.getActiveStatuses()).find((s) => s.id === id);
    if (!status) return res.status(404).json({ error: 'Status not found' });

    const updated = await dbManager.addReplyToStatus(id, { userId, userName, text });

    // Also send as a direct message to the status creator!
    const sender = await dbManager.getUserById(userId);
    if (sender && status.userId !== userId) {
      const dm: MessageDoc = {
        id: 'dm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        channel: 'direct',
        senderId: sender.id,
        senderName: sender.name,
        senderPhone: sender.phone,
        senderAvatar: sender.avatar,
        senderVerified: sender.isVerified,
        recipientId: status.userId,
        text: `Replying to your Status: "${text}"`,
        replyTo: {
          id: status.id,
          senderName: status.userName,
          text: status.text || 'Status Photo/Story',
        },
        timestamp: Date.now(),
      };
      await dbManager.saveMessage(dm);
      sendToUser(status.userId, { type: 'new_direct_message', message: dm });
      sendToUser(sender.id, { type: 'new_direct_message', message: dm });
    }

    res.json({ success: true, replies: updated?.replies });
  } catch (error) {
    console.error('status reply error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Call Logs API =====
app.get('/api/calls', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const logs = await dbManager.getCallLogsForUser(token);
  res.json({ calls: logs });
});

app.post('/api/calls/log', async (req, res) => {
  try {
    const { callerId, receiverId, callType, status, duration } = req.body;
    const caller = await dbManager.getUserById(callerId);
    const receiver = await dbManager.getUserById(receiverId);

    if (!caller || !receiver) {
      return res.status(404).json({ error: 'Users not found' });
    }

    const log: CallLogDoc = {
      id: 'call_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      callerId: caller.id,
      callerName: caller.name,
      callerAvatar: caller.avatar,
      callerPhone: caller.phone,
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverAvatar: receiver.avatar,
      receiverPhone: receiver.phone,
      callType: callType || 'video',
      status: status || 'completed',
      duration: duration || 0,
      timestamp: Date.now(),
    };

    await dbManager.saveCallLog(log);

    // Automatically post in-chat message to the 1-on-1 conversation
    const statusText =
      status === 'missed'
        ? `🚫 මිස්ඩ් කෝල් එකක් (Missed ${callType === 'video' ? 'Video' : 'Audio'} Call)`
        : status === 'declined'
        ? `🚫 ඇමතුම ප්‍රතික්ෂේප විය (Call Declined)`
        : `📞 ${callType === 'video' ? 'වීඩියෝ ඇමතුම' : 'ස්වර ඇමතුම'} • කාලය: ${Math.floor(
            (duration || 0) / 60
          )}m ${(duration || 0) % 60}s`;

    const chatMsg: MessageDoc = {
      id: 'dm_call_' + Date.now(),
      channel: 'direct',
      senderId: caller.id,
      senderName: caller.name,
      senderPhone: caller.phone,
      senderAvatar: caller.avatar,
      senderVerified: caller.isVerified,
      recipientId: receiver.id,
      text: statusText,
      callInfo: {
        type: callType,
        status,
        duration,
      },
      timestamp: Date.now(),
    };

    await dbManager.saveMessage(chatMsg);

    sendToUser(receiver.id, { type: 'new_direct_message', message: chatMsg });
    sendToUser(caller.id, { type: 'new_direct_message', message: chatMsg });

    // Send call log event
    sendToUser(receiver.id, { type: 'new_call_log', call: log });
    sendToUser(caller.id, { type: 'new_call_log', call: log });

    res.json({ success: true, log });
  } catch (error) {
    console.error('call log error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect to MongoDB
dbManager.connect().catch((err) => {
  console.error('[DB Startup]', err);
});

// Setup Frontend
async function setupFrontend() {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT) || 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[LK ONLINE Server] Running on http://0.0.0.0:${port}`);
  });
}

setupFrontend().catch((err) => {
  console.error('[Frontend Setup Failure]', err);
});
