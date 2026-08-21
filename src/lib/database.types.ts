export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface QuestionOption {
  label: string
  text: string
  category: string
}

export interface Question {
  id: number
  content: string
  options: QuestionOption[]
  order_num: number
}

export interface Submission {
  id: string
  student_id: string
  department: string
  answers: Record<string, string>
  scores: Record<string, number>
  result: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      authorized_admins: {
        Row:    { student_id: string; email: string; display_name: string | null; created_at: string }
        Insert: { student_id: string; email: string; display_name?: string | null; created_at?: string }
        Update: { email?: string; display_name?: string | null }
        Relationships: []
      }
      admin_accounts: {
        Row:    { student_id: string; password_hash: string | null; is_active: boolean; created_at: string; last_login: string | null }
        Insert: { student_id: string; password_hash?: string | null; is_active?: boolean; created_at?: string; last_login?: string | null }
        Update: { password_hash?: string | null; is_active?: boolean; last_login?: string | null }
        Relationships: []
      }
      admin_otps: {
        Row:    { id: string; student_id: string; code: string; expires_at: string; used: boolean; created_at: string }
        Insert: { id?: string; student_id: string; code: string; expires_at: string; used?: boolean; created_at?: string }
        Update: { used?: boolean }
        Relationships: []
      }
      questions: {
        Row: {
          id: number
          content: string
          options: Json
          order_num: number
        }
        Insert: {
          content: string
          options: Json
          order_num?: number
        }
        Update: {
          content?: string
          options?: Json
          order_num?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          content: string
          result_category: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          result_category?: string
          created_at?: string
        }
        Update: {
          content?: string
          result_category?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          id: string
          student_id: string
          department: string
          answers: Json
          scores: Json
          result: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          department: string
          answers: Json
          scores: Json
          result: string
          created_at?: string
        }
        Update: {
          student_id?: string
          department?: string
          answers?: Json
          scores?: Json
          result?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
