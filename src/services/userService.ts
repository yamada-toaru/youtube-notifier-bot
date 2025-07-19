// src/services/userService.ts

import { User } from '../types/notification';
import { mockUserClient, supabase } from '../lib/supabase';

const TABLE_NAME = 'users';

export class UserService {
  async getCurrentUser(): Promise<User | null> {
    if (!supabase) {
      return mockUserClient.getCurrentUser();
    }

    // 認証ユーザーの取得
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('認証ユーザーの取得に失敗', authError);
      return null;
    }

    const user_id = user.id;

    // users テーブルにデータがあるか確認
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', user_id)
      .maybeSingle();

    if (error) {
      console.error('ユーザーデータ取得に失敗', error);
      throw error;
    }

    // データが存在しない → 新規作成
    if (!data) {
      return this.createDefaultUser(user_id, user.email ?? '');
    }

    return data;
  }

  async createDefaultUser(id: string, email: string): Promise<User> {
    const defaultUser: User = {
      id,
      email,
      plan: 'free',
      is_admin: false,
      is_banned: false,
      created_at: new Date().toISOString()
    };

    if (!supabase) {
      return mockUserClient.createDefaultUser();
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(defaultUser)
      .select()
      .single();

    if (error) {
      console.error('ユーザー自動作成に失敗', error);
      throw error;
    }

    return data;
  }

  async updatePlan(plan: 'free' | 'normal' | 'pro'): Promise<User> {
    if (!supabase) {
      return mockUserClient.updatePlan(plan);
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('ユーザー認証に失敗しました');
    }

    const user_id = user.id;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ plan })
      .eq('id', user_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const userService = new UserService();
