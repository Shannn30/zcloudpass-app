// Simple client-side encryption using Web Crypto API
// This is a basic implementation - in production, consider using a dedicated library

interface VaultEntry {
  id: string;
  name: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}

interface Vault {
  entries: VaultEntry[];
}

/**
 * Derive a key from the master password using PBKDF2
 */
async function deriveKey(
  masterPassword: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt the vault data
 */
export async function encryptVault(
  vault: Vault,
  masterPassword: string,
): Promise<string> {
  console.log("Encrypting vault with", vault.entries.length, "entries");

  // Generate a random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive encryption key from master password
  const key = await deriveKey(masterPassword, salt);

  // Encrypt the vault JSON
  const encoder = new TextEncoder();
  const vaultJson = JSON.stringify(vault);
  const vaultBuffer = encoder.encode(vaultJson);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    vaultBuffer,
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(
    salt.length + iv.length + encryptedBuffer.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

  // Convert to base64
  const base64 = btoa(String.fromCharCode(...combined));
  console.log("Vault encrypted successfully");

  return base64;
}

/**
 * Decrypt the vault data
 */
export async function decryptVault(
  encryptedVault: string,
  masterPassword: string,
): Promise<Vault> {
  console.log("Decrypting vault");

  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedVault), (c) =>
      c.charCodeAt(0),
    );

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);

    // Derive the same key from master password
    const key = await deriveKey(masterPassword, salt);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedData,
    );

    // Convert back to JSON
    const decoder = new TextDecoder();
    const vaultJson = decoder.decode(decryptedBuffer);
    const vault = JSON.parse(vaultJson) as Vault;

    console.log(
      "Vault decrypted successfully,",
      vault.entries.length,
      "entries",
    );
    return vault;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt vault. Wrong password?");
  }
}

/**
 * Create an empty vault
 */
export function createEmptyVault(): Vault {
  return { entries: [] };
}

/**
 * Generate a random password
 */
export function generatePassword(length: number = 16): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  return password;
}

export type { Vault, VaultEntry };
