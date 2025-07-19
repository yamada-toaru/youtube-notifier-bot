import { useState } from 'react';
import { Youtube, Bell, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (!email || !password) {
      setMessage('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          setMessage(`アカウント作成失敗: ${error.message}`);
        } else {
          setMessage('✅ アカウントを作成しました！プラン選択へ移動します...');
          navigate('/select-plan');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(`ログイン失敗: ${error.message}`);
        } else {
          setMessage('✅ ログイン成功！');
          navigate('/main');
        }
      }
    } catch (error) {
      setMessage(`エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setLoading(false);
  };

  const getErrorMessage = (message: string) => {
    if (message.includes('Invalid login credentials')) {
      return 'メールアドレスまたはパスワードが正しくありません';
    }
    if (message.includes('Email not confirmed')) {
      return 'メールアドレスが確認されていません';
    }
    if (message.includes('Password should be at least 6 characters')) {
      return 'パスワードは6文字以上で入力してください';
    }
    if (message.includes('Unable to validate email address')) {
      return '有効なメールアドレスを入力してください';
    }
    if (message.includes('User already registered')) {
      return 'このメールアドレスはすでに登録されています';
    }
    if (message.includes('Rate limit exceeded')) {
      return 'リクエストが多すぎます。しばらくしてから再試行してください';
    }
    return message;
  };

  return (
    <div className="min-h-screen bg-[#202225] flex items-center justify-center">
      <div className="bg-[#2f3136] p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Youtube className="w-8 h-8 text-red-500" />
            <Bell className="w-6 h-6 text-[#5865f2]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">YouTube通知Bot</h1>
          <h2 className="text-lg font-semibold text-white">
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </h2>
        </div>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-[#40444b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          disabled={loading}
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded bg-[#40444b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
        />

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading
            ? (isSignUp ? 'アカウント作成中...' : 'ログイン中...')
            : (isSignUp ? 'アカウント作成' : 'ログイン')}
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            disabled={loading}
            className="text-[#5865f2] hover:underline text-sm disabled:opacity-50"
          >
            {isSignUp ? 'すでにアカウントをお持ちですか？ログイン' : 'アカウントをお持ちでない方はこちら'}
          </button>
        </div>

        {message && (
          <div className={`mt-4 text-sm p-3 rounded ${
            message.includes('✅')
              ? 'text-green-400 bg-green-500/10 border border-green-500/20'
              : 'text-red-400 bg-red-500/10 border border-red-500/20'
          }`}>
            {getErrorMessage(message)}
          </div>
        )}
      </div>
    </div>
  );
}
