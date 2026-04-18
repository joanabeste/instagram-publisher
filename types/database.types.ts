// Hand-authored from supabase/migrations/*.sql to avoid an access-token dependency.
// Regenerate with `pnpm supabase gen types typescript --linked > types/database.types.ts`
// once the CLI is linked, and diff against this file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Plan = 'free' | 'pro' | 'agency'
export type Frequency = 'daily' | '3x-week' | '2x-week' | 'weekly'
export type IdeaStatus = 'new' | 'scripted' | 'rejected'
export type IdeaSource = 'ai' | 'manual' | 'trend-import'
export type RenderStatus = 'draft' | 'queued' | 'rendering' | 'rendered' | 'failed'
export type PostStatus =
  | 'pending-approval'
  | 'approved'
  | 'posting'
  | 'posted'
  | 'failed'
  | 'canceled'

type Timestamptz = string
type UUID = string

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: UUID
          email: string | null
          display_name: string | null
          avatar_url: string | null
          plan: Plan
          onboarding_done: boolean
          created_at: Timestamptz
          updated_at: Timestamptz
        }
        Insert: {
          user_id: UUID
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          plan?: Plan
          onboarding_done?: boolean
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Update: {
          user_id?: UUID
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          plan?: Plan
          onboarding_done?: boolean
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Relationships: []
      }
      briefings: {
        Row: {
          id: UUID
          user_id: UUID
          brand_name: string
          niche: string
          audience: string
          tone: string
          language: string
          content_pillars: string[]
          visual_style: string | null
          music_vibe: string | null
          video_length_sec: number
          frequency: Frequency
          post_times: string[]
          timezone: string
          auto_post: boolean
          is_active: boolean
          created_at: Timestamptz
          updated_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          brand_name: string
          niche: string
          audience: string
          tone: string
          language?: string
          content_pillars?: string[]
          visual_style?: string | null
          music_vibe?: string | null
          video_length_sec?: number
          frequency?: Frequency
          post_times?: string[]
          timezone?: string
          auto_post?: boolean
          is_active?: boolean
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Update: {
          id?: UUID
          user_id?: UUID
          brand_name?: string
          niche?: string
          audience?: string
          tone?: string
          language?: string
          content_pillars?: string[]
          visual_style?: string | null
          music_vibe?: string | null
          video_length_sec?: number
          frequency?: Frequency
          post_times?: string[]
          timezone?: string
          auto_post?: boolean
          is_active?: boolean
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Relationships: []
      }
      instagram_accounts: {
        Row: {
          id: UUID
          user_id: UUID
          briefing_id: UUID
          ig_user_id: string
          ig_username: string | null
          fb_page_id: string
          access_token: string
          token_expires_at: Timestamptz | null
          last_refreshed_at: Timestamptz | null
          is_active: boolean
          created_at: Timestamptz
          updated_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          briefing_id: UUID
          ig_user_id: string
          ig_username?: string | null
          fb_page_id: string
          access_token: string
          token_expires_at?: Timestamptz | null
          last_refreshed_at?: Timestamptz | null
          is_active?: boolean
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Update: {
          id?: UUID
          user_id?: UUID
          briefing_id?: UUID
          ig_user_id?: string
          ig_username?: string | null
          fb_page_id?: string
          access_token?: string
          token_expires_at?: Timestamptz | null
          last_refreshed_at?: Timestamptz | null
          is_active?: boolean
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Relationships: []
      }
      ideas: {
        Row: {
          id: UUID
          user_id: UUID
          briefing_id: UUID
          hook: string
          concept: string | null
          hook_type: string | null
          appeal: string | null
          format: string | null
          pillar: string | null
          status: IdeaStatus
          source: IdeaSource
          trend_context: string | null
          created_at: Timestamptz
          updated_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          briefing_id: UUID
          hook: string
          concept?: string | null
          hook_type?: string | null
          appeal?: string | null
          format?: string | null
          pillar?: string | null
          status?: IdeaStatus
          source?: IdeaSource
          trend_context?: string | null
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Update: {
          id?: UUID
          user_id?: UUID
          briefing_id?: UUID
          hook?: string
          concept?: string | null
          hook_type?: string | null
          appeal?: string | null
          format?: string | null
          pillar?: string | null
          status?: IdeaStatus
          source?: IdeaSource
          trend_context?: string | null
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Relationships: []
      }
      scripts: {
        Row: {
          id: UUID
          user_id: UUID
          briefing_id: UUID
          idea_id: UUID
          hook_text: string
          segments: Json
          caption: string
          hashtags: string[]
          music_vibe: string | null
          cta: string | null
          total_duration: number | null
          render_status: RenderStatus
          creatomate_job_id: string | null
          video_url: string | null
          thumbnail_url: string | null
          render_error: string | null
          created_at: Timestamptz
          updated_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          briefing_id: UUID
          idea_id: UUID
          hook_text: string
          segments: Json
          caption: string
          hashtags: string[]
          music_vibe?: string | null
          cta?: string | null
          total_duration?: number | null
          render_status?: RenderStatus
          creatomate_job_id?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          render_error?: string | null
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Update: {
          id?: UUID
          user_id?: UUID
          briefing_id?: UUID
          idea_id?: UUID
          hook_text?: string
          segments?: Json
          caption?: string
          hashtags?: string[]
          music_vibe?: string | null
          cta?: string | null
          total_duration?: number | null
          render_status?: RenderStatus
          creatomate_job_id?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          render_error?: string | null
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          id: UUID
          user_id: UUID
          briefing_id: UUID
          script_id: UUID
          ig_account_id: UUID
          scheduled_for: Timestamptz
          status: PostStatus
          ig_media_id: string | null
          ig_permalink: string | null
          post_error: string | null
          posted_at: Timestamptz | null
          created_at: Timestamptz
          updated_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          briefing_id: UUID
          script_id: UUID
          ig_account_id: UUID
          scheduled_for: Timestamptz
          status?: PostStatus
          ig_media_id?: string | null
          ig_permalink?: string | null
          post_error?: string | null
          posted_at?: Timestamptz | null
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Update: {
          id?: UUID
          user_id?: UUID
          briefing_id?: UUID
          script_id?: UUID
          ig_account_id?: UUID
          scheduled_for?: Timestamptz
          status?: PostStatus
          ig_media_id?: string | null
          ig_permalink?: string | null
          post_error?: string | null
          posted_at?: Timestamptz | null
          created_at?: Timestamptz
          updated_at?: Timestamptz
        }
        Relationships: []
      }
      post_insights: {
        Row: {
          id: UUID
          user_id: UUID
          scheduled_post_id: UUID
          ig_media_id: string
          plays: number
          reach: number
          likes: number
          comments: number
          shares: number
          saves: number
          fetched_at: Timestamptz
          created_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id: UUID
          scheduled_post_id: UUID
          ig_media_id: string
          plays?: number
          reach?: number
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          fetched_at?: Timestamptz
          created_at?: Timestamptz
        }
        Update: {
          id?: UUID
          user_id?: UUID
          scheduled_post_id?: UUID
          ig_media_id?: string
          plays?: number
          reach?: number
          likes?: number
          comments?: number
          shares?: number
          saves?: number
          fetched_at?: Timestamptz
          created_at?: Timestamptz
        }
        Relationships: []
      }
      job_logs: {
        Row: {
          id: UUID
          user_id: UUID | null
          job_type: string
          status: string
          payload: Json | null
          error: string | null
          duration_ms: number | null
          created_at: Timestamptz
        }
        Insert: {
          id?: UUID
          user_id?: UUID | null
          job_type: string
          status: string
          payload?: Json | null
          error?: string | null
          duration_ms?: number | null
          created_at?: Timestamptz
        }
        Update: {
          id?: UUID
          user_id?: UUID | null
          job_type?: string
          status?: string
          payload?: Json | null
          error?: string | null
          duration_ms?: number | null
          created_at?: Timestamptz
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      handle_new_user: {
        Args: Record<string, never>
        Returns: unknown
      }
      set_updated_at: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
