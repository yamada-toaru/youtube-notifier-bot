import { youtubeService } from './youtubeService';
import { twitchService } from './twitchService';
import { notificationService } from './notificationService';
import { twitchNotificationService } from './twitchNotificationService';
import { NotificationSetting, TwitchNotificationSetting } from '../types/notification';

export interface LatestContentResult {
  settingId: string;
  platform: 'youtube' | 'twitch';
  contentId: string;
  title: string;
  url: string;
  publishedAt: string;
  contentType: 'video' | 'shorts' | 'live' | 'premiere' | 'stream';
  isNew: boolean;
}

export class ContentFetchService {
  /**
   * 全ての通知設定から最新コンテンツを取得
   */
  async fetchAllLatestContent(): Promise<LatestContentResult[]> {
    const results: LatestContentResult[] = [];

    try {
      // YouTube通知設定を処理
      const youtubeSettings = await notificationService.getActiveNotifications();
      for (const setting of youtubeSettings) {
        try {
          const result = await this.fetchYouTubeContent(setting);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.error(`YouTube設定 ${setting.name} の処理エラー:`, error);
        }
      }

      // Twitch通知設定を処理
      const twitchSettings = await twitchNotificationService.getActiveNotifications();
      for (const setting of twitchSettings) {
        try {
          const result = await this.fetchTwitchContent(setting);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.error(`Twitch設定 ${setting.name} の処理エラー:`, error);
        }
      }

    } catch (error) {
      console.error('コンテンツ取得処理でエラー:', error);
    }

    return results;
  }

  /**
   * YouTube設定から最新動画を取得
   */
  private async fetchYouTubeContent(setting: NotificationSetting): Promise<LatestContentResult | null> {
    try {
      // プレイリストIDが未取得の場合は取得
      if (!setting.uploadPlaylistId) {
        const channelInfo = await youtubeService.getChannelInfo(setting.channelId);
        await notificationService.updatePlaylistId(setting.id, channelInfo.uploadsPlaylistId);
        setting.uploadPlaylistId = channelInfo.uploadsPlaylistId;
      }

      // 最新動画を取得
      const latestVideo = await youtubeService.getLatestVideo(setting.uploadPlaylistId);
      if (!latestVideo) {
        return null;
      }

      // 新規動画かどうかをチェック
      const isNew = setting.lastVideoId !== latestVideo.id;

      // 動画の種類を判定
      const isShorts = youtubeService.isShorts(latestVideo.duration);
      const isUpcoming = youtubeService.isUpcoming(latestVideo.liveBroadcastContent);
      const isLive = youtubeService.isLive(latestVideo.liveBroadcastContent);

      let contentType: 'video' | 'shorts' | 'live' | 'premiere';
      if (isUpcoming) {
        contentType = 'premiere';
      } else if (isLive) {
        contentType = 'live';
      } else if (isShorts) {
        contentType = 'shorts';
      } else {
        contentType = 'video';
      }

      // 通知対象かどうかをチェック
      const shouldNotify = this.shouldNotifyYouTube(setting, contentType);
      if (!shouldNotify) {
        // 通知対象外でも lastVideoId は更新
        if (isNew) {
          await notificationService.updateLastVideoId(setting.id, latestVideo.id);
        }
        return null;
      }

      const videoUrl = isShorts 
        ? `https://www.youtube.com/shorts/${latestVideo.id}`
        : `https://www.youtube.com/watch?v=${latestVideo.id}`;

      return {
        settingId: setting.id,
        platform: 'youtube',
        contentId: latestVideo.id,
        title: latestVideo.title,
        url: videoUrl,
        publishedAt: latestVideo.publishedAt,
        contentType,
        isNew
      };

    } catch (error) {
      console.error(`YouTube設定 ${setting.name} の処理エラー:`, error);
      return null;
    }
  }

  /**
   * Twitch設定から最新配信を取得
   */
  private async fetchTwitchContent(setting: TwitchNotificationSetting): Promise<LatestContentResult | null> {
    try {
      // 配信状態を取得
      const stream = await twitchService.getStreamStatus(setting.streamerLogin);
      if (!stream) {
        return null; // 配信していない
      }

      // 新しい配信かどうかをチェック
      const isNew = setting.lastStartedAt !== stream.started_at;
      if (!isNew) {
        return null; // 既知の配信
      }

      const streamUrl = `https://twitch.tv/${stream.user_login}`;

      return {
        settingId: setting.id,
        platform: 'twitch',
        contentId: stream.id,
        title: stream.title,
        url: streamUrl,
        publishedAt: stream.started_at,
        contentType: 'stream',
        isNew
      };

    } catch (error) {
      console.error(`Twitch設定 ${setting.name} の処理エラー:`, error);
      return null;
    }
  }

  /**
   * YouTube通知対象かどうかを判定
   */
  private shouldNotifyYouTube(setting: NotificationSetting, contentType: 'video' | 'shorts' | 'live' | 'premiere'): boolean {
    switch (contentType) {
      case 'video':
        return setting.notifyVideo;
      case 'shorts':
        return setting.notifyShorts;
      case 'live':
        return setting.notifyLive;
      case 'premiere':
        return setting.notifyPremiere;
      default:
        return false;
    }
  }

  /**
   * 特定の設定IDの最新コンテンツを取得
   */
  async fetchContentBySetting(settingId: string, platform: 'youtube' | 'twitch'): Promise<LatestContentResult | null> {
    try {
      if (platform === 'youtube') {
        const settings = await notificationService.getAll();
        const setting = settings.find(s => s.id === settingId);
        if (!setting) return null;
        return await this.fetchYouTubeContent(setting);
      } else {
        const settings = await twitchNotificationService.getAll();
        const setting = settings.find(s => s.id === settingId);
        if (!setting) return null;
        return await this.fetchTwitchContent(setting);
      }
    } catch (error) {
      console.error(`設定ID ${settingId} のコンテンツ取得エラー:`, error);
      return null;
    }
  }

  /**
   * APIキーの設定状況をチェック
   */
  getApiStatus(): {
    youtube: boolean;
    twitch: boolean;
  } {
    return {
      youtube: youtubeService.isConfigured(),
      twitch: twitchService.isConfigured()
    };
  }
}

export const contentFetchService = new ContentFetchService();