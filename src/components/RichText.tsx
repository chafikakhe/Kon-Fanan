import { useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bold, Italic, List, Heading2 } from "lucide-react";
import { Tabs } from "./ui";
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ alt }) => <span>{alt || "Illustration"}</span>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
export function RichTextEditor({
  label,
  value,
  onChange,
  rows = 12,
  name,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  rows?: number;
  name?: string;
}) {
  const id = useId(),
    ref = useRef<HTMLTextAreaElement>(null),
    [tab, setTab] = useState("Écriture");
  function insert(before: string, after = "") {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart,
      end = el.selectionEnd,
      next =
        value.slice(0, start) +
        before +
        (value.slice(start, end) || "Texte") +
        after +
        value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + before.length,
        start + before.length + (end - start || 5),
      );
    });
  }
  return (
    <div className="rich-editor">
      <label htmlFor={id}>{label}</label>
      <Tabs options={["Écriture", "Aperçu"]} value={tab} onChange={setTab} />
      {tab === "Écriture" ? (
        <>
          <div
            className="editor-toolbar"
            role="toolbar"
            aria-label="Mise en forme"
          >
            <button
              type="button"
              className="icon-button"
              onClick={() => insert("**", "**")}
              aria-label="Mettre en gras"
            >
              <Bold size={17} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => insert("*", "*")}
              aria-label="Mettre en italique"
            >
              <Italic size={17} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => insert("\n## ")}
              aria-label="Ajouter un titre"
            >
              <Heading2 size={18} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => insert("\n- ")}
              aria-label="Ajouter une liste"
            >
              <List size={18} />
            </button>
          </div>
          <textarea
            id={id}
            ref={ref}
            rows={rows}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir="auto"
          />
        </>
      ) : (
        <div className="editor-preview">
          <Markdown>{value || "Le contenu du cours apparaîtra ici."}</Markdown>
        </div>
      )}
      <small>
        Les titres, listes, caractères gras et italiques sont pris en charge. Le
        HTML est désactivé.
      </small>
    </div>
  );
}
