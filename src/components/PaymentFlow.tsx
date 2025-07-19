import React, { useState } from 'react';
import { CreditCard, Lock, ArrowLeft, Loader2, CheckCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentFlowProps {
  selectedPlan: 'normal' | 'pro';
  onBack: () => void;
  onPaymentComplete: () => void;
}

const planDetails = {
  normal: {
    name: 'Normal',
    price: '¥300',
    period: '月額',
    features: ['通知設定 5件まで', '5分間隔でチェック']
  },
  pro: {
    name: 'Pro', 
    price: '¥980',
    period: '月額',
    features: ['通知設定 20件まで', '1分間隔でチェック']
  }
};

export const PaymentFlow: React.FC<PaymentFlowProps> = ({ 
  selectedPlan, 
  onBack, 
  onPaymentComplete 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: ''
  });

  const plan = planDetails[selectedPlan];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // 決済処理のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
    setPaymentComplete(true);
    
    // 2秒後に完了画面に遷移
    setTimeout(() => {
      onPaymentComplete();
    }, 2000);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };
  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-[#202225] flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#36393f] rounded transition-colors"
            title="ログアウト"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">決済完了！</h1>
          <p className="text-gray-400 mb-6">
            {plan.name}プランへのアップグレードが完了しました。<br />
            設定画面に移動します...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865f2] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202225] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#36393f] rounded transition-colors"
            title="ログアウト"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 左側：プラン詳細 */}
          <div className="bg-[#36393f] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">注文内容</h2>
            
            <div className="border border-[#2f3136] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{plan.name}プラン</span>
                <span className="text-white font-bold">{plan.price}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">{plan.period}プラン</p>
              
              <ul className="space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-gray-300 text-sm">• {feature}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#2f3136] pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-white">合計</span>
                <span className="text-white">{plan.price}/月</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                初回請求日: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>

          {/* 右側：決済フォーム */}
          <div className="bg-[#36393f] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white">決済情報</h2>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-[#40444b] border border-[#2f3136] rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#5865f2]"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  カード名義
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-[#40444b] border border-[#2f3136] rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#5865f2]"
                  placeholder="山田 太郎"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  カード番号
                </label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  className="w-full bg-[#40444b] border border-[#2f3136] rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#5865f2]"
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    有効期限
                  </label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="w-full bg-[#40444b] border border-[#2f3136] rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#5865f2]"
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    className="w-full bg-[#40444b] border border-[#2f3136] rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#5865f2]"
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded">
                <Lock className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">
                  SSL暗号化により安全に保護されています
                </span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    決済処理中...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {plan.price}で決済する
                  </>
                )}
              </button>
            </form>

            <p className="text-gray-400 text-xs mt-4 text-center">
              決済完了後、いつでもキャンセル可能です
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};