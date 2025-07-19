import { twitchService } from '../services/twitchService';
import { discordService } from '../services/discordService';
import { twitchNotificationService } from '../services/twitchNotificationService';
import { notificationLogService } from '../services/notificationLogService';
import { planService } from '../services/planService';
import { contentFetchService } from '../services/contentFetchService';
import { TwitchNotificationSetting, TwitchStream } from '../types/notification';

export class TwitchNotificationHandler {
  private isRunning = false;
  private intervalId: number | null = null;

  /**
   * Twitch通知処理を開始（3分間隔）
   */
  start(): void {
    if (this.isRunning) {
      console.log('Twitch通知処理は既に実行中です');
      return;
    }

    this.isRunning = true;
    console.log('Twitch通知処理を開始しました');

    // 即座に1回実行
    this.checkAllNotifications();

    // 3分間隔で定期実行
    this.intervalId = window.setInterval(() => {
      this.checkAllNotifications();
    }, 3 * 60 * 1000); // 3分 = 180,000ms
  }

  /**
   * Twitch通知処理を停止
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Twitch通知処理を停止しました');
  }

  /**
   * 全てのTwitch通知設定をチェック
   */
  private async checkAllNotifications(): Promise<void> {
    // APIキーの設定チェック
    if (!twitchService.isConfigured()) {
      console.log('Twitch API キーが設定されていないため、通知チェックをスキップしました');
      return;
    }

    // プランに応じた実行間隔チェック
    const shouldRun = await planService.shouldRunNotificationCheck();
    if (!shouldRun) {
      console.log('プラン制限により、Twitch通知チェックをスキップしました');
      return;
    }

    try {
      // contentFetchServiceを使用して最新コンテンツを取得
      const latestContents = await contentFetchService.fetchAllLatestContent();
      const twitchContents = latestContents.filter(content => 
        content.platform === 'twitch' && content.isNew
      );

      console.log(`${twitchContents.length}件の新しいTwitch配信を検出`);

      for (const content of twitchContents) {
        try {
          await this.processNewContent(content);
        } catch (error) {
          console.error(`Twitch配信 ${content.title} の処理でエラー:`, error);
          // エラーが発生しても他の設定の処理は継続
        }
      }
    } catch (error) {
      console.error('Twitch通知設定の取得でエラー:', error);
    }
  }

  /**
   * 新しいTwitch配信の通知処理
   */
  private async processNewContent(content: LatestContentResult): Promise<void> {
    try {
      // 通知設定を取得
      const settings = await twitchNotificationService.getAll();
      const setting = settings.find(s => s.id === content.settingId);
      if (!setting) return;

      // 通知を送信
      await this.sendNotification(setting, content);

      // lastStartedAtを更新
      await twitchNotificationService.updateLastStartedAt(setting.id, content.publishedAt);

      console.log(`Twitch通知送信完了: ${setting.name} - ${content.title}`);

    } catch (error) {
      console.error(`Twitch通知処理エラー (${content.title}):`, error);
      throw error;
    }
  }

  /**
   * Discord通知を送信
   */
  private async sendNotification(
    setting: TwitchNotificationSetting, 
    content: LatestContentResult
  ): Promise<void> {
    // 配信者名を取得（URLから抽出）
    const streamerLogin = content.url.replace('https://twitch.tv/', '');

    const variables = {
      streamer: streamerLogin, // TODO: 表示名が必要な場合は別途取得
      title: content.title,
      link: content.url,
      started: twitchService.formatDate(content.publishedAt)
    };

    const message = discordService.formatTemplate(setting.template, variables);
    
    try {
      await discordService.sendNotification(setting.webhookUrl, message);
      
      // 成功ログを記録
      await notificationLogService.logSuccess(
        setting.id,
        'twitch',
        'live',
        message,
        content.contentId
      );
    } catch (error) {
      // エラーログを記録
      await notificationLogService.logError(
        setting.id,
        'twitch',
        'live',
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

export const twitchNotificationHandler = new TwitchNotificationHandler();