import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  changeAccountPassword,
  generatePassword,
} from "../../src/lib/passwords";

type Auth = Parameters<typeof changeAccountPassword>[0];
const user = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "teacher@example.test",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};
function mocks() {
  const updateUser = vi.fn().mockResolvedValue({ error: null });
  const signInWithPassword = vi
    .fn()
    .mockResolvedValue({ data: { user }, error: null });
  const signOut = vi.fn().mockResolvedValue({ error: null });
  return {
    updateUser,
    signInWithPassword,
    signOut,
    auth: {
      updateUser,
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    } as unknown as Auth,
    verifier: { signInWithPassword, signOut } as unknown as Auth,
  };
}
describe("mots de passe", () => {
  it("génère 20 caractères avec quatre familles et une source cryptographique", () => {
    const values = new Set(Array.from({ length: 100 }, generatePassword));
    expect(values.size).toBe(100);
    for (const value of values) {
      expect(value).toHaveLength(20);
      for (const pattern of [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%*\-_+]/])
        expect(value).toMatch(pattern);
    }
  });
  it("refuse les saisies incohérentes sans appel Auth", async () => {
    const { auth, verifier, updateUser, signInWithPassword } = mocks();
    for (const [old, next, confirmation, message] of [
      ["old", "New-password-42!", "different-password", "ne correspondent pas"],
      ["old", "short", "short", "12 et 128"],
      ["New-password-42!", "New-password-42!", "New-password-42!", "différent"],
    ])
      await expect(
        changeAccountPassword(auth, old, next, confirmation, verifier),
      ).rejects.toThrow(message);
    expect(updateUser).not.toHaveBeenCalled();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
  it("vérifie le mot de passe courant avec le fournisseur avant toute modification", async () => {
    const { auth, verifier, updateUser, signInWithPassword, signOut } = mocks();
    signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: { code: "invalid_credentials" },
    });
    await expect(
      changeAccountPassword(
        auth,
        "wrong",
        "New-password-42!",
        "New-password-42!",
        verifier,
      ),
    ).rejects.toThrow("actuel est incorrect");
    expect(updateUser).not.toHaveBeenCalled();
    await changeAccountPassword(
      auth,
      " current password ",
      " New-password-42! ",
      " New-password-42! ",
      verifier,
    );
    expect(signInWithPassword).toHaveBeenLastCalledWith({
      email: user.email,
      password: " current password ",
    });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(updateUser).toHaveBeenCalledWith({
      current_password: " current password ",
      password: " New-password-42! ",
    });
    updateUser.mockResolvedValueOnce({
      error: { code: "unknown", message: "provider-sensitive-detail" },
    });
    await expect(
      changeAccountPassword(
        auth,
        "old",
        "New-password-42!",
        "New-password-42!",
        verifier,
      ),
    ).rejects.toThrow("Vérifiez votre session");
  });
  it("refuse une identité de vérification différente et ferme sa session temporaire", async () => {
    const { auth, verifier, updateUser, signInWithPassword, signOut } = mocks();
    signInWithPassword.mockResolvedValueOnce({
      data: { user: { ...user, id: "other-user" } },
      error: null,
    });
    await expect(
      changeAccountPassword(
        auth,
        "old",
        "New-password-42!",
        "New-password-42!",
        verifier,
      ),
    ).rejects.toThrow("vérification du compte");
    expect(updateUser).not.toHaveBeenCalled();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("le vrai SDK vérifie par un client isolé puis modifie la session d’origine", async () => {
    const requests: { path: string; body: Record<string, unknown> }[] = [];
    const token = `e30.${btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }))}.fixture`;
    const client = () =>
      createClient("https://auth.kon-fanan.test", "public-fixture", {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: async (input, init) => {
            const req = new Request(input, init),
              url = new URL(req.url);
            const body =
              req.method === "PUT" || req.method === "POST"
                ? JSON.parse((await req.text()) || "{}")
                : {};
            requests.push({ path: url.pathname + url.search, body });
            if (url.pathname === "/auth/v1/token")
              return Response.json({
                access_token: token,
                refresh_token: "temporary-refresh",
                expires_in: 3600,
                token_type: "bearer",
                user,
              });
            if (url.pathname === "/auth/v1/logout") return Response.json({});
            return Response.json(user);
          },
        },
      });
    const original = client(),
      verification = client();
    await original.auth.setSession({
      access_token: token,
      refresh_token: "original-refresh",
    });
    await changeAccountPassword(
      original.auth,
      "Current-password-42!",
      "Next-password-42!",
      "Next-password-42!",
      verification.auth,
    );
    expect(
      requests.filter(
        (req) => req.path === "/auth/v1/user" && "password" in req.body,
      ),
    ).toMatchObject([
      {
        path: "/auth/v1/user",
        body: {
          password: "Next-password-42!",
          current_password: "Current-password-42!",
        },
      },
    ]);
    expect(
      requests.find((req) => req.path.includes("/token"))?.body,
    ).toMatchObject({ email: user.email, password: "Current-password-42!" });
    expect(
      requests.some((req) => req.path === "/auth/v1/logout?scope=local"),
    ).toBe(true);
    expect((await original.auth.getSession()).data.session?.refresh_token).toBe(
      "original-refresh",
    );
    expect((await verification.auth.getSession()).data.session).toBeNull();
  });
});
