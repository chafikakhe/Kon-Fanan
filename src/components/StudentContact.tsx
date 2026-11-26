import { useEffect, useState } from "react";
import { useApp } from "../app/AppProvider";
import { AsyncForm, Button, Field, Modal, Notice, Panel } from "./ui";
import { PasswordField } from "./PasswordField";
import { generatePassword } from "../lib/passwords";
import { normalizeWhatsApp, whatsappURL } from "../lib/whatsapp";

export function StudentContact({ studentId }: { studentId: string }) {
  const { data, invoke, mutate, demo } = useApp();
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  useEffect(() => {
    setCredentials(null);
    setCopied(false);
    setCopyError("");
  }, [studentId]);
  const contact = data.student_contacts.find((c) => c.student_id === studentId);
  const profile = data.profiles.find((p) => p.id === studentId);
  const active = data.account_access.some(
    (a) =>
      a.user_id === studentId && a.role === "student" && a.status === "active",
  );
  const login = `${window.location.origin}/connexion`;
  const message = `Bonjour ${profile?.display_name || ""}, ton compte motafawiq.ma a été validé. Connecte-toi avec ton email et ton mot de passe : ${login}`;
  return (
    <Panel title="Contact WhatsApp et identifiants">
      {contact ? (
        <div className="stack">
          <Field label="Numéro WhatsApp de l’étudiant">
            <input type="tel" readOnly value={contact.whatsapp_number} />
          </Field>
          {active ? (
            <>
              <a
                className="button secondary"
                href={whatsappURL(contact.whatsapp_number, message)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Préparer le message de validation WhatsApp
              </a>
              <p>
                Le message s’ouvre dans WhatsApp ; vérifiez-le et envoyez-le
                vous-même.
              </p>
              <AsyncForm
                onSubmit={async () => {
                  if (demo)
                    throw Error(
                      "La modification de mots de passe nécessite Supabase. Aucun mot de passe réel n’est modifié en démonstration.",
                    );
                  if (!profile?.email)
                    throw Error(
                      "L’adresse email de cet étudiant n’est pas disponible. Actualisez le dossier.",
                    );
                  const password = generatePassword();
                  await invoke("student-password-reset", {
                    studentId,
                    password,
                  });
                  setCopied(false);
                  setCopyError("");
                  setCredentials({ email: profile.email, password });
                }}
              >
                <p className="muted">
                  Si l’étudiant a oublié son mot de passe, générez-en un
                  nouveau. Cette action remplace son mot de passe actuel.
                </p>
                <Button type="submit" variant="secondary">
                  Générer un nouveau mot de passe
                </Button>
              </AsyncForm>
            </>
          ) : (
            <Notice>
              Le message de validation et la création d’un nouveau mot de passe
              seront disponibles après l’activation du compte.
            </Notice>
          )}
        </div>
      ) : (
        <AsyncForm
          onSubmit={async (form) => {
            await mutate("save_student_contact", {
              p_student_id: studentId,
              p_whatsapp_number: normalizeWhatsApp(
                String(new FormData(form).get("whatsapp") || ""),
              ),
            });
          }}
        >
          <Notice>Ce compte ne comporte pas encore de numéro WhatsApp.</Notice>
          <Field label="Numéro WhatsApp de l’étudiant">
            <input
              name="whatsapp"
              type="tel"
              required
              maxLength={25}
              placeholder="+212 6 12 34 56 78"
            />
          </Field>
          <Button type="submit">Enregistrer le numéro WhatsApp</Button>
        </AsyncForm>
      )}
      {credentials && contact && (
        <Modal
          title="Nouveaux identifiants de l’étudiant"
          onClose={() => setCredentials(null)}
        >
          <div className="stack">
            <Notice tone="success">
              Le nouveau mot de passe est enregistré. Il ne sera plus affiché
              après fermeture de cette fenêtre.
            </Notice>
            <Field label="Email de connexion">
              <input readOnly value={credentials.email} />
            </Field>
            <PasswordField
              label="Nouveau mot de passe étudiant"
              name="student-new-password"
              value={credentials.password}
              readOnly
            />
            <p>
              Copiez les identifiants, puis collez-les dans la conversation
              WhatsApp de cet étudiant. Il pourra ensuite changer son mot de
              passe depuis Mon profil → Sécurité.
            </p>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `Ton compte motafawiq.ma est activé.\nConnexion : ${login}\nEmail : ${credentials.email}\nNouveau mot de passe : ${credentials.password}\nTu peux le modifier depuis Mon profil → Sécurité.`,
                  );
                  setCopied(true);
                  setCopyError("");
                } catch {
                  setCopyError(
                    "La copie est indisponible. Affichez puis copiez les identifiants manuellement.",
                  );
                }
              }}
            >
              Copier les identifiants
            </Button>
            {copied && <Notice tone="success">Identifiants copiés.</Notice>}
            {copyError && <Notice tone="error">{copyError}</Notice>}
            {/* Never include the password in a URL, browser history or referrer. */}
            <a
              className="button primary"
              href={whatsappURL(contact.whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir la conversation WhatsApp
            </a>
            <Button onClick={() => setCredentials(null)}>
              Fermer et masquer les identifiants
            </Button>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
