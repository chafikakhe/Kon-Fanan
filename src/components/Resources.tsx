import { useEffect, useState } from "react";
import { ArrowUpRight, FileText, Plus, Trash2 } from "lucide-react";
import { useApp } from "../app/AppProvider";
import { supabase } from "../lib/supabase";
import type { FileRow } from "../lib/types";
import { Button, Empty, Notice } from "./ui";
export function Resources({
  kind,
  id,
  editable = false,
}: {
  kind: "course" | "exercise" | "competition" | "announcement";
  id: string;
  editable?: boolean;
}) {
  const { data, demo, upload, fileURL, invoke, mutate } = useApp();
  const [files, setFiles] = useState<FileRow[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [link, setLink] = useState("");
  async function load() {
    if (demo) {
      setFiles(
        data.files.filter(
          (f) =>
            f.target_type === kind &&
            f.target_id === id &&
            f.status === "ready",
        ),
      );
      return;
    }
    const r = await supabase!
      .from(`${kind}_resources`)
      .select("file:files(*)")
      .eq(`${kind}_id`, id)
      .order("position");
    if (r.error) {
      setError("Impossible de charger les documents.");
      return;
    }
    setFiles(r.data.map((r) => r.file as unknown as FileRow).filter(Boolean));
  }
  useEffect(() => {
    void load();
  }, [id, data.files]);
  return (
    <div className="resources">
      <h3>
        Documents{" "}
        {kind === "course"
          ? "du cours"
          : kind === "exercise"
            ? "de l’exercice"
            : kind === "competition"
              ? "du défi"
              : "de l’annonce"}
      </h3>
      {files.map((f) => (
        <div className="resource-row" key={f.id}>
          <button
            className="document-link"
            onClick={async () => {
              setError("");
              try {
                const url = await fileURL(f.id);
                const opened = window.open(
                  url,
                  "_blank",
                  "noopener,noreferrer",
                );
                if (!opened) setLink(url);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <FileText size={20} />
            <span>
              {f.original_name}
              <small>{(f.size_bytes / 1024 / 1024).toFixed(1)} Mo</small>
            </span>
            <ArrowUpRight size={16} />
          </button>
          {editable && (
            <button
              className="icon-button"
              aria-label={`Retirer ${f.original_name}`}
              disabled={busy}
              onClick={async () => {
                try {
                  setBusy(true);
                  if (demo)
                    await mutate("delete_draft_file", { p_file_id: f.id });
                  else await invoke("files-delete", { fileId: f.id });
                  setFiles((prev) => prev.filter((x) => x.id !== f.id));
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      ))}
      {!files.length && (
        <p className="muted small-text">Aucun document supplémentaire.</p>
      )}
      {editable && (
        <label className={`button secondary ${busy ? "disabled" : ""}`}>
          <Plus size={17} />
          {busy ? "Validation en cours…" : "Ajouter un PDF ou une image"}
          <input
            type="file"
            disabled={busy}
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Ajouter une pièce jointe"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setError("");
              try {
                if (
                  ![
                    "application/pdf",
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                  ].includes(f.type)
                )
                  throw Error("Format non accepté.");
                if (f.size > (kind === "announcement" ? 10 : 20) * 1024 * 1024)
                  throw Error("Le fichier dépasse la taille autorisée.");
                await upload(f, kind, id, () => {});
                await load();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      )}
      {link && (
        <a
          className="text-link"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir le document <ArrowUpRight size={16} />
        </a>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
