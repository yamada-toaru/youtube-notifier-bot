import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Shield, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Crown,
  Settings,
  Trash2,
  AlertTriangle,
  Clock,
  Youtube,
  Twitch,
  LogOut
} from 'lucide-react';
import { User, NotificationLog, NotificationSetting, TwitchNotificationSetting } from '../types/notification';
import { adminService } from '../services/adminService';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<(User & { 
    notificationCount: number; 
    lastNotificationAt?: string;
  })[]>([]);
  const [logs, setLogs] = useState<(NotificationLog & { 
    userEmail?: string;
    settingName?: string;
  })[]>([]);
  const [selectedUser, setSelectedUser] = useState<{
    user: User;
    settings: { youtube: NotificationSetting[]; twitch: TwitchNotificationSetting[] };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'settings'>('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, logsData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllNotificationLogs(100)
      ]);
      setUsers(usersData);
      setLogs(logsData);
    } catch (error) {
      console.error('管理者データの読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBan = async (user_id: string) => {
    try {
      await adminService.toggleUserBan(user_id);
      await loadData(); // データを再読み込み
    } catch (error) {
      console.error('BAN状態の切り替えエラー:', error);
    }
  };

  const handlePlanChange = async (user_id: string, plan: 'free' | 'normal' | 'pro') => {
    try {
      await adminService.updateUserPlan(user_id, plan);
      await loadData(); // データを再読み込み
    } catch (error) {
      console.error('プラン変更エラー:', error);
    }
  };

  const handleViewUserSettings = async (user: User) => {
    try {
      const settings = await adminService.getUserNotificationSettings(user.id);
      setSelectedUser({ user, settings });
    } catch (error) {
      console.error('ユーザー設定の取得エラー:', error);
    }
  };

  const handleDeleteSetting = async (settingId: string, platform: 'youtube' | 'twitch') => {
    if (!confirm('この通知設定を削除しますか？')) return;

    try {
      await adminService.deleteNotificationSetting(settingId, platform);
      if (selectedUser) {
        // 設定を再読み込み
        const settings = await adminService.getUserNotificationSettings(selectedUser.user.id);
        setSelectedUser({ ...selectedUser, settings });
      }
      await loadData(); // 全体データも再読み込み
    } catch (error) {
      console.error('設定削除エラー:', error);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未実行';
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

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-400 bg-gray-500/10';
      case 'normal': return 'text-blue-400 bg-blue-500/10';
      case 'pro': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getTypeIcon = (platform: string, type: string) => {
    if (platform === 'twitch') {
      return <Twitch className="w-4 h-4 text-purple-400" />;
    }
    
    switch (type) {
      case 'video': return <span className="text-sm">📺</span>;
      case 'shorts': return <span className="text-sm">📱</span>;
      case 'live': return <span className="text-sm">🔴</span>;
      case 'premiere': return <span className="text-sm">🎬</span>;
      default: return <Youtube className="w-4 h-4 text-red-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#202225] flex items-center justify-center">
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865f2] mx-auto mb-4"></div>
          <p className="text-gray-400">管理者データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202225]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#5865f2]" />
            <div>
              <h1 className="text-2xl font-bold text-white">管理者パネル</h1>
              <p className="text-gray-400">ユーザー管理と通知状況の監視</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#36393f] rounded transition-colors"
            title="ログアウト"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-[#5865f2] text-white'
                  : 'bg-[#36393f] text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              ユーザー管理
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'bg-[#5865f2] text-white'
                  : 'bg-[#36393f] text-gray-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              通知ログ
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-[#36393f] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#2f3136]">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  ユーザー一覧 ({users.length}件)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2f3136]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        ユーザー
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        プラン
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        通知設定数
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        最終通知
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        状態
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f3136]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#2f3136]">
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-white font-medium">
                              {user.email || `User ${user.id.slice(0, 8)}`}
                            </div>
                            <div className="text-gray-400 text-sm font-mono">
                              {user.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={user.plan}
                            onChange={(e) => handlePlanChange(user.id, e.target.value as any)}
                            className={`px-2 py-1 rounded text-xs font-medium border-0 ${getPlanColor(user.plan)}`}
                          >
                            <option value="free">Free</option>
                            <option value="normal">Normal</option>
                            <option value="pro">Pro</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-white">{user.notificationCount}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-400 text-sm">
                            {formatDate(user.lastNotificationAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {user.is_banned ? (
                            <span className="flex items-center gap-1 text-red-400 text-sm">
                              <Ban className="w-4 h-4" />
                              BAN
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              アクティブ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleBan(user.id)}
                              className={`p-1 rounded transition-colors ${
                                user.is_banned
                                  ? 'text-green-400 hover:bg-green-500/10'
                                  : 'text-red-400 hover:bg-red-500/10'
                              }`}
                              title={user.is_banned ? 'BAN解除' : 'BAN'}
                            >
                              {user.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleViewUserSettings(user)}
                              className="p-1 text-gray-400 hover:text-white hover:bg-[#4f545c] rounded transition-colors"
                              title="設定を表示"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-[#36393f] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#2f3136]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                通知ログ ({logs.length}件)
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <div className="space-y-2 p-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded border ${
                      log.status === 'success'
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(log.platform, log.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">
                              {log.userEmail || 'Unknown User'}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {log.settingName || 'Unknown Setting'}
                            </span>
                            {log.status === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(log.sentAt)}
                            {log.videoId && (
                              <span className="ml-2 font-mono">ID: {log.videoId}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#2f3136] rounded p-2 mb-2">
                      <div className="text-xs text-gray-300 whitespace-pre-wrap">
                        {log.message}
                      </div>
                    </div>

                    {log.status === 'error' && log.errorMessage && (
                      <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-red-300 text-xs font-mono">
                          {log.errorMessage}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ユーザー設定詳細モーダル */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#36393f] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-[#2f3136]">
                <h2 className="text-xl font-semibold text-white">
                  {selectedUser.user.email || `User ${selectedUser.user.id.slice(0, 8)}`} の通知設定
                </h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-500" />
                      YouTube通知設定 ({selectedUser.settings.youtube.length}件)
                    </h3>
                    {selectedUser.settings.youtube.length === 0 ? (
                      <p className="text-gray-400">設定なし</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedUser.settings.youtube.map((setting) => (
                          <div key={setting.id} className="flex items-center justify-between p-3 bg-[#2f3136] rounded">
                            <div>
                              <div className="text-white font-medium">{setting.name}</div>
                              <div className="text-gray-400 text-sm font-mono">{setting.channelId}</div>
                            </div>
                            <button
                              onClick={() => handleDeleteSetting(setting.id, 'youtube')}
                              className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <Twitch className="w-5 h-5 text-purple-500" />
                      Twitch通知設定 ({selectedUser.settings.twitch.length}件)
                    </h3>
                    {selectedUser.settings.twitch.length === 0 ? (
                      <p className="text-gray-400">設定なし</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedUser.settings.twitch.map((setting) => (
                          <div key={setting.id} className="flex items-center justify-between p-3 bg-[#2f3136] rounded">
                            <div>
                              <div className="text-white font-medium">{setting.name}</div>
                              <div className="text-gray-400 text-sm font-mono">{setting.streamerLogin}</div>
                            </div>
                            <button
                              onClick={() => handleDeleteSetting(setting.id, 'twitch')}
                              className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};