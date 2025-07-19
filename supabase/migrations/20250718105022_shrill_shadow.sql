/*
  # 初期データベーススキーマの作成

  1. 新しいテーブル
    - `users` - ユーザー情報
      - `id` (uuid, primary key) - ユーザーID
      - `email` (text) - メールアドレス
      - `plan` (text) - プラン (free, normal, pro)
      - `is_admin` (boolean) - 管理者フラグ
      - `isBanned` (boolean) - BAN状態
      - `stripeCustomerId` (text) - Stripe顧客ID
      - `stripeSubscriptionId` (text) - StripeサブスクリプションID
      - `created_at` (timestamptz) - 作成日時

    - `notification_settings` - YouTube通知設定
      - `id` (uuid, primary key) - 設定ID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `name` (text) - 設定名
      - `channelId` (text) - YouTubeチャンネルID
      - `uploadPlaylistId` (text) - アップロードプレイリストID
      - `webhookUrl` (text) - Discord Webhook URL
      - `notifyVideo` (boolean) - 動画通知フラグ
      - `notifyShorts` (boolean) - ショート通知フラグ
      - `notifyLive` (boolean) - ライブ通知フラグ
      - `notifyPremiere` (boolean) - プレミア通知フラグ
      - `lastVideoId` (text) - 最後に処理した動画ID
      - `template` (text) - 通知テンプレート
      - `created_at` (timestamptz) - 作成日時

    - `twitch_notification_settings` - Twitch通知設定
      - `id` (uuid, primary key) - 設定ID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `name` (text) - 設定名
      - `streamerLogin` (text) - 配信者ログイン名
      - `webhookUrl` (text) - Discord Webhook URL
      - `template` (text) - 通知テンプレート
      - `lastStartedAt` (timestamptz) - 最後の配信開始時刻
      - `notifyTwitch` (boolean) - Twitch通知フラグ
      - `created_at` (timestamptz) - 作成日時

    - `notification_logs` - 通知ログ
      - `id` (uuid, primary key) - ログID
      - `user_id` (uuid, foreign key) - ユーザーID
      - `notificationSettingId` (uuid, foreign key) - 通知設定ID
      - `platform` (text) - プラットフォーム (youtube, twitch)
      - `type` (text) - 通知タイプ (video, shorts, live, premiere)
      - `videoId` (text) - 動画ID
      - `message` (text) - 送信メッセージ
      - `sentAt` (timestamptz) - 送信日時
      - `status` (text) - ステータス (success, error)
      - `errorMessage` (text) - エラーメッセージ

  2. セキュリティ
    - 全テーブルでRLSを有効化
    - ユーザーは自分のデータのみアクセス可能
    - 管理者は全データにアクセス可能

  3. インデックス
    - パフォーマンス向上のためのインデックスを作成
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'normal', 'pro')),
  is_admin boolean DEFAULT false,
  isBanned boolean DEFAULT false,
  stripeCustomerId text,
  stripeSubscriptionId text,
  created_at timestamptz DEFAULT now()
);

-- YouTube notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  channelId text NOT NULL,
  uploadPlaylistId text,
  webhookUrl text NOT NULL,
  notifyVideo boolean DEFAULT true,
  notifyShorts boolean DEFAULT false,
  notifyLive boolean DEFAULT true,
  notifyPremiere boolean DEFAULT false,
  lastVideoId text,
  template text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Twitch notification settings table
CREATE TABLE IF NOT EXISTS twitch_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  streamerLogin text NOT NULL,
  webhookUrl text NOT NULL,
  template text NOT NULL,
  lastStartedAt timestamptz,
  notifyTwitch boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  notificationSettingId uuid,
  platform text NOT NULL CHECK (platform IN ('youtube', 'twitch')),
  type text NOT NULL CHECK (type IN ('video', 'shorts', 'live', 'premiere')),
  videoId text,
  message text NOT NULL,
  sentAt timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  errorMessage text
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for notification_settings table
CREATE POLICY "Users can manage own notification settings"
  ON notification_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete all notification settings"
  ON notification_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for twitch_notification_settings table
CREATE POLICY "Users can manage own twitch notification settings"
  ON twitch_notification_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all twitch notification settings"
  ON twitch_notification_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete all twitch notification settings"
  ON twitch_notification_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for notification_logs table
CREATE POLICY "Users can read own notification logs"
  ON notification_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification logs"
  ON notification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all notification logs"
  ON notification_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_channel_id ON notification_settings(channelId);
CREATE INDEX IF NOT EXISTS idx_twitch_notification_settings_user_id ON twitch_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_twitch_notification_settings_streamer ON twitch_notification_settings(streamerLogin);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_setting_id ON notification_logs(notificationSettingId);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sentAt);

-- Create a function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, plan, is_admin, isBanned)
  VALUES (new.id, new.email, 'free', false, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();