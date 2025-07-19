import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function SelectPlan() {
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data: userData, error } = await supabase.auth.getUser();

      if (error || !userData?.user?.email) {
        setMessage('ログイン状態を確認できませんでした。再ログインしてください。');
        setLoading(false);
        return;
      }

      const email = userData.user.email;

      if (selectedPlan === 'free') {
        setMessage('✅ フリープランが選択されました。サービスを開始します。');
        setTimeout(() => navigate('/main'), 1500); // ホームなどにリダイレクト
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: selectedPlan }),
      });

      const session = await response.json();

      if (session.url) {
        window.location.href = session.url;
      } else {
        setMessage('Stripeの決済URLが取得できませんでした。');
      }
    } catch (err) {
      setMessage('エラーが発生しました。');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#202225] flex items-center justify-center">
      <div className="bg-[#2f3136] p-8 rounded-xl shadow-md w-full max-w-md text-white">
        <h1 className="text-2xl font-bold mb-6 text-center">プランを選択してください</h1>

        <div className="flex flex-col gap-4 mb-6">
          <label className="cursor-pointer">
            <input
              type="radio"
              value="free"
              checked={selectedPlan === 'free'}
              onChange={() => setSelectedPlan('free')}
              className="mr-2"
            />
            フリープラン（¥0）
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              value="normal"
              checked={selectedPlan === 'normal'}
              onChange={() => setSelectedPlan('normal')}
              className="mr-2"
            />
            ノーマルプラン（月額 ¥300）
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              value="pro"
              checked={selectedPlan === 'pro'}
              onChange={() => setSelectedPlan('pro')}
              className="mr-2"
            />
            プロプラン（月額 ¥980）
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          プランを決定する
        </button>

        {message && (
          <div className={`mt-4 text-sm p-3 rounded ${
            message.includes('✅')
              ? 'text-green-400 bg-green-500/10 border border-green-500/20'
              : 'text-red-400 bg-red-500/10 border border-red-500/20'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
