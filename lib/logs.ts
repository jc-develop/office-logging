import { supabase, type LogEntry, type LogType } from "./supabase";

const BUCKET = "log-images";

/** Convert a base64 data URL (from the webcam) into a Blob for upload. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Upload the captured photo to Supabase Storage and record a log entry.
 * Returns the inserted row.
 */
export async function createLog(
  name: string,
  type: LogType,
  imageDataUrl: string
): Promise<LogEntry> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Please enter your name.");
  if (!imageDataUrl) throw new Error("Please capture a photo first.");

  const blob = dataUrlToBlob(imageDataUrl);
  const safeName = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const path = `${safeName}/${type}-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("logs")
    .insert({ name: trimmedName, type, image_url: publicUrl })
    .select()
    .single();

  if (error) {
    throw new Error(`Saving log failed: ${error.message}`);
  }

  return data as LogEntry;
}

/** Fetch the most recent log entries, newest first. */
export async function getLogs(limit = 100): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as LogEntry[];
}
