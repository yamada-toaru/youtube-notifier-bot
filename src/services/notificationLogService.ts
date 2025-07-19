import { NotificationLog, NotificationLogFormData } from '../types/notification';
import { mockLogClient, supabase } from '../lib/supabase';

const TABLE_NAME = 'notification_logs';

export class NotificationLogService {
  async getAll(): Promise<NotificationLog[]> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', user.id)
        .order('sentAt', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
    
    return mockLogClient.getAll();
  }

  async getBySettingId(notificationSettingId: string, limit: number = 10): Promise<NotificationLog[]> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', user.id)
        .eq('notificationSettingId', notificationSettingId)
        .order('sentAt', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    }
    
    return mockLogClient.getBySettingId(notificationSettingId, limit);
  }

  async create(logData: NotificationLogFormData): Promise<NotificationLog> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const data = {
        ...logData,
        user_id: user.id
      };

      const { data: result, error } = await supabase
        .from(TABLE_NAME)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }

    const data = {
      ...logData,
      user_id: 'mock-user-id'
    };

    return mockLogClient.create(data);
  }

  async logSuccess(
    notificationSettingId: string,
    platform: 'youtube' | 'twitch',
    type: 'video' | 'shorts' | 'live' | 'premiere',
    message: string,
    videoId?: string
  ): Promise<void> {
    try {
      await this.create({
        notificationSettingId,
        platform,
        type,
        videoId,
        message,
        status: 'success',
        sentAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('通知成功ログの保存エラー:', error);
    }
  }

  async logError(
    notificationSettingId: string,
    platform: 'youtube' | 'twitch',
    type: 'video' | 'shorts' | 'live' | 'premiere',
    message: string,
    errorMessage: string,
    videoId?: string
  ): Promise<void> {
    try {
      await this.create({
        notificationSettingId,
        platform,
        type,
        videoId,
        message,
        status: 'error',
        errorMessage,
        sentAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('通知エラーログの保存エラー:', error);
    }
  }

  async getRecentLogs(limit: number = 20): Promise<NotificationLog[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', MOCK_USER_ID)
        .order('sentAt', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    }
    
    return mockLogClient.getRecentLogs(limit);
  }

  async deleteOldLogs(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    if (supabase) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('user_id', MOCK_USER_ID)
        .lt('sentAt', cutoffDate.toISOString());
      
      if (error) throw error;
      return;
    }

    mockLogClient.deleteOldLogs(daysToKeep);
  }
}

export const notificationLogService = new NotificationLogService();