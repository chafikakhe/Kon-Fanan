import { AppError, authenticate, endpoint } from "../_shared/http.ts";

// Stale clients must not send invitations after deployment.
Deno.serve(
  endpoint(async (req) => {
    await authenticate(req, "admin");
    throw new AppError(
      "INVITATION_RETIRED",
      "Utilisez « Ajouter un professeur » pour créer un compte avec un mot de passe initial.",
      410,
    );
  }),
);
