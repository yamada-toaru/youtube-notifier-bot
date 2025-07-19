import { YouTubeVideo, YouTubeChannel } from '../types/notification';
import { fetchWithYoutubeApi } from '../lib/youtubeClient';

export class YouTubeService {
  /**
   * APIキーが設定されているかチェック
   */
  isConfigured(): boolean {
    const keysEnv = import.meta.env.VITE_YOUTUBE_API_KEYS;
    return !!keysEnv && keysEnv !== 'demo_key';
  }

  /**
   * チャンネル情報とuploadsプレイリストIDを取得
   */
  async getChannelInfo(channelId: string): Promise<YouTubeChannel> {
    if (!this.isConfigured()) {
      throw new Error('YouTube API キーが設定されていません');
    }

    try {
      const data = await fetchWithYoutubeApi('channels', {
        part: 'snippet,contentDetails',
        id: channelId
      });
      
      if (!data.items || data.items.length === 0) {
        throw new Error('チャンネルが見つかりません');
      }
      
      const channel = data.items[0];
      return {
        id: channel.id,
        title: channel.snippet.title,
        uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
      };
    } catch (error) {
      console.error('チャンネル情報取得エラー:', error);
      throw error;
    }
  }

  /**
   * プレイリストから最新動画を1件取得
   */
  async getLatestVideo(playlistId: string): Promise<YouTubeVideo | null> {
    if (!this.isConfigured()) {
      throw new Error('YouTube API キーが設定されていません');
    }

    try {
      const data = await fetchWithYoutubeApi('playlistItems', {
        part: 'snippet',
        playlistId: playlistId,
        maxResults: '1',
        order: 'date'
      });
      
      if (!data.items || data.items.length === 0) {
        return null;
      }
      
      const item = data.items[0];
      const videoId = item.snippet.resourceId.videoId;
      
      // 動画の詳細情報（長さ）を取得
      const videoDetails = await this.getVideoDetails(videoId);
      
      return {
        id: videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        duration: videoDetails.duration,
        channelTitle: item.snippet.channelTitle,
        liveBroadcastContent: videoDetails.liveBroadcastContent,
        scheduledStartTime: videoDetails.scheduledStartTime,
        actualStartTime: videoDetails.actualStartTime
      };
    } catch (error) {
      console.error('最新動画取得エラー:', error);
      throw error;
    }
  }

  /**
   * 動画の詳細情報（長さなど）を取得
   */
  async getVideoDetails(videoId: string): Promise<{ 
    duration: string;
    liveBroadcastContent: string;
    scheduledStartTime?: string;
    actualStartTime?: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('YouTube API キーが設定されていません');
    }

    try {
      const data = await fetchWithYoutubeApi('videos', {
        part: 'contentDetails,snippet,liveStreamingDetails',
        id: videoId
      });
      
      if (!data.items || data.items.length === 0) {
        throw new Error('動画が見つかりません');
      }
      
      const video = data.items[0];
      
      return {
        duration: video.contentDetails.duration,
        liveBroadcastContent: video.snippet.liveBroadcastContent,
        scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
        actualStartTime: video.liveStreamingDetails?.actualStartTime
      };
    } catch (error) {
      console.error('動画詳細取得エラー:', error);
      throw error;
    }
  }

  /**
   * ISO 8601 duration を秒数に変換
   */
  parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 動画がShorts（2分以内）かどうかを判定
   */
  isShorts(duration: string): boolean {
    const seconds = this.parseDuration(duration);
    return seconds <= 120; // 2分以内 = 120秒以下
  }

  /**
   * 動画が通常動画（2分超）かどうかを判定
   */
  isRegularVideo(duration: string): boolean {
    const seconds = this.parseDuration(duration);
    return seconds > 120; // 2分超
  }

  /**
   * ライブ配信予約かどうかを判定
   */
  isUpcoming(liveBroadcastContent: string): boolean {
    return liveBroadcastContent === 'upcoming';
  }

  /**
   * ライブ配信中かどうかを判定
   */
  isLive(liveBroadcastContent: string): boolean {
    return liveBroadcastContent === 'live';
  }

  /**
   * 通常動画（ライブではない）かどうかを判定
   */
  isNormalContent(liveBroadcastContent: string): boolean {
    return liveBroadcastContent === 'none';
  }
}

export const youtubeService = new YouTubeService();