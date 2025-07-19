import React, { useState, useEffect } from 'react';
import { Plus, Youtube, Bell, Settings, AlertCircle, Loader2, Activity, Twitch, Shield, LogOut, User } from 'lucide-react';
import { NotificationSetting, NotificationFormData } from '../types/notification';
import { TwitchNotificationSetting, TwitchNotificationFormData } from '../types/notification';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationModal } from '../components/NotificationModal';
import { NotificationLogModal } from '../components/NotificationLogModal';
import { TwitchNotificationCard } from '../components/TwitchNotificationCard';
import { TwitchNotificationModal } from '../components/TwitchNotificationModal';
import { NotificationStatus } from '../components/NotificationStatus';
import { TwitchNotificationStatus } from '../components/TwitchNotificationStatus';
import { PlanStatus } from '../components/PlanStatus';
import AdminRoute from '../components/AdminRoute';
import { notificationService } from '../services/notificationService';
import { twitchNotificationService } from '../services/twitchNotificationService';
import { planService } from '../services/planService';
import { adminService } from '../services/adminService';
import { userService } from "../services/userService";
import { supabase } from '../lib/supabase';
import { User as AppUser } from '../types/notification';

function MainPage() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentRoute, setCurrentRoute] = useState<'main' | 'admin'>('main');
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [twitchSettings, setTwitchSettings] = useState<TwitchNotificationSetting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTwitchModalOpen, setIsTwitchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NotificationSetting | undefined>();
  const [editingTwitchItem, setEditingTwitchItem] = useState<TwitchNotificationSetting | undefined>();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedSettingForLogs, setSelectedSettingForLogs] = useState<{
    id: string;
    name: string;
  } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'youtube' | 'twitch'>('youtube');
  const [is_admin, setis_admin] = useState(false);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    loadCurrentUser();
    checkAdminStatus();
    loadSettings();
    loadTwitchSettings();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await userService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('ユーザー情報の取得エラー:', error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const hasAccess = await adminService.checkAdminAccess();
      setis_admin(hasAccess);
    } catch (error) {
    }
  };

  const loadSettings = async () => {
    // ユーザーがログインしていない場合は設定を読み込まない
    if (!currentUser) {
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await notificationService.getAll();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('設定の読み込みエラー:', err);
      setError('設定の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTwitchSettings = async () => {
    try {
      const data = await twitchNotificationService.getAll();
      setTwitchSettings(data);
    } catch (err) {
      console.error('Twitch設定の読み込みエラー:', err);
    }
  };

  const handleSave = async (formData: NotificationFormData) => {
    // 登録上限チェック
    if (!editingItem) {
      const canAdd = await planService.canAddNotification('youtube');
      if (!canAdd.canAdd) {
        setError(`通知設定の上限（${canAdd.maxCount}件）に達しています。プランをアップグレードするか、既存の設定を削除してください。`);
        throw new Error('登録上限に達しています');
      }
    }

    try {
      if (editingItem) {
        const updated = await notificationService.update(editingItem.id, formData);
        setSettings(prev => prev.map(s => s.id === editingItem.id ? updated : s));
      } else {
        const created = await notificationService.create(formData);
        setSettings(prev => [created, ...prev]);
      }
      setEditingItem(undefined);
      setError(null);
    } catch (err) {
      console.error('保存エラー:', err);
      if (!error) {
        setError('保存に失敗しました');
      }
      throw err;
    }
  };

  const handleTwitchSave = async (formData: TwitchNotificationFormData) => {
    // 登録上限チェック
    if (!editingTwitchItem) {
      const canAdd = await planService.canAddNotification('twitch');
      if (!canAdd.canAdd) {
        setError(`通知設定の上限（${canAdd.maxCount}件）に達しています。プランをアップグレードするか、既存の設定を削除してください。`);
        throw new Error('登録上限に達しています');
      }
    }

    try {
      if (editingTwitchItem) {
        const updated = await twitchNotificationService.update(editingTwitchItem.id, formData);
        setTwitchSettings(prev => prev.map(s => s.id === editingTwitchItem.id ? updated : s));
      } else {
        const created = await twitchNotificationService.create(formData);
        setTwitchSettings(prev => [created, ...prev]);
      }
      setEditingTwitchItem(undefined);
      setError(null);
    } catch (err) {
      console.error('Twitch保存エラー:', err);
      if (!error) {
        setError('Twitch設定の保存に失敗しました');
      }
      throw err;
    }
  };

  const handleEdit = (setting: NotificationSetting) => {
    setEditingItem(setting);
    setIsModalOpen(true);
  };

  const handleTwitchEdit = (setting: TwitchNotificationSetting) => {
    setEditingTwitchItem(setting);
    setIsTwitchModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この通知設定を削除しますか？')) return;

    try {
      await notificationService.delete(id);
      setSettings(prev => prev.filter(s => s.id !== id));
      setError(null);
    } catch (err) {
      console.error('削除エラー:', err);
      setError('削除に失敗しました');
    }
  };

  const handleTwitchDelete = async (id: string) => {
    if (!confirm('このTwitch通知設定を削除しますか？')) return;

    try {
      await twitchNotificationService.delete(id);
      setTwitchSettings(prev => prev.filter(s => s.id !== id));
      setError(null);
    } catch (err) {
      console.error('Twitch削除エラー:', err);
      setError('Twitch設定の削除に失敗しました');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(undefined);
  };

  const handleCloseTwitchModal = () => {
    setIsTwitchModalOpen(false);
    setEditingTwitchItem(undefined);
  };

  const handleViewLogs = (setting: NotificationSetting | TwitchNotificationSetting) => {
    setSelectedSettingForLogs({
      id: setting.id,
      name: setting.name
    });
    setIsLogModalOpen(true);
  };

  const handleCloseLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedSettingForLogs(undefined);
  };

  const handleAddNew = () => {
    // 登録上限チェック（UI表示用）
    planService.canAddNotification('youtube').then(canAdd => {
      if (!canAdd.canAdd) {
        setError(`通知設定の上限（${canAdd.maxCount}件）に達しています。プランをアップグレードするか、既存の設定を削除してください。`);
        return;
      }
      setEditingItem(undefined);
      setIsModalOpen(true);
    });
  };

  const handleAddNewTwitch = () => {
    // 登録上限チェック（UI表示用）
    planService.canAddNotification('twitch').then(canAdd => {
      if (!canAdd.canAdd) {
        setError(`通知設定の上限（${canAdd.maxCount}件）に達しています。プランをアップグレードするか、既存の設定を削除してください。`);
        return;
      }
      setEditingTwitchItem(undefined);
      setIsTwitchModalOpen(true);
    });
  };

  const handlePlanClick = () => {
    // プラン変更ページへ遷移（将来実装予定）
    console.log('プラン変更ページへ遷移: /plans');
    // router.push('/plans'); // Next.jsの場合
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Free';
      case 'normal': return 'Normal';
      case 'pro': return 'Pro';
      default: return plan;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-400';
      case 'normal': return 'text-blue-400';
      case 'pro': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // 管理者パネルを表示する場合
  if (currentRoute === 'admin') {
    return <AdminRoute />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#202225] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#5865f2] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202225]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* プラン表示 */}
        {currentUser && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <User className="w-4 h-4" />
              <span>{currentUser.email || `User ${currentUser.id.slice(0, 8)}`}</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-400">現在のプラン: </span>
                <span 
                  className={`text-sm font-medium cursor-pointer hover:underline transition-colors ${getPlanColor(currentUser.plan)}`}
                  onClick={handlePlanClick}
                  title="クリックしてプラン変更"
                >
                  {getPlanDisplayName(currentUser.plan)}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-[#36393f] rounded transition-colors"
                title="ログアウト"
              >
                <LogOut className="w-4 h-4" />
                ログアウト
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {activeTab === 'youtube' ? (
                <Youtube className="w-8 h-8 text-red-500" />
              ) : (
                <Twitch className="w-8 h-8 text-purple-500" />
              )}
              <Bell className="w-6 h-6 text-[#5865f2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {activeTab === 'youtube' ? 'YouTube' : 'Twitch'}通知Bot
              </h1>
              <p className="text-gray-400">
                {activeTab === 'youtube' ? 'チャンネルの更新通知を設定・管理' : '配信者の配信開始通知を設定・管理'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {is_admin && (
              <button
                onClick={() => setCurrentRoute('admin')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Shield className="w-4 h-4" />
                管理者パネル
              </button>
            )}
            <button
              onClick={activeTab === 'youtube' ? handleAddNew : handleAddNewTwitch}
              className={`${
                activeTab === 'youtube' 
                  ? 'bg-[#5865f2] hover:bg-[#4752c4]' 
                  : 'bg-[#9146ff] hover:bg-[#7c3aed]'
              } text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
            >
              <Plus className="w-4 h-4" />
              新しい{activeTab === 'youtube' ? 'YouTube' : 'Twitch'}通知設定
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('youtube')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'youtube'
                  ? 'bg-red-500 text-white'
                  : 'bg-[#36393f] text-gray-400 hover:text-white'
              }`}
            >
              <Youtube className="w-4 h-4 inline mr-2" />
              YouTube
            </button>
            <button
              onClick={() => setActiveTab('twitch')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'twitch'
                  ? 'bg-purple-500 text-white'
                  : 'bg-[#36393f] text-gray-400 hover:text-white'
              }`}
            >
              <Twitch className="w-4 h-4 inline mr-2" />
              Twitch
            </button>
          </div>
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-2">
          <PlanStatus />
          {activeTab === 'youtube' ? <NotificationStatus /> : <TwitchNotificationStatus />}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {activeTab === 'youtube' ? 'YouTube' : 'Twitch'}通知設定一覧
            </h2>
            <span className="text-sm text-gray-400">
              {activeTab === 'youtube' ? settings.length : twitchSettings.length} 件の設定
            </span>
          </div>
        </div>

        {(activeTab === 'youtube' ? settings : twitchSettings).length === 0 ? (
          <div className="text-center py-12">
            {activeTab === 'youtube' ? (
              <Youtube className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            ) : (
              <Twitch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              まだ{activeTab === 'youtube' ? 'YouTube' : 'Twitch'}通知設定がありません
            </h3>
            <p className="text-gray-500 mb-6">
              新しい通知設定を追加して、{activeTab === 'youtube' ? 'YouTubeチャンネルの更新' : 'Twitch配信の開始'}を受け取りましょう
            </p>
            <button
              onClick={activeTab === 'youtube' ? handleAddNew : handleAddNewTwitch}
              className={`${
                activeTab === 'youtube' 
                  ? 'bg-[#5865f2] hover:bg-[#4752c4]' 
                  : 'bg-[#9146ff] hover:bg-[#7c3aed]'
              } text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors`}
            >
              <Plus className="w-5 h-5" />
              最初の{activeTab === 'youtube' ? 'YouTube' : 'Twitch'}通知設定を追加
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeTab === 'youtube' ? (
              settings.map((setting) => (
                <NotificationCard
                  key={setting.id}
                  setting={setting}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewLogs={handleViewLogs}
                />
              ))
            ) : (
              twitchSettings.map((setting) => (
                <TwitchNotificationCard
                  key={setting.id}
                  setting={setting}
                  onEdit={handleTwitchEdit}
                  onDelete={handleTwitchDelete}
                  onViewLogs={handleViewLogs}
                />
              ))
            )}
          </div>
        )}

        <NotificationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          editingItem={editingItem}
        />

        <TwitchNotificationModal
          isOpen={isTwitchModalOpen}
          onClose={handleCloseTwitchModal}
          onSave={handleTwitchSave}
          editingItem={editingTwitchItem}
        />

        <NotificationLogModal
          isOpen={isLogModalOpen}
          onClose={handleCloseLogModal}
          notificationSettingId={selectedSettingForLogs?.id}
          settingName={selectedSettingForLogs?.name}
        />
      </div>
    </div>
  );
}

export default MainPage;