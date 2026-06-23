import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LogType = "login" | "logout" | "break";

export interface LogEntry {
  id: string;
  name: string;
  type: LogType;
  image_url: string;
  created_at: string;
}
