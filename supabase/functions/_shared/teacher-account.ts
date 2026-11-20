import { AppError, authenticate, body, rpc, text } from "./http.ts";

export async function createTeacher(req: Request) {
  const { admin, user } = await authenticate(req, "admin");
  const input = await body(req);
  const firstName = text(input.firstName, 60);
  const lastName = text(input.lastName, 60);
  const displayName = `${firstName} ${lastName}`;
  const email = text(input.email, 254).toLowerCase();
  // Passwords must never be trimmed, logged, placed in metadata, or returned.
  const password = input.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError("INVALID_REQUEST", "Adresse email invalide.");
  if (displayName.length > 120)
    throw new AppError(
      "INVALID_REQUEST",
      "Le nom complet est limité à 120 caractères.",
    );
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    throw new AppError(
      "INVALID_REQUEST",
      "Le mot de passe doit contenir entre 12 et 128 caractères.",
    );

  await rpc(admin, "authorize_teacher_creation", { p_admin_id: user.id });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
    },
    app_metadata: { kon_fanan_teacher: { created_by: user.id } },
  });
  if (error || !data.user) {
    if (error?.code === "email_exists" || error?.code === "user_already_exists")
      throw new AppError(
        "EMAIL_EXISTS",
        "Cette adresse email est déjà utilisée. Aucun compte existant n’a été modifié.",
        409,
      );
    if (error?.code === "weak_password")
      throw new AppError(
        "WEAK_PASSWORD",
        "Ce mot de passe est trop faible. Choisissez-en un autre.",
        422,
      );
    // A trigger failure rolls back the entire Auth insertion, including profile/access.
    throw new AppError(
      "TEACHER_CREATION_FAILED",
      "Le compte n’a pas pu être créé. Vérifiez la configuration et réessayez plus tard.",
      422,
    );
  }
  return {
    profile: {
      id: data.user.id,
      email,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
      preferred_language: "fr",
    },
    account: { user_id: data.user.id, role: "teacher", status: "active" },
  };
}
