import { User, NotificationSetting, TwitchNotificationSetting, NotificationLog } from '../types/notification';
import { mockUserClient, mockClient, mockTwitchClient, mockLogClient, supabase } from '../lib/supabase';

export class AdminService {
  /**
   * 管理者権限チェック
   */
  async checkAdminAccess(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.is_admin === true;
    } catch (error) {
      console.error('管理者権限チェックエラー:', error);
      return false;
    }
  }

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(): Promise<User | null> {
    if (supabase) {
      // 実際のSupabaseでは認証されたユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) return null;
      return data;
    }
    
    // モックデータでは管理者として扱う
    return {
      id: 'admin-123',
      email: 'admin@example.com',
      plan: 'pro',
      is_admin: true,
      is_banned: false,
      created_at: new Date().toISOString()
    };
  }

  /**
   * 全ユーザー一覧を取得
   */
  async getAllUsers(): Promise<(User & { 
    notificationCount: number; 
    lastNotificationAt?: string;
  })[]> {
    if (supabase) {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // 各ユーザーの通知設定数と最終通知日を取得
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const [youtubeSettings, twitchSettings, lastLog] = await Promise.all([
            supabase.from('notification_settings').select('id').eq('user_id', user.id),
            supabase.from('twitch_notification_settings').select('id').eq('user_id', user.id),
            supabase.from('notification_logs').select('sentAt').eq('user_id', user.id).order('sentAt', { ascending: false }).limit(1).single()
          ]);

          return {
            ...user,
            notificationCount: (youtubeSettings.data?.length || 0) + (twitchSettings.data?.length || 0),
            lastNotificationAt: lastLog.data?.sentAt
          };
        })
      );

      return usersWithStats;
    }

    // モックデータ
    return [
      {
        id: 'user-123',
        email: 'user1@example.com',
        plan: 'free',
        is_admin: false,
        isBanned: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        notificationCount: 1,
        lastNotificationAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'user-456',
        email: 'user2@example.com',
        plan: 'normal',
        is_admin: false,
        isBanned: false,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        notificationCount: 3,
        lastNotificationAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'user-789',
        email: 'banned@example.com',
        plan: 'free',
        is_admin: false,
        isBanned: true,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        notificationCount: 0,
        lastNotificationAt: undefined
      }
    ];
  }

  /**
   * ユーザーのBAN状態を切り替え
   */
  async toggleUserBan(user_id: string): Promise<void> {
    if (supabase) {
      // 現在の状態を取得
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', user_id)
        .single();

      if (fetchError) throw fetchError;

      // BAN状態を切り替え
      const { error } = await supabase
        .from('users')
        .update({ is_banned: !user.is_banned })
        .eq('id', user_id);

      if (error) throw error;
      return;
    }

    // モックデータでは何もしない（実際の実装では状態を更新）
    console.log(`User ${user_id} ban status toggled`);
  }

  /**
   * ユーザーのプランを変更
   */
  async updateUserPlan(user_id: string, plan: 'free' | 'normal' | 'pro'): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .update({ plan })
        .eq('id', user_id);

      if (error) throw error;
      return;
    }

    // モックデータでは何もしない
    console.log(`User ${user_id} plan updated to ${plan}`);
  }

  /**
   * ユーザーの通知設定一覧を取得
   */
  async getUserNotificationSettings(user_id: string): Promise<{
    youtube: NotificationSetting[];
    twitch: TwitchNotificationSetting[];
  }> {
    if (supabase) {
      const [youtubeResult, twitchResult] = await Promise.all([
        supabase.from('notification_settings').select('*').eq('user_id', user_id),
        supabase.from('twitch_notification_settings').select('*').eq('user_id', user_id)
      ]);

      if (youtubeResult.error) throw youtubeResult.error;
      if (twitchResult.error) throw twitchResult.error;

      return {
        youtube: youtubeResult.data || [],
        twitch: twitchResult.data || []
      };
    }

    // モックデータ
    if (user_id === 'user-123') {
      return {
        youtube: await mockClient.getAll(),
        twitch: await mockTwitchClient.getAll()
      };
    }

    return { youtube: [], twitch: [] };
  }

  /**
   * 全体の通知ログを取得（管理者用）
   */
  async getAllNotificationLogs(limit: number = 100): Promise<(NotificationLog & { 
    userEmail?: string;
    settingName?: string;
  })[]> {
    if (supabase) {
      const { data: logs, error } = await supabase
        .from('notification_logs')
        .select(`
          *,
          users!inner(email),
          notification_settings(name),
          twitch_notification_settings(name)
        `)
        .order('sentAt', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return logs.map(log => ({
        ...log,
        userEmail: log.users?.email,
        settingName: log.notification_settings?.name || log.twitch_notification_settings?.name
      }));
    }

    // モックデータ
    const mockLogs = await mockLogClient.getAll();
    return mockLogs.slice(0, limit).map(log => ({
      ...log,
      userEmail: 'user@example.com',
      settingName: 'テスト設定'
    }));
  }

  /**
   * 通知設定を削除（管理者権限）
   */
  async deleteNotificationSetting(settingId: string, platform: 'youtube' | 'twitch'): Promise<void> {
    if (supabase) {
      const tableName = platform === 'youtube' ? 'notification_settings' : 'twitch_notification_settings';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', settingId);

      if (error) throw error;
      return;
    }

    // モックデータでは何もしない
    console.log(`${platform} notification setting ${settingId} deleted by admin`);
  }
}

export const adminService = new AdminService();