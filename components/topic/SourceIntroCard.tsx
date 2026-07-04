import { Card } from "@/components/ui/Card";
import type { TopicIntro } from "@/lib/types/feed";

/**
 * Intro-kaart: de openingstekst van de meest recente bron, met doorverwijzing
 * naar het volledige artikel bij die bron.
 */
export function SourceIntroCard({ intro }: { intro: TopicIntro }) {
  return (
    <Card className="mb-6 overflow-hidden">
      <div
        className="flex items-center gap-2 border-b px-3.5 py-2"
        style={{ borderColor: "var(--bd)", background: "var(--cardhd)" }}
      >
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ajax-red)" }}>
          Volgens {intro.sourceName}
        </span>
      </div>
      {intro.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- externe nieuwsafbeeldingen, domeinen onbekend
        <img
          src={intro.imageUrl}
          alt=""
          loading="lazy"
          // Nieuws-CDN's blokkeren hotlinks met een vreemde referrer;
          // zonder referrer laden ze wel.
          referrerPolicy="no-referrer"
          className="max-h-56 w-full border-b object-cover"
          style={{ borderColor: "var(--bd)" }}
        />
      )}
      <div className="px-4 py-3.5">
        <p className="whitespace-pre-line text-[14.5px] leading-relaxed" style={{ color: "var(--fg-body)" }}>
          {intro.text}
        </p>
        {intro.url && (
          <a
            href={intro.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[13px] font-bold"
            style={{ color: "var(--ajax-red)" }}
          >
            Lees het volledige artikel bij {intro.sourceName} ›
          </a>
        )}
      </div>
    </Card>
  );
}
