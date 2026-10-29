import { Link } from "react-router-dom";
import Seo from "./Seo.jsx";
import { LEGAL_LAST_UPDATED } from "../constants/businessInfo.js";

// Shared building blocks for the legal pages so Privacy and Terms stay consistent.
export const LegalSection = ({ id, title, children }) => (
  <section id={id} className="mt-10 scroll-mt-28" aria-labelledby={id ? `${id}-heading` : undefined}>
    <h2 id={id ? `${id}-heading` : undefined} className="font-display text-2xl text-ink-900">
      {title}
    </h2>
    <div className="mt-3 space-y-3 text-sm leading-7 text-ink-900/70">{children}</div>
  </section>
);

export const LegalList = ({ items }) => (
  <ul className="list-disc space-y-1.5 pl-5 marker:text-brass-500">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

export const LegalLink = ({ to, children }) => (
  <Link to={to} className="text-forest-700 underline underline-offset-2 hover:text-forest-900">
    {children}
  </Link>
);

export const LegalMailLink = ({ email }) => (
  <a href={`mailto:${email}`} className="break-words text-forest-700 underline underline-offset-2 hover:text-forest-900">
    {email}
  </a>
);

export default function LegalLayout({ eyebrow, title, intro, seo, toc = [], children }) {
  return (
    <div className="pt-32 pb-24 container-px">
      <Seo {...seo} />
      <article className="mx-auto max-w-3xl">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink-900 md:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-ink-900/50">Last updated: {LEGAL_LAST_UPDATED}</p>
        {intro && <p className="mt-6 text-sm leading-7 text-ink-900/70">{intro}</p>}

        {toc.length > 0 && (
          <nav aria-label={`${title} sections`} className="card-surface mt-8 p-5">
            <p className="text-xs uppercase tracking-widest text-ink-900/50">On this page</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {toc.map(({ id, label }) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-forest-700 hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {children}
      </article>
    </div>
  );
}
