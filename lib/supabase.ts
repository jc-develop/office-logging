import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project.supabase.co") ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-anon-key");

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type LogType = "login" | "logout" | "break";

export interface LogEntry {
  id: string;
  name: string;
  type: LogType;
  image_url: string;
  created_at: string;
}

export interface AdminConfig {
  email: string;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  action: string;
  details: string;
  created_at: string;
}
