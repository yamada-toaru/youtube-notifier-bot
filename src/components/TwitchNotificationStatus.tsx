import React, { useState, useEffect } from 'react';
import { Play, Square, Activity, Clock, AlertCircle } from 'lucide-react';
import { twitchNotificationHandler } from '../handlers/twitchNotify';
import { contentFetchService } from '../services/contentFetchService';

export const TwitchNotificationStatus: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('未実行');
  const [apiStatus, setApiStatus] = useState({ youtube: false, twitch: false });

  useEffect(() => {
    // API設定状況を確認
    const status = contentFetchService.getApiStatus();
    setApiStatus(status);
  }, []);

  useEffect(() => {
    // 初期状態を取得
    setIsActive(twitchNotificationHandler.isActive());

    // 定期的に状態を更新
    const interval = setInterval(() => {
      setIsActive(twitchNotificationHandler.isActive());
      if (twitchNotificationHandler.isActive()) {
        setLastCheck(new Date().toLocaleTimeString('ja-JP'));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (isActive) {
      twitchNotificationHandler.stop();
      setIsActive(false);
    } else {
      twitchNotificationHandler.start();
      setIsActive(true);
      setLastCheck(new Date().toLocaleTimeString('ja-JP'));
    }
  };

  return (
    <div className="bg-[#36393f] rounded-lg p-4 border border-[#2f3136]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-purple-400' : 'bg-gray-500'}`} />
          <div>
            <h3 className="text-white font-medium">Twitch通知システム</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                <span>{isActive ? 'アクティブ' : '停止中'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>最終チェック: {lastCheck}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-4 h-4" />
              停止
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              開始
            </>
          )}
        </button>
      </div>
      
      {!apiStatus.twitch && (
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm">
            Twitch API キーが設定されていません。環境変数 VITE_TWITCH_CLIENT_ID と VITE_TWITCH_CLIENT_SECRET を設定してください。
          </span>
        </div>
      )}
    </div>
  );
};