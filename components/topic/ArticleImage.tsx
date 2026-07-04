"use client";

import { useState } from "react";

/**
 * Artikelafbeelding met fallback-keten: laadt een kandidaat niet (dode link,
 * 404, hotlink-blokkade), dan schakelt hij door naar de volgende — de
 * afbeelding van een andere bron van hetzelfde topic. Pas als álle kandidaten
 * falen verdwijnt de afbeelding, zodat er geen leeg kader achterblijft.
 */
export function ArticleImage({
  srcs,
  className,
  style,
}: {
  srcs: string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const [index, setIndex] = useState(0);
  if (index >= srcs.length) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- externe nieuwsafbeeldingen, domeinen onbekend
    <img
      src={srcs[index]}
      alt=""
      loading="lazy"
      // Nieuws-CDN's blokkeren hotlinks met een vreemde referrer; zonder
      // referrer laden ze wel.
      referrerPolicy="no-referrer"
      className={className}
      style={style}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
