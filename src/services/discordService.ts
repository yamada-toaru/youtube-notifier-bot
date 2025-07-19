export class DiscordService {
  /**
   * Discord Webhookに通知を送信
   */
  async sendNotification(webhookUrl: string, content: string): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          username: 'YouTube通知Bot',
          avatar_url: 'https://www.youtube.com/favicon.ico'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord Webhook Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Discord通知送信エラー:', error);
      throw error;
    }
  }

  /**
   * テンプレートに変数を埋め込み
   */
  formatTemplate(template: string, variables: Record<string, string>): string {
    let formatted = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      formatted = formatted.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return formatted;
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

export const discordService = new DiscordService();