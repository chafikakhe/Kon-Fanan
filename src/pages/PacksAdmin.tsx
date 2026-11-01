import { useState } from "react";
import { useApp } from "../app/AppProvider";
import {
  AsyncForm,
  Badge,
  Button,
  Empty,
  Field,
  Notice,
  PageHeader,
  Panel,
  Tabs,
} from "../components/ui";
import { date } from "../lib/utils";
export default function PacksAdmin() {
  const { data, mutate, demo, hasMore, loadMore } = useApp(),
    [tab, setTab] = useState("À vérifier"),
    [error, setError] = useState("");
  const orders = data.pack_orders
    .filter((o) =>
      tab === "À vérifier"
        ? o.status === "pending_review"
        : o.status !== "pending_review",
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <>
      <PageHeader
        title="Packs et achats"
        eyebrow="VALIDATION ADMINISTRATIVE"
        description="Vérifiez le règlement hors application avant toute activation. Les prix affichés sont les prix totaux des packs."
      />
      <Notice>
        Le paiement en ligne n’est pas connecté. L’envoi d’une demande ne
        confirme aucun règlement. L’activation exige votre validation et une
        référence de règlement vérifiable.
      </Notice>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="pack-grid">
        {data.pack_offers.map((p) => (
          <Panel key={p.id}>
            <h2>{p.name}</h2>
            <p>
              {p.subject_count} matière{p.subject_count > 1 ? "s" : ""} ·{" "}
              {Number(p.total_price)} DH au total
            </p>
            <Badge status={p.is_active ? "active" : "archived"} />
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await mutate("set_pack_availability", {
                    p_pack_id: p.id,
                    p_active: !p.is_active,
                  });
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              {p.is_active
                ? "Suspendre les nouvelles demandes"
                : "Ouvrir les demandes"}
            </Button>
          </Panel>
        ))}
      </div>
      <Tabs
        options={["À vérifier", "Historique"]}
        value={tab}
        onChange={setTab}
      />
      <div className="stack">
        {orders.map((o) => (
          <Panel
            key={o.id}
            title={
              <>
                {data.profiles.find((p) => p.id === o.student_id)
                  ?.display_name || o.student_id}{" "}
                <Badge status={o.status} />
              </>
            }
          >
            <p>
              {o.pack_name} · {Number(o.total_price)} DH au total ·{" "}
              {data.levels.find((l) => l.id === o.level_id)?.label}
            </p>
            <p>
              {o.subject_ids
                .map(
                  (id) => data.subjects.find((s) => s.id === id)?.label || id,
                )
                .join(" · ")}
            </p>
            <p className="small-text">
              Demande {o.id} · {date(o.created_at, true)}
            </p>
            {o.status === "pending_review" ? (
              <AsyncForm
                onSubmit={async (f) => {
                  const fd = new FormData(f);
                  await mutate("review_pack_order", {
                    p_order_id: o.id,
                    p_decision: "active",
                    p_payment_reference: fd.get("reference"),
                  });
                }}
              >
                <Field label="Référence du règlement vérifié">
                  <input
                    name="reference"
                    required
                    minLength={3}
                    maxLength={200}
                    placeholder="Référence bancaire ou reçu vérifié"
                  />
                </Field>
                <label className="checkbox-row">
                  <input type="checkbox" required />
                  <span>
                    J’ai vérifié le règlement de {Number(o.total_price)} DH pour
                    cette demande et ces matières.
                  </span>
                </label>
                <div className="actions">
                  <Button type="submit" disabled={demo}>
                    Valider le règlement et activer
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={demo}
                    onClick={async () => {
                      try {
                        await mutate("review_pack_order", {
                          p_order_id: o.id,
                          p_decision: "rejected",
                        });
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Refuser la demande
                  </Button>
                </div>
                {demo && (
                  <p>
                    Validation indisponible en démonstration. Aucun achat réussi
                    n’est simulé.
                  </p>
                )}
              </AsyncForm>
            ) : (
              <>
                <p>
                  Référence : {o.payment_reference || "—"} · Décision du{" "}
                  {date(o.reviewed_at, true)}
                </p>
                {o.status === "active" && (
                  <Button
                    variant="danger"
                    disabled={demo}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Révoquer les droits de ce pack ? Les accès attribués séparément resteront valables.",
                        )
                      )
                        return;
                      try {
                        await mutate("review_pack_order", {
                          p_order_id: o.id,
                          p_decision: "revoked",
                        });
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Révoquer ce pack
                  </Button>
                )}
              </>
            )}
          </Panel>
        ))}
      </div>
      {!orders.length && <Empty title="Aucune demande dans cette liste" />}
      {hasMore.pack_orders && (
        <Button onClick={() => void loadMore("pack_orders")}>
          Charger d’autres demandes
        </Button>
      )}
    </>
  );
}
