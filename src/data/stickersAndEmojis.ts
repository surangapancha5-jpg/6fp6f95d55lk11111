import { StickerItem } from '../types';

export const STICKER_PACKS: { id: string; title: string; icon: string; stickers: StickerItem[] }[] = [
  {
    id: 'sinhala_slang',
    title: 'ගැම්ම (Sinhala Gang)',
    icon: '🔥',
    stickers: [
      { id: 'st_ado', name: 'Ado', category: 'sinhala', sinhalaText: 'අඩෝ!', subText: 'Bro! What?!', icon: '⚡', bgGradient: 'from-red-600 to-amber-600', badgeColor: '#ef4444' },
      { id: 'st_supiri', name: 'Supiri', category: 'sinhala', sinhalaText: 'සුපිරි මචං!', subText: 'Superb Mate', icon: '⭐', bgGradient: 'from-amber-500 to-red-600', badgeColor: '#f59e0b' },
      { id: 'st_gammak', name: 'Gammak', category: 'sinhala', sinhalaText: 'ගැම්මක් තමයි!', subText: 'Pure Fire Power', icon: '🔥', bgGradient: 'from-rose-600 to-red-700', badgeColor: '#e11d48' },
      { id: 'st_ela', name: 'Ela Kollek', category: 'sinhala', sinhalaText: 'එල කොල්ලෙක්!', subText: 'Legend Guy', icon: '🤙', bgGradient: 'from-emerald-600 to-teal-800', badgeColor: '#10b981' },
      { id: 'st_sirawata', name: 'Sirawata', category: 'sinhala', sinhalaText: 'සිරාවටමද?!', subText: 'Seriously?!', icon: '👀', bgGradient: 'from-indigo-600 to-purple-800', badgeColor: '#6366f1' },
      { id: 'st_adarei', name: 'Adarei', category: 'sinhala', sinhalaText: 'ආදරෙයි පැලෙන්න!', subText: 'Big Love', icon: '❤️', bgGradient: 'from-pink-600 to-rose-700', badgeColor: '#ec4899' },
      { id: 'st_budusaranai', name: 'Budu Saranai', category: 'sinhala', sinhalaText: 'බුදු සරණයි! 🙏', subText: 'Blessings', icon: '🌸', bgGradient: 'from-yellow-600 to-amber-700', badgeColor: '#eab308' },
      { id: 'st_thanks', name: 'Thanks Machan', category: 'sinhala', sinhalaText: 'තැන්ක්ස් මචං!', subText: 'Thanks Brother', icon: '🤝', bgGradient: 'from-cyan-600 to-blue-700', badgeColor: '#06b6d4' },
    ],
  },
  {
    id: 'lk_pride',
    title: 'ශ්‍රී ලංකා (LK Pride)',
    icon: '🇱🇰',
    stickers: [
      { id: 'st_lion', name: 'Lion King', category: 'pride', sinhalaText: 'සිංහ ලේ 🇱🇰', subText: 'Proud Sri Lankan', icon: '🦁', bgGradient: 'from-amber-600 to-red-800', badgeColor: '#d97706' },
      { id: 'st_tea', name: 'Ceylon Tea', category: 'pride', sinhalaText: 'තේ කෝප්පයක් ☕', subText: 'Cup of Pure Ceylon', icon: '☕', bgGradient: 'from-amber-800 to-stone-900', badgeColor: '#78350f' },
      { id: 'st_cricket', name: 'Lions Cheer', category: 'pride', sinhalaText: 'චියර් ලයන්ස්! 🏏', subText: 'LK Cricket Spirit', icon: '🏏', bgGradient: 'from-blue-600 to-indigo-900', badgeColor: '#2563eb' },
      { id: 'st_tuk', name: 'Tuk Tuk Rush', category: 'pride', sinhalaText: 'ටුක් ටුක් රේස් 🛺', subText: 'Colombo Drifting', icon: '🛺', bgGradient: 'from-red-600 to-rose-800', badgeColor: '#dc2626' },
      { id: 'st_island', name: 'Pearl Island', category: 'pride', sinhalaText: 'පාරාදීසය 🏝️', subText: 'Paradise Island', icon: '🏝️', bgGradient: 'from-teal-600 to-emerald-800', badgeColor: '#0d9488' },
      { id: 'st_kottu', name: 'Kottu Beat', category: 'pride', sinhalaText: 'කොත්තු සද්දේ 🍽️', subText: 'Late Night Kottu', icon: '🌶️', bgGradient: 'from-orange-600 to-red-800', badgeColor: '#ea580c' },
    ],
  },
  {
    id: 'luxury_vip',
    title: 'ප්‍රිමියම් (VIP LK)',
    icon: '💎',
    stickers: [
      { id: 'st_vip', name: 'LK VIP', category: 'luxury', sinhalaText: 'LK ONLINE VIP 👑', subText: 'Verified Member', icon: '💎', bgGradient: 'from-red-600 via-rose-700 to-black', badgeColor: '#ef4444' },
      { id: 'st_dark_king', name: 'Dark King', category: 'luxury', sinhalaText: 'DARK DINU 🔥', subText: 'Master Key Holder', icon: '👑', bgGradient: 'from-stone-900 via-red-950 to-black', badgeColor: '#991b1b' },
      { id: 'st_verified', name: '100% Real', category: 'luxury', sinhalaText: '100% ඇත්ත යූසර් ✅', subText: 'Zero Bots Guaranteed', icon: '🛡️', bgGradient: 'from-emerald-700 to-black', badgeColor: '#059669' },
      { id: 'st_calling', name: 'Call Me', category: 'luxury', sinhalaText: 'කෝල් එකක් ගන්න 📞', subText: 'Free WebRTC Call', icon: '📲', bgGradient: 'from-red-700 to-neutral-900', badgeColor: '#dc2626' },
    ],
  },
];

export const EMOJI_CATEGORIES = [
  {
    name: 'ජනප්‍රිය (Popular)',
    emojis: ['❤️', '🔥', '🇱🇰', '😂', '😍', '🤙', '🙏', '👑', '💎', '💯', '👍', '🦁', '🎉', '✨', '⚡', '😎'],
  },
  {
    name: 'මුහුණු (Faces)',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '🤫', '🤔', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  },
  {
    name: 'අභිනයන් (Gestures)',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪'],
  },
  {
    name: 'හදවත් සහ ආදරය (Hearts)',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  },
  {
    name: 'ශ්‍රී ලංකා සහ සාද (LK & Party)',
    emojis: ['🇱🇰', '🦁', '🏏', '🛺', '☕', '🌶️', '🍛', '🏝️', '🐘', '🥥', '🦚', '🎉', '🎊', '🎈', '🎂', '🎆', '🎇', '✨', '🏆', '🥇', '🎖️', '🚀', '🔥', '💎', '👑'],
  },
];
