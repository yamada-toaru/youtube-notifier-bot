import { NotificationSetting, NotificationFormData } from '../types/notification';
import { mockClient, supabase } from '../lib/supabase';

const TABLE_NAME = 'notification_settings';

export class NotificationService {
  async getAll(): Promise<NotificationSetting[]> {
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
    
    return mockClient.getAll();
  }

  async create(formData: NotificationFormData): Promise<NotificationSetting> {
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

    return mockClient.create(data);
  }

  async update(id: string, formData: NotificationFormData): Promise<NotificationSetting> {
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

    return mockClient.update(id, formData);
  }

  async updatePlaylistId(id: string, uploadPlaylistId: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ uploadPlaylistId })
        .eq('id', id);
      
      if (error) throw error;
      return;
    }

    mockClient.updatePlaylistId(id, uploadPlaylistId);
  }

  async updateLastVideoId(id: string, lastVideoId: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ lastVideoId })
        .eq('id', id);
      
      if (error) throw error;
      return;
    }

    mockClient.updateLastVideoId(id, lastVideoId);
  }

  async getActiveVideoNotifications(): Promise<NotificationSetting[]> {
    const allSettings = await this.getAll();
    return allSettings.filter(setting => setting.notifyVideo);
  }

  async getActiveShortsNotifications(): Promise<NotificationSetting[]> {
    const allSettings = await this.getAll();
    return allSettings.filter(setting => setting.notifyShorts);
  }

  async getActiveNotifications(): Promise<NotificationSetting[]> {
    const allSettings = await this.getAll();
    return allSettings.filter(setting => 
      setting.notifyVideo || setting.notifyShorts || setting.notifyLive || setting.notifyPremiere
    );
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

    return mockClient.delete(id);
  }
}

export const notificationService = new NotificationService();