import { AppError, env } from "./http.ts";
export function randomToken(): string {
  return base64(crypto.getRandomValues(new Uint8Array(32)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
export function base64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
export function unbase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
export async function hash(value: string): Promise<string> {
  return base64(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  );
}
async function key(): Promise<CryptoKey> {
  const raw = unbase64(env("GOOGLE_TOKEN_ENCRYPTION_KEY"));
  if (raw.length !== 32)
    throw new AppError(
      "INTEGRATION_NOT_CONFIGURED",
      "La clé de chiffrement serveur doit être configurée.",
      503,
    );
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function encrypt(
  value: unknown,
): Promise<{ ciphertext: string; iv: string; key_version: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(),
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return {
    ciphertext: base64(new Uint8Array(cipher)),
    iv: base64(iv),
    key_version: Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION") || "v1",
  };
}
export async function decrypt<T>(encrypted: {
  ciphertext: string;
  iv: string;
  key_version: string;
}): Promise<T> {
  if (
    encrypted.key_version !==
    (Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION") || "v1")
  )
    throw new AppError(
      "ENCRYPTION_KEY_MISMATCH",
      "La connexion Google nécessite une intervention administrative.",
      503,
    );
  return JSON.parse(
    new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: unbase64(encrypted.iv) },
        await key(),
        unbase64(encrypted.ciphertext),
      ),
    ),
  ) as T;
}
export async function constantTimeEqual(
  left: string,
  right: string,
): Promise<boolean> {
  const [a, b] = await Promise.all([hash(left), hash(right)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
