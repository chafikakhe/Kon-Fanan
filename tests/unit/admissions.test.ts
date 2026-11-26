import { describe, it, expect } from "vitest";
import { admissionInbox, admissionDestination } from "../../src/lib/admissions";
import { emptyData } from "../../src/lib/types";
import type { PackOrder } from "../../src/lib/packs";

function fixture() {
  const data = emptyData();
  data.account_access = [
    { user_id: "smail", role: "student", status: "pending" },
  ];
  data.pack_orders = [
    {
      id: "order",
      student_id: "smail",
      pack_name: "Pack 1",
      total_price: 100,
      level_id: "level",
      subject_ids: ["english"],
      status: "pending_review",
      created_at: "2026-11-26T19:29:44Z",
    } as PackOrder,
  ];
  return data;
}
describe("Admissions et inscriptions via les packs", () => {
  it("affiche le vrai pack sans fabriquer de demande de classe ni activer le compte", () => {
    const data = fixture();
    expect(data.admission_requests).toHaveLength(0);
    expect(admissionInbox(data)).toEqual([
      expect.objectContaining({
        id: "order",
        student_id: "smail",
        kind: "pack",
        status: "pending",
        href: "/admin/packs?order=order",
      }),
    ]);
    expect(data.account_access[0].status).toBe("pending");
    expect(data.admission_requests).toHaveLength(0);
  });
  it("ne compte pas deux fois une ancienne demande de classe remplacée par un pack", () => {
    const data = fixture();
    data.admission_requests = [
      {
        id: "class-request",
        student_id: "smail",
        requested_class_id: "class",
        status: "pending",
        created_at: "2026-11-25T00:00:00Z",
      } as any,
    ];
    expect(admissionInbox(data)).toHaveLength(1);
    data.pack_orders[0].status = "active";
    const rows = admissionInbox(data);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("accepted");
  });
  it("conserve une nouvelle demande de classe postérieure au pack", () => {
    const data = fixture();
    data.admission_requests = [
      {
        id: "new-class",
        student_id: "smail",
        requested_class_id: "class",
        status: "pending",
        created_at: "2026-11-27T00:00:00Z",
      } as any,
    ];
    expect(admissionInbox(data)).toHaveLength(2);
  });
  it("garde visibles les comptes en attente sans choix et exclut les professeurs", () => {
    const data = fixture();
    data.pack_orders = [];
    data.account_access.push({
      user_id: "teacher",
      role: "teacher",
      status: "pending",
    });
    expect(admissionInbox(data)).toEqual([
      expect.objectContaining({
        kind: "registration",
        student_id: "smail",
        href: "/admin/etudiants/smail",
      }),
    ]);
  });
  it("range les demandes refusées dans leur historique sans nouvelle inscription artificielle", () => {
    const data = fixture();
    data.pack_orders[0].status = "rejected";
    const rows = admissionInbox(data);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("rejected");
  });
  it("affiche le niveau du pack et conserve la vraie classe pour les anciennes admissions", () => {
    const data = fixture();
    data.levels = [{ id: "level", label: "3ème année lycée" } as any];
    data.classes = [
      { id: "class", name: "Classe A", level_id: "level" } as any,
    ];
    data.admission_requests = [
      {
        id: "class-request",
        student_id: "other",
        requested_class_id: "class",
        status: "pending",
        created_at: "2026-11-25T00:00:00Z",
      } as any,
    ];
    const rows = admissionInbox(data);
    expect(
      admissionDestination(
        data,
        rows.find((r) => r.kind === "pack")!,
      ),
    ).toBe("3ème année lycée");
    expect(
      admissionDestination(
        data,
        rows.find((r) => r.kind === "class")!,
      ),
    ).toBe("Classe A");
  });
});
