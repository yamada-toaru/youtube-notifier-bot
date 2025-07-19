const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class YouTubeApiClient {
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;

  constructor() {
    this.initializeApiKeys();
  }

  /**
   * 環境変数からAPIキーを初期化
   */
  private initializeApiKeys(): void {
    const keysEnv = import.meta.env.VITE_YOUTUBE_API_KEYS;
    
    if (!keysEnv) {
      console.warn('VITE_YOUTUBE_API_KEYS が設定されていません');
      return;
    }

    // カンマ区切りでAPIキーを分割し、空文字を除外
    this.apiKeys = keysEnv
      .split(',')
      .map((key: string) => key.trim())
      .filter((key: string) => key.length > 0);

    if (this.apiKeys.length === 0) {
      console.warn('有効なYouTube APIキーが見つかりません');
    } else {
      console.log(`✅ ${this.apiKeys.length}個のYouTube APIキーを読み込みました`);
    }
  }

  /**
   * APIキーが設定されているかチェック
   */
  isConfigured(): boolean {
    return this.apiKeys.length > 0 && this.apiKeys.every(key => key !== 'demo_key');
  }

  /**
   * 次のAPIキーを取得（ラウンドロビン方式）
   */
  private getNextApiKey(): string | null {
    if (this.apiKeys.length === 0) {
      return null;
    }

    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  /**
   * 現在のキーインデックスをリセット
   */
  private resetKeyIndex(): void {
    this.currentKeyIndex = 0;
  }

  /**
   * YouTube API エンドポイントにリクエストを送信（自動リトライ付き）
   */
  async fetchWithYoutubeApi(
    endpoint: string, 
    params: Record<string, string>
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('YouTube APIキーが設定されていません');
    }

    const maxRetries = this.apiKeys.length;
    let lastError: Error | null = null;

    // 全てのAPIキーを試行
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const apiKey = this.getNextApiKey();
      if (!apiKey) {
        throw new Error('利用可能なAPIキーがありません');
      }

      try {
        const url = this.buildUrl(endpoint, { ...params, key: apiKey });
        console.log(`🔄 YouTube API リクエスト (キー ${attempt + 1}/${maxRetries}): ${endpoint}`);
        
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          const error = new Error(`YouTube API Error: ${data.error?.message || 'Unknown error'}`);
          (error as any).status = response.status;
          (error as any).code = data.error?.code;
          throw error;
        }

        console.log(`✅ YouTube API リクエスト成功 (キー ${attempt + 1})`);
        return data;

      } catch (error) {
        lastError = error as Error;
        const status = (error as any).status;
        
        console.warn(`⚠️ YouTube API エラー (キー ${attempt + 1}): ${lastError.message}`);

        // 403 (Quota exceeded) や 429 (Rate limit) の場合は次のキーを試す
        if (status === 403 || status === 429) {
          console.log(`🔄 次のAPIキーでリトライします...`);
          continue;
        }

        // その他のエラー（400, 404など）は即座に失敗
        if (status >= 400 && status < 500 && status !== 403 && status !== 429) {
          console.error(`❌ 回復不可能なエラー (${status}): ${lastError.message}`);
          throw lastError;
        }

        // ネットワークエラーなどの場合も次のキーを試す
        continue;
      }
    }

    // 全てのキーで失敗した場合
    this.resetKeyIndex();
    throw new Error(`全てのYouTube APIキーでリクエストが失敗しました: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * URLを構築
   */
  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  /**
   * 利用可能なAPIキー数を取得
   */
  getAvailableKeyCount(): number {
    return this.apiKeys.length;
  }

  /**
   * 現在のキーインデックスを取得（デバッグ用）
   */
  getCurrentKeyIndex(): number {
    return this.currentKeyIndex;
  }
}

// シングルトンインスタンスをエクスポート
export const youtubeApiClient = new YouTubeApiClient();

// 使いやすいラッパー関数をエクスポート
export const fetchWithYoutubeApi = (
  endpoint: string, 
  params: Record<string, string>
): Promise<any> => {
  return youtubeApiClient.fetchWithYoutubeApi(endpoint, params);
};