import crypto from "crypto";

const KEY_ENV = "NAME_ENCRYPTION_KEY";
const PEPPER_ENV = "NAME_HASH_PEPPER";

function getKeyAndAlgo(): { key: Buffer; algo: "aes-256-gcm" } | { key: Buffer; algo: "aes-128-gcm" } {
  const hex = process.env[KEY_ENV];
  if (hex) {
    const key = Buffer.from(hex, "hex");
    if (key.length === 32) return { key, algo: "aes-256-gcm" };
    if (key.length === 16) return { key, algo: "aes-128-gcm" };
    throw new Error(
      `Invalid ${KEY_ENV}: expected 32-byte (64 hex chars) or 16-byte (32 hex chars) key, got ${hex.length}-char string (${key.length} bytes)`,
    );
  }
  // Development fallback — derive a deterministic key from a string
  return { key: crypto.scryptSync("dev-fallback-key-2024", "crypt-salt", 32), algo: "aes-256-gcm" };
}

/** Encrypt a plaintext name. Returns "iv:authTag:ciphertext" (hex). */
export function encryptName(plaintext: string): string {
  const { key, algo } = getKeyAndAlgo();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algo, key, iv);
  let enc = cipher.update(plaintext, "utf8", "hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${enc}`;
}

/** Decrypt a "iv:authTag:ciphertext" string back to plaintext. */
export function decryptName(ciphertext: string): string {
  const { key, algo } = getKeyAndAlgo();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid ciphertext format");
  const [ivHex, tagHex, enc] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(algo, key, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(enc, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

/**
 * Deterministic SHA-256 hash for lookups.
 * Uses a pepper so raw names cannot be rainbow-tabled.
 */
export function hashName(name: string): string {
  const pepper = process.env[PEPPER_ENV] || "dev-fallback-pepper";
  const normalized = name.trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized + pepper).digest("hex");
}
