import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, Youtube, Twitch, AlertTriangle } from 'lucide-react';
import { NotificationLog } from '../types/notification';
import { notificationLogService } from '../services/notificationLogService';

interface NotificationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationSettingId?: string;
  settingName?: string;
}

export const NotificationLogModal: React.FC<NotificationLogModalProps> = ({
  isOpen,
  onClose,
  notificationSettingId,
  settingName
}) => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, notificationSettingId]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = notificationSettingId 
        ? await notificationLogService.getBySettingId(notificationSettingId, 20)
        : await notificationLogService.getRecentLogs(20);
      setLogs(data);
    } catch (error) {
      console.error('ログの読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (platform: string, type: string) => {
    if (platform === 'twitch') {
      return <Twitch className="w-4 h-4 text-purple-400" />;
    }
    
    switch (type) {
      case 'video':
        return <span className="text-sm">📺</span>;
      case 'shorts':
        return <span className="text-sm">📱</span>;
      case 'live':
        return <span className="text-sm">🔴</span>;
      case 'premiere':
        return <span className="text-sm">🎬</span>;
      default:
        return <Youtube className="w-4 h-4 text-red-400" />;
    }
  };

  const getTypeLabel = (platform: string, type: string) => {
    if (platform === 'twitch') return '配信開始';
    
    switch (type) {
      case 'video': return '動画';
      case 'shorts': return 'Shorts';
      case 'live': return 'ライブ';
      case 'premiere': return 'プレミア';
      default: return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#36393f] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#2f3136]">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            通知ログ {settingName && `- ${settingName}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865f2] mx-auto mb-4"></div>
              <p className="text-gray-400">ログを読み込み中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                通知ログがありません
              </h3>
              <p className="text-gray-500">
                通知が送信されると、ここに履歴が表示されます
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.status === 'success'
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(log.platform, log.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {getTypeLabel(log.platform, log.type)}通知
                          </span>
                          {log.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatDate(log.sentAt)}
                          {log.videoId && (
                            <span className="ml-2 font-mono">ID: {log.videoId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2f3136] rounded p-3 mb-3">
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                      {log.message}
                    </div>
                  </div>

                  {log.status === 'error' && log.errorMessage && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-red-400 font-medium text-sm mb-1">エラー詳細</div>
                        <div className="text-red-300 text-sm font-mono">
                          {log.errorMessage}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-[#2f3136]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};