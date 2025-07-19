import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, LogOut } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { adminService } from '../services/adminService';
import { supabase } from '../lib/supabase';

const AdminRoute: React.FC = () => {
  const [is_admin, setis_admin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const hasAccess = await adminService.checkAdminAccess();
      setis_admin(hasAccess);
    } catch (error) {
      console.error('管理者権限チェックエラー:', error);
      setis_admin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.reload();
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
          <p className="text-gray-400">権限を確認中...</p>
        </div>
      </div>
    );
  }

  if (!is_admin) {
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
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">アクセス拒否</h1>
          <p className="text-gray-400 mb-6">
            このページにアクセスするには管理者権限が必要です。
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 py-3 rounded-lg transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
};

export default AdminRoute;
