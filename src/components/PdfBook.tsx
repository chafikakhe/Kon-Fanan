import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize,
  Minimize,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";
import workerURL from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button, Loading, Notice } from "./ui";
GlobalWorkerOptions.workerSrc = workerURL;
const assets = `${import.meta.env.BASE_URL}pdfjs/`;
export default function PdfBook({
  title,
  loadSource,
}: {
  title: string;
  loadSource: () => Promise<string>;
}) {
  const host = useRef<HTMLDivElement>(null),
    [pdf, setPdf] = useState<PDFDocumentProxy | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [url, setURL] = useState(""),
    [page, setPage] = useState(1),
    [width, setWidth] = useState(0),
    [zoom, setZoom] = useState(1),
    [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(entries[0].contentRect.width),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded]);
  useEffect(() => {
    let alive = true,
      source = "",
      task: ReturnType<typeof getDocument> | undefined;
    setLoading(true);
    setError("");
    setPdf(null);
    setURL("");
    setPage(1);
    setZoom(1);
    void (async () => {
      source = await loadSource();
      if (!alive) {
        if (source.startsWith("blob:")) URL.revokeObjectURL(source);
        return;
      }
      setURL(source);
      task = getDocument({
        url: source,
        cMapUrl: assets + "cmaps/",
        cMapPacked: true,
        standardFontDataUrl: assets + "standard_fonts/",
        wasmUrl: assets + "wasm/",
        iccUrl: assets + "iccs/",
        enableXfa: false,
        disableRange: true,
        disableStream: true,
      });
      const doc = await task.promise;
      if (alive) setPdf(doc);
    })()
      .catch(() => {
        if (alive)
          setError(
            "Le PDF n’a pas pu être chargé. Réessaie ou ouvre le document dans un nouvel onglet.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      void task?.destroy();
      if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    };
  }, [loadSource, attempt]);
  const spread = width >= 650,
    step = spread ? 2 : 1;
  const start = spread ? Math.floor((page - 1) / 2) * 2 + 1 : page;
  const last = Math.min(start + step - 1, pdf?.numPages || 1);
  useEffect(() => {
    if (!expanded) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    host.current?.querySelector<HTMLButtonElement>("[data-expand]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        host.current
          ?.querySelector<HTMLButtonElement>("[data-expand]")
          ?.focus();
      }
      if (e.key === "Tab") {
        const items = Array.from(
          host.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],select,[tabindex="0"]',
          ) || [],
        );
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prior;
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);
  const content = (
    <div
      ref={host}
      className={`pdf-book ${expanded ? "is-expanded" : ""}`}
      aria-label={`Livre : ${title}`}
      role={expanded ? "dialog" : "region"}
      aria-modal={expanded ? true : undefined}
      onKeyDown={(e) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLSelectElement
        )
          return;
        if (e.key === "ArrowRight" && pdf) {
          e.preventDefault();
          setPage(Math.min(pdf.numPages, start + step));
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setPage(Math.max(1, start - step));
        }
      }}
    >
      <div className="book-heading">
        <strong>{title}</strong>
        <div className="book-tools">
          <button
            type="button"
            className="icon-button"
            aria-label="Réduire le zoom"
            disabled={zoom <= 1 || !pdf}
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          >
            <ZoomOut size={18} />
          </button>
          <span className="book-zoom">{Math.round(zoom * 100)} %</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Agrandir le zoom"
            disabled={zoom >= 2 || !pdf}
            onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            data-expand
            className="icon-button"
            aria-label={expanded ? "Réduire le livre" : "Agrandir le livre"}
            aria-pressed={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice tone="error">
          {error}
          <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
            <RotateCw size={16} />
            Recharger le PDF
          </Button>
        </Notice>
      ) : pdf ? (
        <>
          <div
            className="book-scroll"
            role="group"
            tabIndex={0}
            aria-label="Pages du livre, flèches gauche et droite pour naviguer"
          >
            <div
              className={`book-spread ${spread ? "two-pages" : "one-page"}`}
              style={{ width: Math.max(1, width - 32) * zoom }}
              key={`${start}:${step}`}
            >
              {Array.from({ length: last - start + 1 }, (_, i) => (
                <PdfPage
                  key={start + i}
                  pdf={pdf}
                  number={start + i}
                  width={
                    Math.max(100, (width - 32 - (spread ? 14 : 0)) / step) *
                    zoom
                  }
                />
              ))}
            </div>
          </div>
          <nav className="book-navigation" aria-label="Navigation dans le PDF">
            <Button
              aria-label="Précédent"
              variant="secondary"
              disabled={start <= 1}
              onClick={() => setPage(Math.max(1, start - step))}
            >
              <ChevronLeft size={18} />
              <span>Précédent</span>
            </Button>
            <label className="book-page-input">
              <span>Page</span>
              <select
                aria-label="Aller à la page"
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
              >
                {Array.from({ length: pdf.numPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <span aria-live="polite">
                / {pdf.numPages}
                {spread && last > start ? ` · ${start}–${last}` : ""}
              </span>
            </label>
            <Button
              aria-label="Suivant"
              variant="secondary"
              disabled={last >= pdf.numPages}
              onClick={() => setPage(Math.min(pdf.numPages, start + step))}
            >
              <span>Suivant</span>
              <ChevronRight size={18} />
            </Button>
          </nav>
        </>
      ) : null}
      <div className="book-footer">
        <span>
          {spread
            ? "Deux pages, comme un livre ouvert."
            : "Une page à la fois, à ton rythme."}
        </span>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            Ouvrir le PDF <ExternalLink size={14} />
          </a>
        )}
        {!loading && (
          <button
            type="button"
            className="text-link"
            onClick={() => setAttempt((n) => n + 1)}
            aria-label="Actualiser l’accès au PDF"
          >
            <RotateCw size={15} />
          </button>
        )}
      </div>
    </div>
  );
  return expanded ? createPortal(content, document.body) : content;
}
function PdfPage({
  pdf,
  number,
  width,
}: {
  pdf: PDFDocumentProxy;
  number: number;
  width: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    let alive = true,
      render: RenderTask | undefined;
    setReady(false);
    setError(false);
    void (async () => {
      const page = await pdf.getPage(number);
      if (!alive || !canvas.current) return;
      const viewport = page.getViewport({ scale: 1 }),
        ratio = Math.min(window.devicePixelRatio || 1, 2),
        scale = Math.min(2400, width * ratio) / viewport.width,
        view = page.getViewport({ scale });
      canvas.current.width = Math.floor(view.width);
      canvas.current.height = Math.floor(view.height);
      render = page.render({ canvas: canvas.current, viewport: view });
      await render.promise;
      if (alive) setReady(true);
    })().catch((e) => {
      if (alive && e.name !== "RenderingCancelledException") setError(true);
    });
    return () => {
      alive = false;
      render?.cancel();
    };
  }, [pdf, number, width]);
  return (
    <div className="book-paper" style={{ width }}>
      {!ready && !error && (
        <span className="book-page-loading">
          Chargement de la page {number}…
        </span>
      )}
      {error ? (
        <p>
          Cette page n’a pas pu être affichée. Ouvre le PDF pour la consulter.
        </p>
      ) : (
        <canvas
          ref={canvas}
          role="img"
          aria-label={`Page ${number} du PDF`}
          data-rendered={ready ? "true" : "false"}
        />
      )}
      <span className="book-page-number" aria-hidden="true">
        {number}
      </span>
    </div>
  );
}
