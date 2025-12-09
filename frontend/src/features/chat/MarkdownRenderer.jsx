// MarkdownRenderer.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import clsx from "clsx";

// PrismJS & languages
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // optional: Prism theme; style via tailwind if you prefer
// load common languages
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";


const CopyIcon = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6L9 17l-5-5"></path>
  </svg>
);


/**
 * MarkdownRenderer
 *
 * Props:
 *   - content: string (markdown)
 *   - className?: string (optional wrapper classes)
 */
export default function MarkdownRenderer({ content, className = "" }) {
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    // highlight after first render and when content changes
    Prism.highlightAll();
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [content]);

  // small helper to copy text and show ephemeral feedback
  const useCopy = () => {
    const [copiedId, setCopiedId] = useState(null);

    const copy = async (text, id = "global") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        // clear after a short delay
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1800);
      } catch (err) {
        // Fallback: select + execCommand (older browsers)
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          setCopiedId(id);
          if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
          copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1800);
        } catch {
          console.error("Copy failed");
        } finally {
          ta.remove();
        }
      }
    };

    return { copiedId, copy };
  };

  const { copiedId, copy } = useCopy();

  // Code renderer (handles inline and block)
  function CodeRenderer({ node, inline, className, children, ...props }) {
    const language = (className || "").replace("language-", "") || "";
    const codeString = String(children).replace(/\n$/, "");

    if (inline) {
      // small inline code pill with copy icon
      const id = `inline-${Math.random().toString(36).slice(2, 9)}`;
      return (
        <code className="inline-flex items-center gap-2 bg-[#2a2a2a] px-2 py-[3px] rounded text-xs font-mono border border-gray-700">
            <span className="select-text">{codeString}</span>

            <button
            onClick={() => copy(codeString, id)}
            aria-label="Copy inline code"
            className="transition transform hover:scale-110 active:scale-95"
            type="button"
            >
            {copiedId === id ? (
                <CheckIcon className="text-green-400 animate-bounce" />
            ) : (
                <CopyIcon className="opacity-70 hover:opacity-100" />
            )}
            </button>
        </code>
        );
    }

    // Block code
    const prismLanguageClass = language ? `language-${language}` : "";
    const lines = codeString.split(/\r\n|\r|\n/);

    return (
      <div className="my-4 rounded-lg overflow-hidden bg-[#111213] border border-gray-800 shadow">
        <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-gray-300 font-mono bg-[#161617] border-b border-gray-800 select-none">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-[11px] bg-[#1f1f1f] text-gray-200 font-semibold">
              CODE
            </span>
            <span className="opacity-70 uppercase">{language || "text"}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
                onClick={() => copy(codeString, codeString.slice(0, 12))}
                className="p-1 rounded hover:bg-gray-700/40 transition transform hover:scale-110 active:scale-95"
                aria-label="Copy code block"
                type="button"
                >
                {copiedId === codeString.slice(0, 12) ? (
                    <CheckIcon className="text-green-400 animate-bounce" />
                ) : (
                    <CopyIcon className="text-gray-300 opacity-70 hover:opacity-100" />
                )}
                </button>

          </div>
        </div>

        <pre className={clsx("m-0 p-4 overflow-x-auto text-sm")}>
          <code className={clsx("language-markup", prismLanguageClass)} {...props}>
            {codeString}
          </code>
        </pre>

        {/* Line numbers column (visual only) */}
        <style jsx>{`
          /* Prism theme neutralization: keep the prism-tomorrow colors but allow tailwind control */
          pre code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono",
              "Courier New", monospace;
            line-height: 1.45;
          }
        `}</style>
      </div>
    );
  }

  // Blockquote renderer (semantic + accessible)
  function BlockquoteRenderer({ node, ...props }) {
    return (
      <blockquote
        className="relative my-4 pl-6 pr-4 py-4 border-l-4 border-accent italic text-gray-200 bg-gray-800/30 rounded"
        {...props}
      >
        <span
          aria-hidden="true"
          className="absolute -left-3 -top-2 text-3xl text-accent font-serif opacity-95"
        >
          “
        </span>
        {props.children}
      </blockquote>
    );
  }

  // Table renderers
  function TableRenderer({ node, ...props }) {
    return (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-700 shadow-sm">
        <table className="min-w-full text-left text-sm" {...props} />
      </div>
    );
  }

  function TheadRenderer({ node, ...props }) {
    return (
      <thead className="bg-[#252525] text-gray-200 uppercase font-semibold text-xs" {...props} />
    );
  }

  function TbodyRenderer({ node, ...props }) {
    return <tbody className="bg-[#111111] divide-y divide-gray-800" {...props} />;
  }

  function TrRenderer({ node, isHeader, ...props }) {
    // stripe via :nth-child is not available in inline props, but Tailwind odd: works on children
    return <tr className="odd:bg-transparent even:bg-gray-900/20" {...props} />;
  }

  function ThRenderer({ node, ...props }) {
    return (
      <th
        scope="col"
        className="px-4 py-3 text-left align-top border-b border-gray-700"
        {...props}
      />
    );
  }

  function TdRenderer({ node, ...props }) {
    return <td className="px-4 py-3 align-top text-gray-300 border-b border-gray-800" {...props} />;
  }

  // Links open external targets in new tab (but keep same tab for local anchors)
  function LinkRenderer({ href = "", children, ...props }) {
    const isExternal = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...props}
        className="text-accent hover:underline"
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  // Headings (small consistent style)
  const Heading = (Tag, sizeClasses) => ({ node, ...props }) =>
    React.createElement(
      Tag,
      { className: `${sizeClasses} mt-4 mb-2 text-white font-bold` },
      props.children
    );

  // Markup components mapping
  const components = {
    // typography
    h1: Heading("h1", "text-2xl"),
    h2: Heading("h2", "text-xl"),
    h3: Heading("h3", "text-lg"),
    p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-semibold text-accent" {...props} />,

    // blockquote
    blockquote: BlockquoteRenderer,

    // links
    a: LinkRenderer,

    // lists
    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />,
    li: ({ node, ...props }) => <li className="pl-1" {...props} />,

    // code
    code: CodeRenderer,

    // tables
    table: TableRenderer,
    thead: TheadRenderer,
    tbody: TbodyRenderer,
    tr: TrRenderer,
    th: ThRenderer,
    td: TdRenderer,

    // images (responsive)
    img: ({ node, alt, ...props }) => (
      // eslint-disable-next-line jsx-a11y/alt-text
      <img
        alt={alt || ""}
        decoding="async"
        className="max-w-full h-auto rounded-md my-3"
        {...props}
      />
    ),
  };

  return (
    <div className={clsx("markdown-body text-sm text-gray-200", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
