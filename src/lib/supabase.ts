import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Candidate = {
  id?: string
  email: string
  personal_email?: string
  mobile?: string
  name?: string
  title?: string
  company?: string
  city?: string
  years_exp?: number
  photo_url?: string
  looking_for?: string
  prompt_1_q?: string
  prompt_1_a?: string
  prompt_2_q?: string
  prompt_2_a?: string
  prompt_3_q?: string
  prompt_3_a?: string
  skills?: string[]
  career?: any[]
  domain?: string
  status?: string
}

export type Recruiter = {
  id?: string
  email: string
  name?: string
  title?: string
  company?: string
  city?: string
  years_recruiting?: number
  specialisations?: string[]
  career?: any[]
  bio?: string
  hire_skills?: string[]
  status?: string
}

export type JD = {
  id?: string
  recruiter_id?: string
  title: string
  company?: string
  team?: string
  work_style?: string
  min_years?: number
  salary_range?: string
  must_have_skills?: string[]
  good_to_have_skills?: string[]
  non_negotiables?: string
  real_tuesday?: string
  interview_process?: string
  status?: string
}
