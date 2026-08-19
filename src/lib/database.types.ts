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
