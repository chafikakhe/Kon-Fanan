import type { SupabaseClient } from "@supabase/supabase-js";

export function generatePassword(): string {
  const groups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%*-_+",
  ];
  const alphabet = groups.join("");
  // Rejection sampling avoids modulo bias; Web Crypto is required.
  function randomIndex(length: number) {
    const limit = 256 - (256 % length);
    let value: number;
    do {
      value = crypto.getRandomValues(new Uint8Array(1))[0];
    } while (value >= limit);
    return value % length;
  }
  const chars = groups.map((group) => group[randomIndex(group.length)]);
  while (chars.length < 20) chars.push(alphabet[randomIndex(alphabet.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export async function changeAccountPassword(
  auth: SupabaseClient["auth"],
  current: string,
  password: string,
  confirmation: string,
  verificationAuth: SupabaseClient["auth"],
) {
  if (!current) throw Error("Saisissez votre mot de passe actuel.");
  if (password.length < 12 || password.length > 128)
    throw Error(
      "Le nouveau mot de passe doit contenir entre 12 et 128 caractères.",
    );
  if (password !== confirmation)
    throw Error("Les nouveaux mots de passe ne correspondent pas.");
  if (current === password)
    throw Error("Choisissez un mot de passe différent du mot de passe actuel.");
  const identity = await auth.getUser();
  if (identity.error || !identity.data.user?.email)
    throw Error("Reconnectez-vous puis réessayez la modification.");
  // current_password is only enforced by some Auth configurations. Always
  // verify through a separate, memory-only client before updating the session.
  const verified = await verificationAuth.signInWithPassword({
    email: identity.data.user.email,
    password: current,
  });
  if (verified.error) {
    if (verified.error.code === "invalid_credentials")
      throw Error("Le mot de passe actuel est incorrect.");
    throw Error(
      "La vérification du mot de passe actuel a échoué. Réessayez dans quelques minutes.",
    );
  }
  try {
    if (verified.data.user.id !== identity.data.user.id)
      throw Error("La vérification du compte a échoué. Reconnectez-vous.");
  } finally {
    // Only revoke the temporary session, never the user's current session.
    await verificationAuth.signOut({ scope: "local" });
  }
  const { error } = await auth.updateUser({
    password,
    current_password: current,
  });
  if (!error) return;
  const messages: Record<string, string> = {
    invalid_credentials: "Le mot de passe actuel est incorrect.",
    current_password_invalid: "Le mot de passe actuel est incorrect.",
    current_password_mismatch: "Le mot de passe actuel est incorrect.",
    weak_password:
      "Le nouveau mot de passe est trop faible. Choisissez-en un autre.",
    same_password:
      "Choisissez un mot de passe différent du mot de passe actuel.",
    reauthentication_needed: "Reconnectez-vous puis réessayez la modification.",
    over_request_rate_limit:
      "Trop de tentatives. Réessayez dans quelques minutes.",
  };
  throw Error(
    messages[error.code || ""] ||
      "Le mot de passe n’a pas pu être modifié. Vérifiez votre session et réessayez.",
  );
}
