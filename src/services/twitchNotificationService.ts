import { TwitchNotificationSetting, TwitchNotificationFormData } from '../types/notification';
import { mockTwitchClient, supabase } from '../lib/supabase';

const TABLE_NAME = 'twitch_notification_settings';

export class TwitchNotificationService {
  async getAll(): Promise<TwitchNotificationSetting[]> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
    
    return mockTwitchClient.getAll();
  }

  async create(formData: TwitchNotificationFormData): Promise<TwitchNotificationSetting> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証が必要です');

      const data = {
        ...formData,
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
      ...formData,
      user_id: 'mock-user-id'
    };

    return mockTwitchClient.create(data);
  }

  async update(id: string, formData: TwitchNotificationFormData): Promise<TwitchNotificationSetting> {
    if (supabase) {
      const { data: result, error } = await supabase
        .from(TABLE_NAME)
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    }

    return mockTwitchClient.update(id, formData);
  }

  async updateLastStartedAt(id: string, lastStartedAt: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ lastStartedAt })
        .eq('id', id);
      
      if (error) throw error;
      return;
    }

    mockTwitchClient.updateLastStartedAt(id, lastStartedAt);
  }

  async getActiveNotifications(): Promise<TwitchNotificationSetting[]> {
    const allSettings = await this.getAll();
    return allSettings.filter(setting => setting.notifyTwitch);
  }

  async delete(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return;
    }

    return mockTwitchClient.delete(id);
  }
}

export const twitchNotificationService = new TwitchNotificationService();