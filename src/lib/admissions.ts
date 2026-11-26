import type { Data } from "./types";

export interface AdmissionInboxItem {
  id: string;
  student_id: string;
  kind: "class" | "pack" | "registration";
  status: "pending" | "accepted" | "rejected";
  source_status: string;
  created_at: string;
  level_id?: string;
  requested_class_id?: string;
  label: string;
  href: string;
}

// The signup funnel creates a pack order, not a class admission. Keep both
// sources in one inbox without creating a second request or granting access.
export function admissionInbox(data: Data): AdmissionInboxItem[] {
  const rows: AdmissionInboxItem[] = data.admission_requests
    .filter(
      (a) =>
        a.status !== "withdrawn" &&
        !(
          a.status === "pending" &&
          data.pack_orders.some(
            (order) =>
              order.student_id === a.student_id &&
              ["pending_review", "active"].includes(order.status) &&
              order.created_at >= a.created_at,
          )
        ),
    )
    .map((a) => ({
      id: a.id,
      student_id: a.student_id,
      kind: "class",
      status: a.status as AdmissionInboxItem["status"],
      source_status: a.status,
      created_at: a.created_at,
      level_id: data.classes.find((c) => c.id === a.requested_class_id)
        ?.level_id,
      requested_class_id: a.requested_class_id,
      label: "Admission à une classe",
      href: `/admin/admissions/${a.id}`,
    }));
  for (const order of data.pack_orders) {
    rows.push({
      id: order.id,
      student_id: order.student_id,
      kind: "pack",
      status:
        order.status === "pending_review"
          ? "pending"
          : order.status === "active"
            ? "accepted"
            : "rejected",
      source_status: order.status,
      created_at: order.created_at,
      level_id: order.level_id,
      label: `${order.pack_name} · ${Number(order.total_price)} DH`,
      href: `/admin/packs?order=${order.id}`,
    });
  }
  const knownStudents = new Set(rows.map((row) => row.student_id));
  for (const account of data.account_access) {
    if (
      account.role !== "student" ||
      account.status !== "pending" ||
      knownStudents.has(account.user_id)
    )
      continue;
    rows.push({
      id: `registration-${account.user_id}`,
      student_id: account.user_id,
      kind: "registration",
      status: "pending",
      source_status: "pending",
      created_at:
        data.student_contacts.find((c) => c.student_id === account.user_id)
          ?.created_at || "",
      label: "Inscription à compléter",
      href: `/admin/etudiants/${account.user_id}`,
    });
  }
  return rows.sort(
    (a, b) =>
      b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id),
  );
}

export function admissionDestination(
  data: Data,
  item: AdmissionInboxItem,
): string {
  if (item.requested_class_id)
    return (
      data.classes.find((c) => c.id === item.requested_class_id)?.name ||
      "Classe à préciser"
    );
  return (
    data.levels.find((l) => l.id === item.level_id)?.label ||
    "Choix à compléter"
  );
}
