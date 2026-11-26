import { AppError, authenticate, body, rpc, uuid } from "./http.ts";

export async function resetStudentPassword(req: Request) {
  const { admin, user } = await authenticate(req, "admin");
  const input = await body(req);
  const studentId = uuid(input.studentId);
  const password = input.password;
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    throw new AppError(
      "INVALID_REQUEST",
      "Le mot de passe doit contenir entre 12 et 128 caractères.",
    );
  await rpc(admin, "authorize_student_password_reset", {
    p_admin_id: user.id,
    p_student_id: studentId,
  });
  const { error } = await admin.auth.admin.updateUserById(studentId, {
    password,
    email_confirm: true,
  });
  if (error)
    throw new AppError(
      "PASSWORD_RESET_FAILED",
      "Le mot de passe n’a pas pu être modifié. Réessayez plus tard.",
      422,
    );
  // The administrator generated the password in memory. Never return or log it.
  return { student_id: studentId, updated: true };
}
