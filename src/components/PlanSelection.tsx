import React, { useState } from 'react';
import { Crown, Check, CreditCard, ArrowRight, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PlanSelectionProps {
  onPlanSelect: (plan: 'free' | 'normal' | 'pro') => void;
  onSkip: () => void;
}

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '¥0',
    period: '永続無料',
    color: 'text-gray-400 border-gray-500',
    bgColor: 'bg-gray-500/10',
    features: [
      '通知設定 1件まで',
      '30分間隔でチェック',

    ]
  },
  {
    id: 'normal' as const,
    name: 'Normal',
    price: '¥300',
    period: '月額',
    color: 'text-blue-400 border-blue-500',
    bgColor: 'bg-blue-500/10',
    popular: true,
    features: [
      '通知設定 5件まで',
      '5分間隔でチェック',

    ]
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '¥980',
    period: '月額',
    color: 'text-yellow-400 border-yellow-500',
    bgColor: 'bg-yellow-500/10',
    features: [
      '通知設定 20件まで',
      '1分間隔でチェック',

    ]
  }
];

export const PlanSelection: React.FC<PlanSelectionProps> = ({ onPlanSelect, onSkip }) => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'normal' | 'pro'>('normal');

  const handleContinue = () => {
    onPlanSelect(selectedPlan);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };
  return (
    <div className="min-h-screen bg-[#202225] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
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

        <div className="text-center mb-8">
          <Crown className="w-12 h-12 text-[#5865f2] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">プランを選択してください</h1>
          <p className="text-gray-400 text-lg">
            あなたのニーズに最適なプランをお選びください
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? `${plan.color} ${plan.bgColor}`
                  : 'border-[#2f3136] bg-[#36393f] hover:border-[#5865f2]'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#5865f2] text-white px-3 py-1 rounded-full text-sm font-medium">
                    人気プラン
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.id !== 'free' && (
                    <span className="text-gray-400 ml-1">/{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{plan.period}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-center">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPlan === plan.id
                    ? 'bg-[#5865f2] border-[#5865f2]'
                    : 'border-gray-500'
                }`}>
                  {selectedPlan === plan.id && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onSkip}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            後で選択する
          </button>
          <button
            onClick={handleContinue}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {selectedPlan === 'free' ? (
              <>
                無料で始める
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                決済に進む
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            プランはいつでも変更・キャンセルできます
          </p>
        </div>
      </div>
    </div>
  );
};