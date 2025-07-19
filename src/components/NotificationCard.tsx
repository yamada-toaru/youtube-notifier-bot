import React from 'react';
import { Hash, ExternalLink, Edit3, Trash2, Clock, Check, X, FileText } from 'lucide-react';
import { NotificationSetting } from '../types/notification';

interface NotificationCardProps {
  setting: NotificationSetting;
  onEdit: (setting: NotificationSetting) => void;
  onDelete: (id: string) => void;
  onViewLogs: (setting: NotificationSetting) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  setting,
  onEdit,
  onDelete,
  onViewLogs
}) => {
  const getNotificationTypes = () => {
    const types = [];
    if (setting.notifyVideo) types.push('📺 動画');
    if (setting.notifyShorts) types.push('📱 ショート');
    if (setting.notifyLive) types.push('🔴 ライブ');
    if (setting.notifyPremiere) types.push('🎬 プレミア');
    return types;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[#36393f] rounded-lg p-6 border border-[#2f3136] hover:border-[#5865f2] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{setting.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Hash className="w-4 h-4" />
            <span className="font-mono">{setting.channelId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(setting)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#5865f2] rounded transition-colors"
            title="編集"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewLogs(setting)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#4f545c] rounded transition-colors"
            title="ログを表示"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(setting.id)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">通知対象</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {getNotificationTypes().map((type) => (
              <span
                key={type}
                className="px-2 py-1 bg-[#2f3136] text-gray-300 text-xs rounded-full"
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Webhook URL</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-300 truncate font-mono">
              {setting.webhookUrl.replace(/\/([^\/]+)$/, '/***')}
            </span>
            <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">テンプレート</label>
          <div className="mt-1 p-2 bg-[#2f3136] rounded text-sm text-gray-300 max-h-20 overflow-y-auto">
            {setting.template}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#2f3136]">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>作成: {formatDate(setting.created_at)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Check className="w-3 h-3" />
            <span>アクティブ</span>
          </div>
        </div>
      </div>
    </div>
  );
};