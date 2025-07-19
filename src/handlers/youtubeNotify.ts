import { youtubeService } from '../services/youtubeService';
import { discordService } from '../services/discordService';
import { notificationService } from '../services/notificationService';
import { notificationLogService } from '../services/notificationLogService';
import { planService } from '../services/planService';
import { contentFetchService } from '../services/contentFetchService';
import { NotificationSetting, YouTubeVideo } from '../types/notification';

export class YouTubeNotificationHandler {
  private isRunning = false;
  private intervalId: number | null = null;

  /**
   * 通知処理を開始（5分間隔）
   */
  start(): void {
    if (this.isRunning) {
      console.log('通知処理は既に実行中です');
      return;
    }

    this.isRunning = true;
    console.log('YouTube通知処理を開始しました');

    // 即座に1回実行
    this.checkAllNotifications();

    // 5分間隔で定期実行
    this.intervalId = window.setInterval(() => {
      this.checkAllNotifications();
    }, 5 * 60 * 1000); // 5分 = 300,000ms
  }

  /**
   * 通知処理を停止
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('YouTube通知処理を停止しました');
  }

  /**
   * 全ての通知設定をチェック
   */
  private async checkAllNotifications(): Promise<void> {
    // APIキーの設定チェック
    if (!youtubeService.isConfigured()) {
      console.log('YouTube API キーが設定されていないため、通知チェックをスキップしました');
      return;
    }

    // プランに応じた実行間隔チェック
    const shouldRun = await planService.shouldRunNotificationCheck();
    if (!shouldRun) {
      console.log('プラン制限により、YouTube通知チェックをスキップしました');
      return;
    }

    try {
      // contentFetchServiceを使用して最新コンテンツを取得
      const latestContents = await contentFetchService.fetchAllLatestContent();
      const youtubeContents = latestContents.filter(content => 
        content.platform === 'youtube' && content.isNew
      );

      console.log(`${youtubeContents.length}件の新しいYouTubeコンテンツを検出`);

      for (const content of youtubeContents) {
        try {
          await this.processNewContent(content);
        } catch (error) {
          console.error(`コンテンツ ${content.title} の処理でエラー:`, error);
          // エラーが発生しても他の設定の処理は継続
        }
      }
    } catch (error) {
      console.error('通知設定の取得でエラー:', error);
    }
  }

  /**
   * 新しいコンテンツの通知処理
   */
  private async processNewContent(content: LatestContentResult): Promise<void> {
    try {
      // 通知設定を取得
      const settings = await notificationService.getAll();
      const setting = settings.find(s => s.id === content.settingId);
      if (!setting) return;

      // 通知を送信
      await this.sendNotification(setting, content);

      // lastVideoIdを更新
      await notificationService.updateLastVideoId(setting.id, content.contentId);

      console.log(`通知送信完了 (${content.contentType}): ${setting.name} - ${content.title}`);

    } catch (error) {
      console.error(`通知処理エラー (${content.title}):`, error);
      throw error;
    }
  }

  /**
   * Discord通知を送信
   */
  private async sendNotification(
    setting: NotificationSetting, 
    content: LatestContentResult
  ): Promise<void> {
    const variables = {
      title: content.title,
      link: content.url,
      published: discordService.formatDate(content.publishedAt),
      scheduled: '', // TODO: 必要に応じて追加
      started: '' // TODO: 必要に応じて追加
    };

    const message = discordService.formatTemplate(setting.template, variables);
    
    // 通知タイプを決定
    const notificationType = content.contentType as 'video' | 'shorts' | 'live' | 'premiere';

    try {
      await discordService.sendNotification(setting.webhookUrl, message);
      
      // 成功ログを記録
      await notificationLogService.logSuccess(
        setting.id,
        'youtube',
        notificationType,
        message,
        content.contentId
      );
    } catch (error) {
      // エラーログを記録
      await notificationLogService.logError(
        setting.id,
        'youtube',
        notificationType,
        message,
        error instanceof Error ? error.message : 'Unknown error',
        content.contentId
      );
      throw error;
    }
  }

  /**
   * 実行状態を取得 
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export const youtubeNotificationHandler = new YouTubeNotificationHandler();