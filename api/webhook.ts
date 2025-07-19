// src/services/userService.ts
import { User } from '../types/notification';
import { supabase } from '../lib/supabase'; // UI用の anon キーで初期化された Supabase クライアント

export class UserService {
  async getCurrentUser(): Promise<User> {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('ユーザー認証に失敗しました');
    }

    const user_id = user.id;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (error) {
      // ユーザーが存在しない場合はデフォルト作成
      if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
        return this.createDefaultUser(user_id, user.email);
      }
      throw error;
    }

    return data;
  }

  async createDefaultUser(user_id: string, email: string | undefined): Promise<User> {
    const defaultUser: User = {
      id: user_id,
      email: email ?? '',
      plan: 'free',
      is_admin: false,
      isBanned: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert(defaultUser)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePlan(plan: 'free' | 'normal' | 'pro'): Promise<User> {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('ユーザー認証に失敗しました');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ plan })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const userService = new UserService();
