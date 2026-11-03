/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, Message, Group, StatusItem, CallLog, CallSession } from './types';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { UserListSidebar } from './components/UserListSidebar';
import { OpenChannelView } from './components/OpenChannelView';
import { DirectChatView } from './components/DirectChatView';
import { GroupChatView } from './components/GroupChatView';
import { CallModal } from './components/CallModal';
import { MyOtpModal } from './components/MyOtpModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { UsersDirectoryModal } from './components/UsersDirectoryModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { GroupInfoModal } from './components/GroupInfoModal';
import { CreateStatusModal } from './components/CreateStatusModal';
import { StatusViewerModal } from './components/StatusViewerModal';
import { soundEngine } from './utils/audio';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('lk_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lk_token'));

  // Active chat target: 'open' | 'direct' | 'group'
  const [selectedTarget, setSelectedTarget] = useState<{
    type: 'open' | 'direct' | 'group';
    data?: any;
  }>({ type: 'open' });

  // Collections
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [activeConversations, setActiveConversations] = useState<User[]>([]);

  // Messages
  const [channelMessages, setChannelMessages] = useState<Message[]>([]);
  const [directMessages, setDirectMessages] = useState<Message[]>([]);
  const [groupMessages, setGroupMessages] = useState<Message[]>([]);

  // Typing
  const [channelTyping, setChannelTyping] = useState<string[]>([]);
  const [isDirectTyping, setIsDirectTyping] = useState<boolean>(false);

  // Modals state
  const [mongoConnected, setMongoConnected] = useState<boolean>(true);
  const [showMyOtp, setShowMyOtp] = useState<boolean>(false);
  const [showProfileEdit, setShowProfileEdit] = useState<boolean>(false);
  const [showUsersDirectory, setShowUsersDirectory] = useState<boolean>(false);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showGroupInfo, setShowGroupInfo] = useState<Group | null>(null);
  const [showCreateStatus, setShowCreateStatus] = useState<boolean>(false);
  const [activeViewingStatus, setActiveViewingStatus] = useState<StatusItem | null>(null);

  // WebRTC Call state
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const selectedTargetRef = useRef(selectedTarget);
  selectedTargetRef.current = selectedTarget;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // Poll system status
  useEffect(() => {
    const checkSystem = async () => {
      try {
        const res = await fetch('/api/system/status');
        if (res.ok) {
          const data = await res.json();
          setMongoConnected(data.mongodb?.connected ?? true);
        }
      } catch {
        //
      }
    };
    checkSystem();
    const interval = setInterval(checkSystem, 15000);
    return () => clearInterval(interval);
  }, []);

  // Load all initial data (users, channel messages, groups, statuses, call logs)
  const loadAllData = async () => {
    if (!currentUser) return;
    try {
      const [usersRes, channelRes, groupsRes, statusesRes, callsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/messages/channel'),
        fetch('/api/groups'),
        fetch('/api/statuses'),
        fetch('/api/calls', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);

        // Derive active conversations from recent contacts or direct messages
        const otherUsers = (data.users || []).filter((u: User) => u.id !== currentUser.id);
        // Include system admin or active users who messaged
        setActiveConversations((prev) => {
          if (prev.length > 0) return prev;
          // Initial conversation with system admin
          const sys = otherUsers.find((u: User) => u.id === 'system_lk_admin');
          return sys ? [sys] : otherUsers.slice(0, 3);
        });
      }

      if (channelRes.ok) {
        const data = await channelRes.json();
        setChannelMessages(data.messages || []);
      }

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data.groups || []);
      }

      if (statusesRes.ok) {
        const data = await statusesRes.json();
        setStatuses(data.statuses || []);
      }

      if (callsRes.ok) {
        const data = await callsRes.json();
        setCallLogs(data.calls || []);
      }
    } catch (err) {
      console.error('Data load error', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  // Load direct messages when target user changes
  useEffect(() => {
    if (currentUser && selectedTarget.type === 'direct' && selectedTarget.data) {
      fetch(`/api/messages/direct/${selectedTarget.data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setDirectMessages(data.messages || []);
        })
        .catch(console.error);
    }
  }, [selectedTarget, currentUser, token]);

  // Load group messages when target group changes
  useEffect(() => {
    if (currentUser && selectedTarget.type === 'group' && selectedTarget.data) {
      fetch(`/api/messages/group/${selectedTarget.data.id}`)
        .then((res) => res.json())
        .then((data) => {
          setGroupMessages(data.messages || []);
        })
        .catch(console.error);
    }
  }, [selectedTarget, currentUser]);

  // WebSocket Connection
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
    };

    socket.onmessage = async (evt) => {
      try {
        const data = JSON.parse(evt.data);

        switch (data.type) {
          case 'new_message': {
            setChannelMessages((prev) => [...prev, data.message]);
            if (data.message.senderId !== currentUser.id) {
              soundEngine.playMessagePing();
            }
            break;
          }

          case 'new_direct_message': {
            const msg = data.message;
            const currentTarget = selectedTargetRef.current;
            const myUser = currentUserRef.current;

            // If active chat is open with either sender or recipient, append to directMessages
            if (
              currentTarget.type === 'direct' &&
              (currentTarget.data.id === msg.senderId || currentTarget.data.id === msg.recipientId)
            ) {
              setDirectMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            }

            // Ensure sender is added to activeConversations so they appear on main chat list!
            const partnerId = msg.senderId === myUser?.id ? msg.recipientId : msg.senderId;
            setUsers((prevUsers) => {
              const partner = prevUsers.find((u) => u.id === partnerId);
              if (partner) {
                setActiveConversations((prevConvs) => {
                  if (prevConvs.some((c) => c.id === partner.id)) return prevConvs;
                  return [partner, ...prevConvs];
                });
              }
              return prevUsers;
            });

            if (msg.senderId !== myUser?.id) {
              soundEngine.playMessagePing();
            }
            break;
          }

          case 'new_group_message': {
            const msg = data.message;
            const currentTarget = selectedTargetRef.current;
            if (currentTarget.type === 'group' && currentTarget.data.id === msg.groupId) {
              setGroupMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            }
            if (msg.senderId !== currentUserRef.current?.id) {
              soundEngine.playMessagePing();
            }
            break;
          }

          case 'new_group_created': {
            setGroups((prev) => {
              if (prev.some((g) => g.id === data.group.id)) return prev;
              return [data.group, ...prev];
            });
            break;
          }

          case 'group_updated': {
            setGroups((prev) =>
              prev.map((g) => (g.id === data.group.id ? data.group : g))
            );
            if (showGroupInfo?.id === data.group.id) {
              setShowGroupInfo(data.group);
            }
            break;
          }

          case 'new_status': {
            setStatuses((prev) => [data.status, ...prev]);
            break;
          }

          case 'status_reaction_updated': {
            setStatuses((prev) =>
              prev.map((s) =>
                s.id === data.statusId ? { ...s, reactions: data.reactions } : s
              )
            );
            if (activeViewingStatus?.id === data.statusId) {
              setActiveViewingStatus((prev) =>
                prev ? { ...prev, reactions: data.reactions } : null
              );
            }
            break;
          }

          case 'new_call_log': {
            setCallLogs((prev) => [data.call, ...prev]);
            break;
          }

          case 'user_status_changed': {
            setUsers((prev) =>
              prev.map((u) => (u.id === data.userId ? { ...u, status: data.status } : u))
            );
            setActiveConversations((prev) =>
              prev.map((u) => (u.id === data.userId ? { ...u, status: data.status } : u))
            );
            break;
          }

          case 'user_profile_updated': {
            setUsers((prev) =>
              prev.map((u) => (u.id === data.user.id ? { ...u, ...data.user } : u))
            );
            setActiveConversations((prev) =>
              prev.map((u) => (u.id === data.user.id ? { ...u, ...data.user } : u))
            );
            break;
          }

          case 'user_registered': {
            setUsers((prev) => {
              if (prev.some((u) => u.id === data.user.id)) return prev;
              return [...prev, data.user];
            });
            break;
          }

          case 'user_typing': {
            if (data.channel === 'open') {
              if (data.isTyping && data.userId !== currentUser.id) {
                setChannelTyping((prev) => Array.from(new Set([...prev, data.name])));
              } else {
                setChannelTyping((prev) => prev.filter((n) => n !== data.name));
              }
            } else if (
              data.channel === 'direct' &&
              selectedTargetRef.current.type === 'direct' &&
              selectedTargetRef.current.data?.id === data.userId
            ) {
              setIsDirectTyping(data.isTyping);
            }
            break;
          }

          // ===== WebRTC Signaling =====
          case 'incoming_call': {
            soundEngine.playIncomingRingtone();
            setCallSession({
              isActive: true,
              isIncoming: true,
              peerUser: {
                id: data.callerId,
                name: data.callerName,
                phone: data.callerPhone,
                avatar: data.callerAvatar,
              },
              callType: data.callType,
              status: 'ringing',
            });
            (window as any).__pendingOffer = data.sdpOffer;
            break;
          }

          case 'call_accepted': {
            soundEngine.playCallConnected();
            if (peerConnRef.current && data.sdpAnswer) {
              await peerConnRef.current.setRemoteDescription(
                new RTCSessionDescription(data.sdpAnswer)
              );
              while (pendingCandidatesRef.current.length > 0) {
                const candidate = pendingCandidatesRef.current.shift()!;
                await peerConnRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
            }
            setCallSession((prev) =>
              prev ? { ...prev, status: 'connected', startedAt: Date.now() } : null
            );
            break;
          }

          case 'ice_candidate': {
            if (peerConnRef.current && peerConnRef.current.remoteDescription) {
              await peerConnRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
              pendingCandidatesRef.current.push(data.candidate);
            }
            break;
          }

          case 'call_declined': {
            soundEngine.playCallEnded();
            // Log declined call
            if (callSession) {
              logCallHistory(currentUser.id, callSession.peerUser.id, callSession.callType, 'declined', 0);
            }
            cleanupCall();
            alert('ඇමතුම ප්‍රතික්ෂේප විය. (Call was declined)');
            break;
          }

          case 'call_ended': {
            soundEngine.playCallEnded();
            cleanupCall();
            break;
          }
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    };

    return () => {
      socket.close();
    };
  }, [currentUser]);

  // Log call in DB
  const logCallHistory = async (
    callerId: string,
    receiverId: string,
    callType: 'audio' | 'video',
    status: 'completed' | 'missed' | 'declined',
    duration: number
  ) => {
    try {
      await fetch('/api/calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callerId, receiverId, callType, status, duration }),
      });
    } catch (e) {
      console.error('Call log error', e);
    }
  };

  const cleanupCall = () => {
    soundEngine.stopRingtone();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((t) => t.stop());
      setRemoteStream(null);
    }
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    pendingCandidatesRef.current = [];
    (window as any).__pendingOffer = null;
    setCallSession(null);
  };

  const createPeerConnection = (targetUserId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      const [remote] = event.streams;
      setRemoteStream(remote);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ice_candidate',
            targetUserId,
            candidate: event.candidate,
          })
        );
      }
    };

    return pc;
  };

  // Start Call
  const handleStartCall = async (targetUser: User, callType: 'video' | 'audio') => {
    if (!currentUser) return;
    try {
      soundEngine.playOutgoingRingback();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      });
      setLocalStream(stream);

      setCallSession({
        isActive: true,
        isIncoming: false,
        peerUser: {
          id: targetUser.id,
          name: targetUser.name,
          phone: targetUser.phone,
          avatar: targetUser.avatar,
        },
        callType,
        status: 'calling',
      });

      const pc = createPeerConnection(targetUser.id, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call_initiate',
            targetUserId: targetUser.id,
            callerName: currentUser.name,
            callerPhone: currentUser.phone,
            callerAvatar: currentUser.avatar,
            callType,
            sdpOffer: offer,
          })
        );
      }
    } catch (err: any) {
      soundEngine.stopRingtone();
      cleanupCall();
      alert(`කැමරාව හෝ මයික්‍රෆෝනය ලබාගත නොහැකි විය: ${err.message}`);
    }
  };

  // Accept Call
  const handleAcceptCall = async () => {
    if (!callSession || !currentUser) return;
    soundEngine.stopRingtone();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callSession.callType === 'video',
        audio: true,
      });
      setLocalStream(stream);

      const pc = createPeerConnection(callSession.peerUser.id, stream);
      const offer = (window as any).__pendingOffer;

      if (offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'call_answer',
              callerId: callSession.peerUser.id,
              sdpAnswer: answer,
            })
          );
        }

        soundEngine.playCallConnected();
        setCallSession((prev) =>
          prev ? { ...prev, status: 'connected', startedAt: Date.now() } : null
        );
      }
    } catch (err: any) {
      cleanupCall();
      alert(`කෝල් එක පිළිගැනීමට නොහැකි විය: ${err.message}`);
    }
  };

  // Decline Call
  const handleDeclineCall = () => {
    if (callSession && currentUser) {
      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call_decline',
            callerId: callSession.peerUser.id,
          })
        );
      }
      logCallHistory(callSession.peerUser.id, currentUser.id, callSession.callType, 'missed', 0);
    }
    cleanupCall();
  };

  // Hangup Call
  const handleHangupCall = () => {
    if (callSession && currentUser) {
      const duration = callSession.startedAt
        ? Math.floor((Date.now() - callSession.startedAt) / 1000)
        : 0;

      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call_hangup',
            targetUserId: callSession.peerUser.id,
          })
        );
      }

      logCallHistory(
        callSession.isIncoming ? callSession.peerUser.id : currentUser.id,
        callSession.isIncoming ? currentUser.id : callSession.peerUser.id,
        callSession.callType,
        callSession.status === 'connected' ? 'completed' : 'missed',
        duration
      );
    }
    soundEngine.playCallEnded();
    cleanupCall();
  };

  const handleToggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallSession((prev) => (prev ? { ...prev, isMuted: !audioTrack.enabled } : null));
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallSession((prev) => (prev ? { ...prev, isVideoOff: !videoTrack.enabled } : null));
      }
    }
  };

  // Send Direct Message (Kasun to Nadun fix!)
  const handleSendDirectMessage = async (payload: {
    text?: string;
    sticker?: string;
    emoji?: string;
    voiceAudio?: string;
    voiceDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
  }) => {
    if (!currentUser || selectedTarget.type !== 'direct' || !selectedTarget.data) return;
    const targetUser: User = selectedTarget.data;

    try {
      const res = await fetch('/api/messages/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId: targetUser.id,
          text: payload.text,
          sticker: payload.sticker,
          emoji: payload.emoji,
          voiceAudio: payload.voiceAudio,
          voiceDuration: payload.voiceDuration,
          replyTo: payload.replyTo,
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        // Immediately update sender's local state!
        setDirectMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });

        // Add to active conversations
        setActiveConversations((prev) => {
          if (prev.some((c) => c.id === targetUser.id)) return prev;
          return [targetUser, ...prev];
        });
      }
    } catch (err) {
      console.error('Send direct error', err);
    }
  };

  // Send Channel Message
  const handleSendChannelMessage = async (payload: {
    text?: string;
    sticker?: string;
    emoji?: string;
    voiceAudio?: string;
    voiceDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
  }) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/messages/channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          text: payload.text,
          sticker: payload.sticker,
          emoji: payload.emoji,
          voiceAudio: payload.voiceAudio,
          voiceDuration: payload.voiceDuration,
          replyTo: payload.replyTo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setChannelMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error('Send channel error', err);
    }
  };

  // Send Group Message
  const handleSendGroupMessage = async (payload: {
    text?: string;
    sticker?: string;
    emoji?: string;
    voiceAudio?: string;
    voiceDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
  }) => {
    if (!currentUser || selectedTarget.type !== 'group' || !selectedTarget.data) return;
    const group: Group = selectedTarget.data;

    try {
      const res = await fetch('/api/messages/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          senderId: currentUser.id,
          text: payload.text,
          sticker: payload.sticker,
          emoji: payload.emoji,
          voiceAudio: payload.voiceAudio,
          voiceDuration: payload.voiceDuration,
          replyTo: payload.replyTo,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setGroupMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error('Send group message error', err);
    }
  };

  // Toggle Reaction on message
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/messages/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
          userId: currentUser.id,
        }),
      });
    } catch (err) {
      console.error('Reaction error', err);
    }
  };

  // Create Group
  const handleCreateGroup = async (groupData: {
    name: string;
    description?: string;
    icon?: string;
    memberIds: string[];
  }) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...groupData,
          ownerId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.group) {
        setGroups((prev) => [data.group, ...prev]);
        setSelectedTarget({ type: 'group', data: data.group });
      }
    } catch (err) {
      console.error('Create group error', err);
    }
  };

  // Make Admin in Group (Rule: Owner can grant admin, but cannot remove)
  const handleMakeAdmin = async (groupId: string, memberId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          requesterId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.group) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? data.group : g)));
        setShowGroupInfo(data.group);
        alert('සාමාජිකයා සාර්ථකව Admin ලෙස පත් කරන ලදී! (Admin granted)');
      } else {
        alert(data.error || 'Admin ලබාදිය නොහැකි විය.');
      }
    } catch (err) {
      console.error('Make admin error', err);
    }
  };

  // Create 24h Status
  const handleCreateStatus = async (statusData: {
    text?: string;
    bgGradient?: string;
    mediaUrl?: string;
  }) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          ...statusData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setStatuses((prev) => [data.status, ...prev]);
      }
    } catch (err) {
      console.error('Create status error', err);
    }
  };

  // Status Reaction
  const handleStatusReact = async (statusId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/statuses/${statusId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          emoji,
        }),
      });
    } catch (e) {
      console.error('Status react error', e);
    }
  };

  // Status Reply (sends direct message to author)
  const handleStatusReply = async (statusId: string, text: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/statuses/${statusId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          text,
        }),
      });
      alert('ඔබගේ Reply එක පණිවිඩයක් ලෙස යවන ලදී! (Reply sent as DM)');
    } catch (e) {
      console.error('Status reply error', e);
    }
  };

  // Profile Update (Name, Bio, Avatar, Verified Badge)
  const handleUpdateProfile = async (updates: {
    name: string;
    bio: string;
    avatar: string;
    isVerified: boolean;
  }) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('lk_user', JSON.stringify(data.user));
        alert('පැතිකඩ සාර්ථකව යාවත්කාලීන විය! (Profile updated)');
      }
    } catch (err) {
      console.error('Profile update error', err);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('lk_token');
    localStorage.removeItem('lk_user');
    setCurrentUser(null);
    setToken(null);
    cleanupCall();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090c] text-white font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeCall={callSession}
        mongoConnected={mongoConnected}
        onLogout={handleLogout}
        onOpenMyOtpModal={() => setShowMyOtp(true)}
        onOpenProfileEdit={() => setShowProfileEdit(true)}
        onOpenUsersDirectory={() => setShowUsersDirectory(true)}
      />

      {/* Main Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentUser ? (
          <>
            {/* Sidebar with WhatsApp Style Tabs */}
            <div
              className={`${
                selectedTarget.type !== 'open' ? 'hidden md:flex' : 'flex'
              } w-full md:w-auto h-full shrink-0`}
            >
              <UserListSidebar
                currentUser={currentUser}
                users={users}
                groups={groups}
                statuses={statuses}
                callLogs={callLogs}
                activeConversations={activeConversations}
                selectedTarget={selectedTarget}
                onSelectOpenChannel={() => setSelectedTarget({ type: 'open' })}
                onSelectDirectChat={(u) => {
                  setSelectedTarget({ type: 'direct', data: u });
                  if (!activeConversations.some((c) => c.id === u.id)) {
                    setActiveConversations((prev) => [u, ...prev]);
                  }
                }}
                onSelectGroupChat={(g) => setSelectedTarget({ type: 'group', data: g })}
                onOpenUsersDirectory={() => setShowUsersDirectory(true)}
                onOpenCreateGroup={() => setShowCreateGroup(true)}
                onOpenCreateStatus={() => setShowCreateStatus(true)}
                onViewStatus={(st) => setActiveViewingStatus(st)}
                onStartCall={(target, type) => handleStartCall(target, type)}
              />
            </div>

            {/* Chat Stage */}
            <div
              className={`${
                selectedTarget.type === 'open' ? 'hidden md:flex' : 'flex'
              } flex-1 h-full overflow-hidden`}
            >
              {selectedTarget.type === 'direct' && selectedTarget.data ? (
                <DirectChatView
                  currentUser={currentUser}
                  targetUser={selectedTarget.data}
                  messages={directMessages}
                  isTargetTyping={isDirectTyping}
                  onSendMessage={handleSendDirectMessage}
                  onSendTyping={(isTyping) => {
                    if (wsRef.current) {
                      wsRef.current.send(
                        JSON.stringify({
                          type: 'typing',
                          channel: 'direct',
                          name: currentUser.name,
                          recipientId: selectedTarget.data.id,
                          isTyping,
                        })
                      );
                    }
                  }}
                  onStartCall={(type) => handleStartCall(selectedTarget.data, type)}
                  onBack={() => setSelectedTarget({ type: 'open' })}
                />
              ) : selectedTarget.type === 'group' && selectedTarget.data ? (
                <GroupChatView
                  group={selectedTarget.data}
                  currentUser={currentUser}
                  messages={groupMessages}
                  onSendMessage={handleSendGroupMessage}
                  onOpenInfo={() => setShowGroupInfo(selectedTarget.data)}
                  onBack={() => setSelectedTarget({ type: 'open' })}
                />
              ) : (
                <OpenChannelView
                  currentUser={currentUser}
                  messages={channelMessages}
                  typingUsers={channelTyping}
                  onSendMessage={handleSendChannelMessage}
                  onSendTyping={(isTyping) => {
                    if (wsRef.current) {
                      wsRef.current.send(
                        JSON.stringify({
                          type: 'typing',
                          channel: 'open',
                          name: currentUser.name,
                          isTyping,
                        })
                      );
                    }
                  }}
                  onReact={handleReaction}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-[#0a0a0e] to-black">
            <AuthModal
              onSuccess={(user, tok) => {
                setCurrentUser(user);
                setToken(tok);
              }}
            />
          </div>
        )}
      </main>

      {/* WebRTC Audio/Video Call Modal */}
      {callSession && (
        <CallModal
          session={callSession}
          localStream={localStream}
          remoteStream={remoteStream}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          onHangup={handleHangupCall}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
        />
      )}

      {/* Authenticator Quick Code Modal */}
      {showMyOtp && currentUser && (
        <MyOtpModal
          currentUser={currentUser}
          onClose={() => setShowMyOtp(false)}
        />
      )}

      {/* Profile & Verified Settings Modal */}
      {showProfileEdit && currentUser && (
        <ProfileEditModal
          currentUser={currentUser}
          onClose={() => setShowProfileEdit(false)}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Dedicated Users Directory Modal */}
      {showUsersDirectory && currentUser && (
        <UsersDirectoryModal
          users={users}
          currentUserId={currentUser.id}
          onClose={() => setShowUsersDirectory(false)}
          onStartChat={(user) => {
            setSelectedTarget({ type: 'direct', data: user });
            if (!activeConversations.some((c) => c.id === user.id)) {
              setActiveConversations((prev) => [user, ...prev]);
            }
          }}
          onStartCall={(target, type) => handleStartCall(target, type)}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && currentUser && (
        <CreateGroupModal
          currentUser={currentUser}
          users={users}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {/* Group Info & Admin Delegation Modal */}
      {showGroupInfo && currentUser && (
        <GroupInfoModal
          group={showGroupInfo}
          currentUser={currentUser}
          users={users}
          onClose={() => setShowGroupInfo(null)}
          onMakeAdmin={handleMakeAdmin}
        />
      )}

      {/* Create 24h Status Modal */}
      {showCreateStatus && currentUser && (
        <CreateStatusModal
          currentUser={currentUser}
          onClose={() => setShowCreateStatus(false)}
          onSubmit={handleCreateStatus}
        />
      )}

      {/* Status Viewer Modal with Reactions & Reply */}
      {activeViewingStatus && currentUser && (
        <StatusViewerModal
          status={activeViewingStatus}
          currentUser={currentUser}
          onClose={() => setActiveViewingStatus(null)}
          onReact={handleStatusReact}
          onReply={handleStatusReply}
        />
      )}
    </div>
  );
}
