/*
  # usersテーブルの修正とテストユーザー追加

  1. テーブル修正
    - is_banned カラムを追加 (boolean, default false)
    - created_at カラムを追加 (timestamp, default now())
    - 既存のisBannedカラムがある場合は削除してis_bannedに統一

  2. テストユーザー追加
    - 指定されたIDのユーザーを作成
*/

-- 既存のisBannedカラムがある場合は削除
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'isBanned'
  ) THEN
    ALTER TABLE users DROP COLUMN "isBanned";
  END IF;
END $$;

-- is_banned カラムを追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE users ADD COLUMN is_banned boolean DEFAULT false;
  END IF;
END $$;

-- created_at カラムを追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- テストユーザーを追加（存在しない場合のみ）
INSERT INTO public.users (id, email, plan, "is_admin", is_banned, created_at)
VALUES ('469f3462-0f6a-46bf-ae45-c5d4b9939350', 'testuser@example.com', 'free', false, false, now())
ON CONFLICT (id) DO NOTHING;

-- 既存のユーザーのis_bannedカラムがNULLの場合はfalseに設定
UPDATE users SET is_banned = false WHERE is_banned IS NULL;