"use client";

import { useState } from "react";

/**
 * Artikelafbeelding die zichzelf verwijdert als hij niet laadt (dode link,
 * 404, hotlink-blokkade) — zo blijft er geen leeg kader achter op de plek
 * van de afbeelding.
 */
export function ArticleImage({
  src,
  className,
  style,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- externe nieuwsafbeeldingen, domeinen onbekend
    <img
      src={src}
      alt=""
      loading="lazy"
      // Nieuws-CDN's blokkeren hotlinks met een vreemde referrer; zonder
      // referrer laden ze wel.
      referrerPolicy="no-referrer"
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
