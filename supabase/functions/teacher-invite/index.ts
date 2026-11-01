import {
  AppError,
  appUrl,
  authenticate,
  body,
  command,
  endpoint,
  text,
} from "../_shared/http.ts";
Deno.serve(
  endpoint(async (req) => {
    const { admin, user } = await authenticate(req, "admin"),
      input = await body(req);
    const email = text(input.email, 254).toLowerCase(),
      displayName = text(input.displayName, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AppError("INVALID_REQUEST", "Adresse email invalide.");
    const invitation = await command<{ id: string }>(admin, "invite_begin", {
      admin_id: user.id,
      email,
      display_name: displayName,
    });
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { display_name: displayName },
      redirectTo: `${appUrl()}/auth/callback`,
    });
    if (error || !data.user) {
      await command(admin, "invite_failed", { id: invitation.id });
      throw new AppError(
        "INVITATION_FAILED",
        "L’invitation n’a pas pu être envoyée. Vérifiez l’adresse et la configuration des emails.",
        422,
      );
    }
    return await command(admin, "invite_complete", {
      id: invitation.id,
      user_id: data.user.id,
    });
  }),
);
