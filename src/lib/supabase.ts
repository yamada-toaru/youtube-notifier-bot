import { createClient } from '@supabase/supabase-js';
import { NotificationSetting, TwitchNotificationSetting, User, NotificationLog } from '../types/notification';

// Supabase設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabaseクライアントを作成
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// デモ用のモックデータ管理（Supabaseが利用できない場合のフォールバック）
class MockSupabaseClient {
  private data: NotificationSetting[] = [
    {
      id: '1',
      user_id: 'user-123',
      name: 'テストチャンネル',
      channelId: 'UC1234567890',
      webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      notifyVideo: true,
      notifyShorts: false,
      notifyLive: true,
      notifyPremiere: false,
      template: '📺 新しい動画が投稿されました！\n**{title}**\n{link}',
      created_at: new Date().toISOString()
    }
  ];

  async getAll(): Promise<NotificationSetting[]> {
    return [...this.data];
  }

  async create(data: Omit<NotificationSetting, 'id' | 'created_at'>): Promise<NotificationSetting> {
    const newItem: NotificationSetting = {
      ...data,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    this.data.push(newItem);
    return newItem;
  }

  async update(id: string, data: Partial<NotificationSetting>): Promise<NotificationSetting> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) throw new Error('設定が見つかりません');
    
    this.data[index] = { ...this.data[index], ...data };
    return this.data[index];
  }

  async updatePlaylistId(id: string, uploadPlaylistId: string): Promise<void> {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index].uploadPlaylistId = uploadPlaylistId;
    }
  }

  async updateLastVideoId(id: string, lastVideoId: string): Promise<void> {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index].lastVideoId = lastVideoId;
    }
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(item => item.id !== id);
  }
}

// Twitch通知設定用のモックデータ管理
class MockTwitchSupabaseClient {
  private data: TwitchNotificationSetting[] = [
    {
      id: '1',
      user_id: 'user-123',
      name: 'テスト配信者',
      streamerLogin: 'teststreamer',
      webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      template: '🔴 {streamer} が配信を開始しました！\n**{title}**\n{link}\n\n開始時刻: {started}',
      notifyTwitch: true,
      created_at: new Date().toISOString()
    }
  ];

  async getAll(): Promise<TwitchNotificationSetting[]> {
    return [...this.data];
  }

  async create(data: Omit<TwitchNotificationSetting, 'id' | 'created_at'>): Promise<TwitchNotificationSetting> {
    const newItem: TwitchNotificationSetting = {
      ...data,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    this.data.push(newItem);
    return newItem;
  }

  async update(id: string, data: Partial<TwitchNotificationSetting>): Promise<TwitchNotificationSetting> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) throw new Error('設定が見つかりません');
    
    this.data[index] = { ...this.data[index], ...data };
    return this.data[index];
  }

  async updateLastStartedAt(id: string, lastStartedAt: string): Promise<void> {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index].lastStartedAt = lastStartedAt;
    }
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(item => item.id !== id);
  }
}

// ユーザー用のモックデータ管理
class MockUserSupabaseClient {
  private user: User = {
    id: 'user-123',
    email: 'user@example.com',
    plan: 'free',
    is_admin: true, // デモ用に管理者権限を付与
    isBanned: false,
    created_at: new Date().toISOString()
  };

  async getCurrentUser(): Promise<User> {
    return { ...this.user };
  }

  async createDefaultUser(): Promise<User> {
    return { ...this.user };
  }

  async updatePlan(plan: 'free' | 'normal' | 'pro'): Promise<User> {
    this.user.plan = plan;
    return { ...this.user };
  }
}

// 通知ログ用のモックデータ管理
class MockLogSupabaseClient {
  private data: NotificationLog[] = [
    {
      id: '1',
      user_id: 'user-123',
      notificationSettingId: '1',
      platform: 'youtube',
      type: 'video',
      videoId: 'dQw4w9WgXcQ',
      message: '📺 新しい動画が投稿されました！\n**テスト動画タイトル**\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\n\n投稿日: 2024年1月15日',
      sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分前
      status: 'success'
    },
    {
      id: '2',
      user_id: 'user-123',
      notificationSettingId: '1',
      platform: 'youtube',
      type: 'shorts',
      videoId: 'abc123',
      message: '📱 新しいShortsが投稿されました！\n**テストShorts**\nhttps://www.youtube.com/shorts/abc123',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2時間前
      status: 'success'
    },
    {
      id: '3',
      user_id: 'user-123',
      notificationSettingId: '1',
      platform: 'youtube',
      type: 'live',
      videoId: 'live123',
      message: '🔴 ライブ配信が開始されました！\n**テストライブ配信**\nhttps://www.youtube.com/watch?v=live123',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6時間前
      status: 'error',
      errorMessage: 'Discord Webhook Error: 404 - Webhook not found'
    }
  ];

  async getAll(): Promise<NotificationLog[]> {
    return [...this.data].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  async getBySettingId(notificationSettingId: string, limit: number = 10): Promise<NotificationLog[]> {
    return this.data
      .filter(log => log.notificationSettingId === notificationSettingId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, limit);
  }

  async create(data: Omit<NotificationLog, 'id'>): Promise<NotificationLog> {
    const newLog: NotificationLog = {
      ...data,
      id: Date.now().toString()
    };
    this.data.unshift(newLog);
    return newLog;
  }

  async getRecentLogs(limit: number = 20): Promise<NotificationLog[]> {
    return this.data
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, limit);
  }

  async deleteOldLogs(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.data = this.data.filter(log => 
      new Date(log.sentAt).getTime() > cutoffDate.getTime()
    );
  }
}

// フォールバック用のモッククライアント（Supabaseが利用できない場合）
export const mockClient = new MockSupabaseClient();
export const mockTwitchClient = new MockTwitchSupabaseClient();
export const mockUserClient = new MockUserSupabaseClient();
export const mockLogClient = new MockLogSupabaseClient();

// TypeScript型定義のエクスポート
export type { Database } from '../types/supabase';

// Supabaseクライアントの状態をログ出力
if (supabase) {
  console.log('✅ Supabase client initialized successfully');
  console.log('📍 Supabase URL:', supabaseUrl);
} else {
  console.log('⚠️ Supabase client not initialized - using mock data');
  console.log('💡 Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
}