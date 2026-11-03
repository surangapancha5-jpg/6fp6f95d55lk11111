import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export interface UserDoc {
  id: string;
  phone: string;
  name: string;
  password: string;
  authenticatorSecret: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'offline' | 'in-call' | 'busy';
  isVerified?: boolean;
  customBadge?: string;
  lastSeen: number;
  createdAt: number;
}

export interface MessageDoc {
  id: string;
  channel: 'open' | 'direct' | 'group';
  senderId: string;
  senderName: string;
  senderPhone: string;
  senderAvatar?: string;
  senderVerified?: boolean;
  recipientId?: string;
  groupId?: string;
  text?: string;
  sticker?: string;
  emoji?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio';
  voiceAudio?: string;
  voiceDuration?: number;
  callInfo?: {
    type: 'audio' | 'video';
    status: 'missed' | 'completed' | 'declined';
    duration?: number;
  };
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  timestamp: number;
  reactions?: Record<string, string[]>;
}

export interface GroupDoc {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  createdAt: number;
}

export interface StatusDoc {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userPhone: string;
  userVerified?: boolean;
  text?: string;
  bgGradient?: string;
  mediaUrl?: string;
  createdAt: number;
  expiresAt: number;
  reactions?: Record<string, string[]>;
  replies?: {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
  }[];
}

export interface CallLogDoc {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  callerPhone: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  receiverPhone: string;
  callType: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined';
  duration?: number;
  timestamp: number;
}

const DEFAULT_MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://therasalk9999_db_user:lNFIF60izF65ekpX@cluster0.fglue0z.mongodb.net/dark-dinu?retryWrites=true&w=majority&appName=Cluster0';

class DatabaseManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;
  private connectionAttempted: boolean = false;

  // In-memory cache ensures zero downtime and instant UI responsiveness
  private usersCache: Map<string, UserDoc> = new Map();
  private messagesCache: MessageDoc[] = [];
  private groupsCache: Map<string, GroupDoc> = new Map();
  private statusesCache: StatusDoc[] = [];
  private callLogsCache: CallLogDoc[] = [];

  constructor() {
    this.seedInitialWelcomeMessages();
  }

  private seedInitialWelcomeMessages() {
    const now = Date.now();
    
    // Official System User
    const systemUser: UserDoc = {
      id: 'system_lk_admin',
      phone: '0700000000',
      name: 'LK ONLINE Official',
      password: 'system_secret_protected',
      authenticatorSecret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      bio: 'LK ONLINE Official System & Lounge 🇱🇰',
      status: 'online',
      isVerified: true,
      customBadge: 'OFFICIAL 👑',
      lastSeen: now,
      createdAt: now - 86400000,
    };
    this.usersCache.set(systemUser.id, systemUser);

    // Zanta Mod special account as requested by user
    const zantaMod: UserDoc = {
      id: 'u_zanta_mod_special',
      phone: '0760264995',
      name: 'zanta mod',
      password: 'mathakana',
      authenticatorSecret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      bio: 'LK ONLINE Master Mod & VIP Verified 👑',
      status: 'online',
      isVerified: true,
      customBadge: 'VERIFIED MOD 👑',
      lastSeen: now,
      createdAt: now - 86400000,
    };
    this.usersCache.set(zantaMod.id, zantaMod);

    // Seed Open Channel message
    this.messagesCache.push({
      id: 'welcome_1',
      channel: 'open',
      senderId: systemUser.id,
      senderName: systemUser.name,
      senderPhone: systemUser.phone,
      senderAvatar: systemUser.avatar,
      senderVerified: true,
      text: 'සාදරයෙන් පිළිගන්නවා LK ONLINE වෙත! ❤️🇱🇰 මෙහි ලයිව් ඕපන් චැනල් එකෙන් කතා කරන්න, සජීවී ඇත්ත යූසර්ලාට Audio/Video Call ගන්න, WhatsApp ආකාරයෙන් Groups සාදන්න සහ 24-hour Status බෙදාගන්න පුළුවන්!',
      sticker: 'lion_lk',
      timestamp: now - 3600000,
      reactions: { '❤️': ['system_lk_admin'], '🇱🇰': ['system_lk_admin'] },
    });

    // Seed default Open Channel Group
    const openGroup: GroupDoc = {
      id: 'group_open_community',
      name: 'LK ONLINE Community 🇱🇰',
      description: 'ශ්‍රී ලාංකීය ප්‍රජාවගේ නිල සමූහය',
      icon: '🇱🇰',
      ownerId: systemUser.id,
      adminIds: [systemUser.id, zantaMod.id],
      memberIds: [systemUser.id, zantaMod.id],
      createdAt: now - 86400000,
    };
    this.groupsCache.set(openGroup.id, openGroup);
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected && this.db) return true;
    this.connectionAttempted = true;

    try {
      console.log('[MongoDB] Connecting to cluster...');
      this.client = new MongoClient(DEFAULT_MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      await this.client.connect();
      this.db = this.client.db('dark-dinu');
      this.isConnected = true;
      console.log('[MongoDB] Successfully connected to database: dark-dinu');

      await this.syncFromMongo();
      return true;
    } catch (err) {
      console.warn('[MongoDB] Working with memory mirror:', (err as Error).message);
      this.isConnected = false;
      return false;
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      cachedUsers: this.usersCache.size,
      cachedMessages: this.messagesCache.length,
      cachedGroups: this.groupsCache.size,
      cachedStatuses: this.statusesCache.length,
      cachedCallLogs: this.callLogsCache.length,
    };
  }

  private async syncFromMongo() {
    if (!this.db) return;
    try {
      const usersCol = this.db.collection<UserDoc>('users');
      const messagesCol = this.db.collection<MessageDoc>('messages');
      const groupsCol = this.db.collection<GroupDoc>('groups');
      const statusesCol = this.db.collection<StatusDoc>('statuses');
      const callLogsCol = this.db.collection<CallLogDoc>('call_logs');

      const mongoUsers = await usersCol.find({}).toArray();
      for (const u of mongoUsers) {
        // Enforce zanta mod verification
        if (u.phone === '0760264995') {
          u.isVerified = true;
          u.customBadge = 'VERIFIED MOD 👑';
        }
        this.usersCache.set(u.id, u);
      }

      const mongoMessages = await messagesCol.find({}).sort({ timestamp: -1 }).limit(300).toArray();
      if (mongoMessages.length > 0) {
        this.messagesCache = mongoMessages.reverse();
      }

      const mongoGroups = await groupsCol.find({}).toArray();
      for (const g of mongoGroups) {
        this.groupsCache.set(g.id, g);
      }

      const now = Date.now();
      const mongoStatuses = await statusesCol.find({ expiresAt: { $gt: now } }).toArray();
      if (mongoStatuses.length > 0) {
        this.statusesCache = mongoStatuses;
      }

      const mongoCallLogs = await callLogsCol.find({}).sort({ timestamp: -1 }).limit(100).toArray();
      if (mongoCallLogs.length > 0) {
        this.callLogsCache = mongoCallLogs;
      }

      console.log(`[MongoDB Sync] Synced ${mongoUsers.length} users, ${mongoMessages.length} messages, ${mongoGroups.length} groups.`);
    } catch (err) {
      console.error('[MongoDB Sync Error]', err);
    }
  }

  // ===== User Operations =====
  public async getUserByPhone(phone: string): Promise<UserDoc | null> {
    const cleanPhone = phone.trim();
    for (const u of this.usersCache.values()) {
      if (u.phone === cleanPhone) return u;
    }

    if (this.isConnected && this.db) {
      try {
        const doc = await this.db.collection<UserDoc>('users').findOne({ phone: cleanPhone });
        if (doc) {
          if (doc.phone === '0760264995') {
            doc.isVerified = true;
            doc.customBadge = 'VERIFIED MOD 👑';
          }
          this.usersCache.set(doc.id, doc);
          return doc;
        }
      } catch (e) {
        console.error('[MongoDB Error]', e);
      }
    }
    return null;
  }

  public async getUserById(id: string): Promise<UserDoc | null> {
    const cached = this.usersCache.get(id);
    if (cached) return cached;

    if (this.isConnected && this.db) {
      try {
        const doc = await this.db.collection<UserDoc>('users').findOne({ id });
        if (doc) {
          if (doc.phone === '0760264995') {
            doc.isVerified = true;
            doc.customBadge = 'VERIFIED MOD 👑';
          }
          this.usersCache.set(doc.id, doc);
          return doc;
        }
      } catch (e) {
        console.error('[MongoDB Error]', e);
      }
    }
    return null;
  }

  public async saveUser(user: UserDoc): Promise<UserDoc> {
    if (user.phone === '0760264995' || user.name.toLowerCase() === 'zanta mod') {
      user.isVerified = true;
      user.customBadge = 'VERIFIED MOD 👑';
    }
    this.usersCache.set(user.id, user);

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<UserDoc>('users').updateOne(
          { id: user.id },
          { $set: user },
          { upsert: true }
        );
      } catch (e) {
        console.error('[MongoDB Save User Error]', e);
      }
    }
    return user;
  }

  public async getAllUsers(): Promise<Omit<UserDoc, 'password' | 'authenticatorSecret'>[]> {
    const list: Omit<UserDoc, 'password' | 'authenticatorSecret'>[] = [];
    for (const u of this.usersCache.values()) {
      const { password, authenticatorSecret, ...safe } = u;
      list.push(safe);
    }
    return list;
  }

  public async updateUserStatus(id: string, status: UserDoc['status']) {
    const user = this.usersCache.get(id);
    if (user) {
      user.status = status;
      user.lastSeen = Date.now();
      await this.saveUser(user);
    }
  }

  public async updateProfile(
    id: string,
    updates: { name?: string; bio?: string; avatar?: string; isVerified?: boolean }
  ): Promise<UserDoc | null> {
    const user = await this.getUserById(id);
    if (!user) return null;

    if (updates.name) user.name = updates.name.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.avatar) user.avatar = updates.avatar;
    if (updates.isVerified !== undefined) {
      user.isVerified = updates.isVerified;
    }
    // Always keep zanta mod verified
    if (user.phone === '0760264995') {
      user.isVerified = true;
      user.customBadge = 'VERIFIED MOD 👑';
    }

    await this.saveUser(user);
    return user;
  }

  // ===== Message Operations =====
  public async saveMessage(msg: MessageDoc): Promise<MessageDoc> {
    this.messagesCache.push(msg);
    if (this.messagesCache.length > 2000) {
      this.messagesCache.shift();
    }

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<MessageDoc>('messages').insertOne({ ...msg });
      } catch (e) {
        console.error('[MongoDB Save Message Error]', e);
      }
    }
    return msg;
  }

  public async getChannelMessages(limit: number = 150): Promise<MessageDoc[]> {
    return this.messagesCache.filter((m) => m.channel === 'open').slice(-limit);
  }

  public async getDirectMessages(userA: string, userB: string, limit: number = 150): Promise<MessageDoc[]> {
    return this.messagesCache
      .filter(
        (m) =>
          m.channel === 'direct' &&
          ((m.senderId === userA && m.recipientId === userB) ||
            (m.senderId === userB && m.recipientId === userA))
      )
      .slice(-limit);
  }

  public async getGroupMessages(groupId: string, limit: number = 150): Promise<MessageDoc[]> {
    return this.messagesCache
      .filter((m) => m.channel === 'group' && m.groupId === groupId)
      .slice(-limit);
  }

  public async toggleReaction(messageId: string, emoji: string, userId: string): Promise<MessageDoc | null> {
    const msg = this.messagesCache.find((m) => m.id === messageId);
    if (!msg) return null;

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const idx = msg.reactions[emoji].indexOf(userId);
    if (idx >= 0) {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(userId);
    }

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<MessageDoc>('messages').updateOne(
          { id: messageId },
          { $set: { reactions: msg.reactions } }
        );
      } catch (e) {
        console.error('[MongoDB Reaction Error]', e);
      }
    }
    return msg;
  }

  // ===== Group Operations =====
  public async createGroup(group: GroupDoc): Promise<GroupDoc> {
    this.groupsCache.set(group.id, group);

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<GroupDoc>('groups').insertOne({ ...group });
      } catch (e) {
        console.error('[MongoDB Group Create Error]', e);
      }
    }
    return group;
  }

  public async getGroupById(groupId: string): Promise<GroupDoc | null> {
    const cached = this.groupsCache.get(groupId);
    if (cached) return cached;

    if (this.isConnected && this.db) {
      try {
        const doc = await this.db.collection<GroupDoc>('groups').findOne({ id: groupId });
        if (doc) {
          this.groupsCache.set(doc.id, doc);
          return doc;
        }
      } catch (e) {
        console.error('[MongoDB Group Error]', e);
      }
    }
    return null;
  }

  public async getAllGroups(): Promise<GroupDoc[]> {
    return Array.from(this.groupsCache.values());
  }

  // Grant admin to member (RULE: Owner can give admin, but CANNOT remove admins!)
  public async addAdminToGroup(groupId: string, memberId: string, requesterId: string): Promise<{ success: boolean; group?: GroupDoc; error?: string }> {
    const group = await this.getGroupById(groupId);
    if (!group) return { success: false, error: 'Group not found' };

    // Check requester permission (only owner or admins can grant admin)
    if (group.ownerId !== requesterId && !group.adminIds.includes(requesterId)) {
      return { success: false, error: 'Only owner or admins can grant admin rights' };
    }

    if (!group.memberIds.includes(memberId)) {
      group.memberIds.push(memberId);
    }

    if (!group.adminIds.includes(memberId)) {
      group.adminIds.push(memberId);
    }

    this.groupsCache.set(group.id, group);

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<GroupDoc>('groups').updateOne(
          { id: group.id },
          { $set: { adminIds: group.adminIds, memberIds: group.memberIds } }
        );
      } catch (e) {
        console.error('[MongoDB Group Update Error]', e);
      }
    }
    return { success: true, group };
  }

  public async addMemberToGroup(groupId: string, memberId: string): Promise<GroupDoc | null> {
    const group = await this.getGroupById(groupId);
    if (!group) return null;

    if (!group.memberIds.includes(memberId)) {
      group.memberIds.push(memberId);
      this.groupsCache.set(group.id, group);

      if (this.isConnected && this.db) {
        try {
          await this.db.collection<GroupDoc>('groups').updateOne(
            { id: group.id },
            { $set: { memberIds: group.memberIds } }
          );
        } catch (e) {
          console.error('[MongoDB Group Member Error]', e);
        }
      }
    }
    return group;
  }

  // ===== Status / Stories Operations (24-Hour Expiration) =====
  public async createStatus(status: StatusDoc): Promise<StatusDoc> {
    this.statusesCache.push(status);

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<StatusDoc>('statuses').insertOne({ ...status });
      } catch (e) {
        console.error('[MongoDB Status Error]', e);
      }
    }
    return status;
  }

  public async getActiveStatuses(): Promise<StatusDoc[]> {
    const now = Date.now();
    // Filter out expired (> 24 hours)
    this.statusesCache = this.statusesCache.filter((s) => s.expiresAt > now);

    if (this.isConnected && this.db) {
      try {
        // Automatically purge expired from MongoDB
        await this.db.collection<StatusDoc>('statuses').deleteMany({ expiresAt: { $lte: now } });
      } catch (e) {
        //
      }
    }
    return this.statusesCache;
  }

  public async addReactionToStatus(statusId: string, emoji: string, userId: string): Promise<StatusDoc | null> {
    const status = this.statusesCache.find((s) => s.id === statusId);
    if (!status) return null;

    if (!status.reactions) status.reactions = {};
    if (!status.reactions[emoji]) status.reactions[emoji] = [];

    const idx = status.reactions[emoji].indexOf(userId);
    if (idx >= 0) {
      status.reactions[emoji].splice(idx, 1);
    } else {
      status.reactions[emoji].push(userId);
    }

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<StatusDoc>('statuses').updateOne(
          { id: statusId },
          { $set: { reactions: status.reactions } }
        );
      } catch (e) {
        console.error('[MongoDB Status Reaction Error]', e);
      }
    }
    return status;
  }

  public async addReplyToStatus(
    statusId: string,
    reply: { userId: string; userName: string; text: string }
  ): Promise<StatusDoc | null> {
    const status = this.statusesCache.find((s) => s.id === statusId);
    if (!status) return null;

    if (!status.replies) status.replies = [];
    const newReply = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ...reply,
      timestamp: Date.now(),
    };
    status.replies.push(newReply);

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<StatusDoc>('statuses').updateOne(
          { id: statusId },
          { $push: { replies: newReply } as any }
        );
      } catch (e) {
        console.error('[MongoDB Status Reply Error]', e);
      }
    }
    return status;
  }

  // ===== Call Logs Operations =====
  public async saveCallLog(callLog: CallLogDoc): Promise<CallLogDoc> {
    this.callLogsCache.unshift(callLog);
    if (this.callLogsCache.length > 200) {
      this.callLogsCache.pop();
    }

    if (this.isConnected && this.db) {
      try {
        await this.db.collection<CallLogDoc>('call_logs').insertOne({ ...callLog });
      } catch (e) {
        console.error('[MongoDB Call Log Error]', e);
      }
    }
    return callLog;
  }

  public async getCallLogsForUser(userId: string): Promise<CallLogDoc[]> {
    return this.callLogsCache.filter((c) => c.callerId === userId || c.receiverId === userId);
  }
}

export const dbManager = new DatabaseManager();
