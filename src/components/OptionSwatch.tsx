"use client";

import { useState } from "react";

const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

export default function OptionSwatch({ photoKey, swatch }: { photoKey: string; swatch: string }) {
  const [extIndex, setExtIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  if (exhausted) {
    return <div className="h-20 w-full mb-3" style={{ background: swatch, borderRadius: 3 }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- filename/extension isn't known until runtime, so next/image's static analysis doesn't apply
    <img
      src={`/selections-photos/${photoKey}.${EXTENSIONS[extIndex]}`}
      alt=""
      className="h-20 w-full mb-3 object-cover"
      style={{ borderRadius: 3 }}
      onError={() => {
        if (extIndex < EXTENSIONS.length - 1) setExtIndex((i) => i + 1);
        else setExhausted(true);
      }}
    />
  );
}
