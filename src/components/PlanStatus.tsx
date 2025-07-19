import React, { useState, useEffect } from 'react';
import { Crown, Users, Clock, AlertCircle } from 'lucide-react';
import { planService } from '../services/planService';

export const PlanStatus: React.FC = () => {
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    currentCount: number;
    maxCount: number;
    remaining: number;
    checkInterval: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlanInfo();
  }, []);

  const loadPlanInfo = async () => {
    try {
      setIsLoading(true);
      const info = await planService.getPlanDisplayInfo();
      setPlanInfo(info);
    } catch (error) {
      console.error('プラン情報の取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !planInfo) {
    return (
      <div className="bg-[#36393f] rounded-lg p-4 border border-[#2f3136] animate-pulse">
        <div className="h-6 bg-[#2f3136] rounded mb-2"></div>
        <div className="h-4 bg-[#2f3136] rounded w-3/4"></div>
      </div>
    );
  }

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return 'text-gray-400';
      case 'normal':
        return 'text-blue-400';
      case 'pro':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const isNearLimit = planInfo.remaining <= 1;

  return (
    <div className="bg-[#36393f] rounded-lg p-4 border border-[#2f3136]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown className={`w-5 h-5 ${getPlanColor(planInfo.planName)}`} />
          <h3 className="text-white font-medium">
            {planInfo.planName} プラン
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>通知設定</span>
          </div>
          <div className="text-sm">
            <span className={`font-medium ${isNearLimit ? 'text-yellow-400' : 'text-white'}`}>
              {planInfo.currentCount}
            </span>
            <span className="text-gray-400"> / {planInfo.maxCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>チェック間隔</span>
          </div>
          <span className="text-sm text-white">{planInfo.checkInterval}</span>
        </div>

        {isNearLimit && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-400 text-xs">
              {planInfo.remaining === 0 
                ? '通知設定の上限に達しています' 
                : `残り${planInfo.remaining}件まで登録可能です`
              }
            </span>
          </div>
        )}

        <div className="w-full bg-[#2f3136] rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isNearLimit ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ width: `${(planInfo.currentCount / planInfo.maxCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};