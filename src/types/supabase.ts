export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          plan: 'free' | 'normal' | 'pro'
          is_admin: boolean | null
          is_banned: boolean | null
          stripeCustomerId: string | null
          stripeSubscriptionId: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          plan?: 'free' | 'normal' | 'pro'
          is_admin?: boolean | null
          is_banned?: boolean | null
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          plan?: 'free' | 'normal' | 'pro'
          is_admin?: boolean | null
          is_banned?: boolean | null
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
          created_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          name: string
          channelId: string
          uploadPlaylistId: string | null
          webhookUrl: string
          notifyVideo: boolean
          notifyShorts: boolean
          notifyLive: boolean
          notifyPremiere: boolean
          lastVideoId: string | null
          template: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          channelId: string
          uploadPlaylistId?: string | null
          webhookUrl: string
          notifyVideo?: boolean
          notifyShorts?: boolean
          notifyLive?: boolean
          notifyPremiere?: boolean
          lastVideoId?: string | null
          template: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          channelId?: string
          uploadPlaylistId?: string | null
          webhookUrl?: string
          notifyVideo?: boolean
          notifyShorts?: boolean
          notifyLive?: boolean
          notifyPremiere?: boolean
          lastVideoId?: string | null
          template?: string
          created_at?: string
        }
      }
      twitch_notification_settings: {
        Row: {
          id: string
          user_id: string
          name: string
          streamerLogin: string
          webhookUrl: string
          template: string
          lastStartedAt: string | null
          notifyTwitch: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          streamerLogin: string
          webhookUrl: string
          template: string
          lastStartedAt?: string | null
          notifyTwitch?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          streamerLogin?: string
          webhookUrl?: string
          template?: string
          lastStartedAt?: string | null
          notifyTwitch?: boolean
          created_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string
          notificationSettingId: string
          platform: 'youtube' | 'twitch'
          type: 'video' | 'shorts' | 'live' | 'premiere'
          videoId: string | null
          message: string
          sentAt: string
          status: 'success' | 'error'
          errorMessage: string | null
        }
        Insert: {
          id?: string
          user_id: string
          notificationSettingId: string
          platform: 'youtube' | 'twitch'
          type: 'video' | 'shorts' | 'live' | 'premiere'
          videoId?: string | null
          message: string
          sentAt: string
          status: 'success' | 'error'
          errorMessage?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          notificationSettingId?: string
          platform?: 'youtube' | 'twitch'
          type?: 'video' | 'shorts' | 'live' | 'premiere'
          videoId?: string | null
          message?: string
          sentAt?: string
          status?: 'success' | 'error'
          errorMessage?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}