import { TwitchStream } from '../types/notification';

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';
const CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_TWITCH_CLIENT_SECRET;

export class TwitchService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * APIキーが設定されているかチェック
   */
  isConfigured(): boolean {
    return !!CLIENT_ID && !!CLIENT_SECRET && 
           CLIENT_ID !== 'demo_client_id' && 
           CLIENT_SECRET !== 'demo_client_secret';
  }

  /**
   * App Access Tokenを取得（client_credentials）
   */
  private async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Twitch API キーが設定されていません');
    }

    // トークンが有効期限内なら再利用
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'client_credentials'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch Token Error: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // 有効期限の少し前（90%）で更新するように設定
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000 * 0.9);
      
      return this.accessToken;
    } catch (error) {
      console.error('Twitchアクセストークン取得エラー:', error);
      throw error;
    }
  }

  /**
   * 配信者の現在の配信状態を取得
   */
  async getStreamStatus(userLogin: string): Promise<TwitchStream | null> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `${TWITCH_API_BASE}/streams?user_login=${userLogin}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': CLIENT_ID
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API Error: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // 配信中の場合はデータが返される
      if (data.data && data.data.length > 0) {
        const stream = data.data[0];
        if (stream.type === 'live') {
          return stream;
        }
      }
      
      return null; // 配信していない
    } catch (error) {
      console.error(`Twitch配信状態取得エラー (${userLogin}):`, error);
      throw error;
    }
  }

  /**
   * 配信者情報を取得（表示名など）
   */
  async getUserInfo(userLogin: string): Promise<{ id: string; login: string; display_name: string } | null> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `${TWITCH_API_BASE}/users?login=${userLogin}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': CLIENT_ID
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twitch API Error: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const user = data.data[0];
        return {
          id: user.id,
          login: user.login,
          display_name: user.display_name
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Twitchユーザー情報取得エラー (${userLogin}):`, error);
      throw error;
    }
  }

  /**
   * 日付を日本語形式でフォーマット
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const twitchService = new TwitchService();