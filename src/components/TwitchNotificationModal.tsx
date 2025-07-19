import React, { useState, useEffect } from 'react';
import { X, Hash, Link, MessageSquare, Settings } from 'lucide-react';
import { TwitchNotificationSetting, TwitchNotificationFormData } from '../types/notification';

interface TwitchNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TwitchNotificationFormData) => Promise<void>;
  editingItem?: TwitchNotificationSetting;
}

const defaultFormData: TwitchNotificationFormData = {
  name: '',
  streamerLogin: '',
  webhookUrl: '',
  template: '🔴 {streamer} が配信を開始しました！\n**{title}**\n{link}\n\n開始時刻: {started}',
  notifyTwitch: true
};

export const TwitchNotificationModal: React.FC<TwitchNotificationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem
}) => {
  const [formData, setFormData] = useState<TwitchNotificationFormData>(defaultFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        streamerLogin: editingItem.streamerLogin,
        webhookUrl: editingItem.webhookUrl,
        template: editingItem.template,
        notifyTwitch: editingItem.notifyTwitch
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [editingItem, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '通知名を入力してください';
    }

    if (!formData.streamerLogin.trim()) {
      newErrors.streamerLogin = '配信者名を入力してください';
    } else if (!/^[a-zA-Z0-9_]{4,25}$/.test(formData.streamerLogin)) {
      newErrors.streamerLogin = '有効なTwitch配信者名を入力してください（4-25文字、英数字とアンダースコアのみ）';
    }

    if (!formData.webhookUrl.trim()) {
      newErrors.webhookUrl = 'Webhook URLを入力してください';
    } else if (!formData.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      newErrors.webhookUrl = '有効なDiscord Webhook URLを入力してください';
    }

    if (!formData.template.trim()) {
      newErrors.template = 'テンプレートを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TwitchNotificationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#36393f] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#2f3136]">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {editingItem ? 'Twitch通知設定を編集' : '新しいTwitch通知設定を追加'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              通知名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full bg-[#40444b] border ${errors.name ? 'border-red-500' : 'border-[#2f3136]'} rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]`}
              placeholder="例: ○○配信者通知"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              配信者名（ログイン名）
            </label>
            <input
              type="text"
              value={formData.streamerLogin}
              onChange={(e) => handleInputChange('streamerLogin', e.target.value.toLowerCase())}
              className={`w-full bg-[#40444b] border ${errors.streamerLogin ? 'border-red-500' : 'border-[#2f3136]'} rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]`}
              placeholder="streamer_name"
            />
            {errors.streamerLogin && <p className="text-red-400 text-sm mt-1">{errors.streamerLogin}</p>}
            <p className="text-gray-400 text-xs mt-1">
              twitch.tv/配信者名 の部分を入力してください
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
              className={`w-full bg-[#40444b] border ${errors.webhookUrl ? 'border-red-500' : 'border-[#2f3136]'} rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]`}
              placeholder="https://discord.com/api/webhooks/..."
            />
            {errors.webhookUrl && <p className="text-red-400 text-sm mt-1">{errors.webhookUrl}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              通知対象
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[#2f3136] rounded">
                <div>
                  <div className="text-white font-medium">🔴 配信開始</div>
                  <div className="text-gray-400 text-sm">配信が開始されたとき</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyTwitch}
                    onChange={(e) => handleInputChange('notifyTwitch', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9146ff]"></div>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              通知テンプレート
            </label>
            <textarea
              value={formData.template}
              onChange={(e) => handleInputChange('template', e.target.value)}
              className={`w-full bg-[#40444b] border ${errors.template ? 'border-red-500' : 'border-[#2f3136]'} rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] h-32 resize-none`}
              placeholder="使用可能な変数: {streamer}, {title}, {link}, {started}"
            />
            {errors.template && <p className="text-red-400 text-sm mt-1">{errors.template}</p>}
            <p className="text-gray-400 text-xs mt-2">
              使用可能な変数: <code className="bg-[#2f3136] px-1 rounded">{'{streamer}'}</code>, <code className="bg-[#2f3136] px-1 rounded">{'{title}'}</code>, <code className="bg-[#2f3136] px-1 rounded">{'{link}'}</code>, <code className="bg-[#2f3136] px-1 rounded">{'{started}'}</code>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#2f3136]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#9146ff] hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium transition-colors"
            >
              {isLoading ? '保存中...' : editingItem ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};