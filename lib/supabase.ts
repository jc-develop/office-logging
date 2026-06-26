import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Detect if we are using placeholder/mock keys
export const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project.supabase.co") ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-anon-key");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LogType = "login" | "logout" | "break";
export type UserRole = "staff" | "intern" | "guest" | "client" | "admin";

export interface LogEntry {
  id: string;
  name: string;
  type: LogType;
  role: UserRole;
  image_url: string;
  created_at: string;
  badges?: string[]; // dynamically computed or stored badges (e.g., Early Bird, Streak Master, etc.)
}

export interface AdminActivityLog {
  id: string;
  action: string; // e.g. "SIGN_IN", "SIGN_OUT", "VIEW_LOGS", "FAILED_SIGN_IN"
  details: string;
  created_at: string;
}
