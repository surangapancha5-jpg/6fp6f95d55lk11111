export interface User {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'offline' | 'in-call' | 'busy';
  isVerified?: boolean;
  customBadge?: string;
  lastSeen?: number;
  createdAt?: number;
}

export interface Message {
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

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  createdAt: number;
}

export interface StatusItem {
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

export interface CallLog {
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

export interface CallSession {
  isActive: boolean;
  isIncoming: boolean;
  peerUser: {
    id: string;
    name: string;
    phone: string;
    avatar: string;
  };
  callType: 'video' | 'audio';
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  startedAt?: number;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface StickerItem {
  id: string;
  name: string;
  category: 'sinhala' | 'pride' | 'reactions' | 'luxury';
  sinhalaText?: string;
  subText?: string;
  icon?: string;
  badgeColor?: string;
  bgGradient?: string;
}
