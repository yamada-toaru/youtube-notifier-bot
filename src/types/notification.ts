export interface NotificationSetting {
  id: string;
  user_id: string;
  name: string;
  channelId: string;
  uploadPlaylistId?: string;
  webhookUrl: string;
  notifyVideo: boolean;
  notifyShorts: boolean;
  notifyLive: boolean;
  notifyPremiere: boolean;
  lastVideoId?: string;
  template: string;
  created_at: string;
}

export interface NotificationFormData {
  name: string;
  channelId: string;
  webhookUrl: string;
  notifyVideo: boolean;
  notifyShorts: boolean;
  notifyLive: boolean;
  notifyPremiere: boolean;
  template: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  duration: string;
  channelTitle: string;
  liveBroadcastContent: string;
  scheduledStartTime?: string;
  actualStartTime?: string;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
}

export interface TwitchNotificationSetting {
  id: string;
  user_id: string;
  name: string;
  streamerLogin: string;
  webhookUrl: string;
  template: string;
  lastStartedAt?: string;
  notifyTwitch: boolean;
  created_at: string;
}

export interface TwitchNotificationFormData {
  name: string;
  streamerLogin: string;
  webhookUrl: string;
  template: string;
  notifyTwitch: boolean;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  uploadsPlaylistId: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  notificationSettingId: string;
  platform: 'youtube' | 'twitch';
  type: 'video' | 'shorts' | 'live' | 'premiere';
  videoId?: string;
  message: string;
  sentAt: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface NotificationLogFormData {
  notificationSettingId: string;
  platform: 'youtube' | 'twitch';
  type: 'video' | 'shorts' | 'live' | 'premiere';
  videoId?: string;
  message: string;
  sentAt: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface User {
  id: string;
  email?: string;
  plan: 'free' | 'normal' | 'pro';
  is_admin?: boolean;
  is_banned?: boolean;
  created_at: string;
}

export interface PlanLimits {
  maxNotifications: number;
  checkIntervalMinutes: number;
  displayName: string;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxNotifications: 1,
    checkIntervalMinutes: 30,
    displayName: 'Free'
  },
  normal: {
    maxNotifications: 5,
    checkIntervalMinutes: 5,
    displayName: 'Normal'
  },
  pro: {
    maxNotifications: 20,
    checkIntervalMinutes: 1,
    displayName: 'Pro'
  }
}