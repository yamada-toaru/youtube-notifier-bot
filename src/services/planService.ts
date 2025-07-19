import { PLAN_LIMITS, PlanLimits } from '../types/notification';
import { userService } from './userService';
import { notificationService } from './notificationService';
import { twitchNotificationService } from './twitchNotificationService';

export class PlanService {
  /**
   * 現在のユーザーのプラン制限を取得
   */
  async getCurrentPlanLimits(): Promise<PlanLimits> {
    const user = await userService.getCurrentUser();
    return PLAN_LIMITS[user.plan];
  }

  /**
   * 通知設定の登録上限チェック
   */
  async canAddNotification(type: 'youtube' | 'twitch' = 'youtube'): Promise<{
    canAdd: boolean;
    currentCount: number;
    maxCount: number;
    remaining: number;
  }> {
    const user = await userService.getCurrentUser();
    const limits = PLAN_LIMITS[user.plan];
    
    // 現在の登録数を取得（YouTubeとTwitchの合計）
    const [youtubeSettings, twitchSettings] = await Promise.all([
      notificationService.getAll(),
      twitchNotificationService.getAll()
    ]);
    
    const currentCount = youtubeSettings.length + twitchSettings.length;
    const remaining = Math.max(0, limits.maxNotifications - currentCount);
    
    return {
      canAdd: currentCount < limits.maxNotifications,
      currentCount,
      maxCount: limits.maxNotifications,
      remaining
    };
  }

  /**
   * 通知処理を実行すべきかどうかを判定（プランに応じた間隔制御）
   */
  async shouldRunNotificationCheck(): Promise<boolean> {
    const user = await userService.getCurrentUser();
    const limits = PLAN_LIMITS[user.plan];
    
    const now = new Date();
    const minutes = now.getMinutes();
    
    // プランに応じた間隔で実行判定
    switch (user.plan) {
      case 'free':
        // 30分ごと（0分、30分）
        return minutes % 30 === 0;
      case 'normal':
        // 5分ごと（0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55分）
        return minutes % 5 === 0;
      case 'pro':
        // 1分ごと（毎分）
        return true;
      default:
        return false;
    }
  }

  /**
   * プラン情報の表示用データを取得
   */
  async getPlanDisplayInfo(): Promise<{
    planName: string;
    currentCount: number;
    maxCount: number;
    remaining: number;
    checkInterval: string;
  }> {
    const user = await userService.getCurrentUser();

    if (!user || !user.plan) {
      throw new Error('ユーザー情報またはプランが取得できません');
}
    const limits = PLAN_LIMITS[user.plan];
    const notificationStatus = await this.canAddNotification();
    
    return {
      planName: limits.displayName,
      currentCount: notificationStatus.currentCount,
      maxCount: notificationStatus.maxCount,
      remaining: notificationStatus.remaining,
      checkInterval: this.formatCheckInterval(limits.checkIntervalMinutes)
    };
  }

  /**
   * チェック間隔を表示用にフォーマット
   */
  private formatCheckInterval(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}時間ごと`;
    } else if (minutes === 1) {
      return '1分ごと';
    } else {
      return `${minutes}分ごと`;
    }
  }
}

export const planService = new PlanService();