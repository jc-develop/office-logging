import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_ENV = "NAME_ENCRYPTION_KEY";
const PEPPER_ENV = "NAME_HASH_PEPPER";

function getKey(): Buffer {
  const hex = process.env[KEY_ENV];
  if (hex) {
    const key = Buffer.from(hex, "hex");
    if (key.length === 32) return key;
  }
  // Development fallback — derive a deterministic key from a string
  return crypto.scryptSync("dev-fallback-key-2024", "crypt-salt", 32);
}

/** Encrypt a plaintext name. Returns "iv:authTag:ciphertext" (hex). */
export function encryptName(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let enc = cipher.update(plaintext, "utf8", "hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${enc}`;
}

/** Decrypt a "iv:authTag:ciphertext" string back to plaintext. */
export function decryptName(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid ciphertext format");
  const [ivHex, tagHex, enc] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
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
