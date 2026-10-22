"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { isPortraitSize } from "@/lib/image-orientation";

function readPortrait(image: HTMLImageElement) {
  const width = image.clientWidth || image.naturalWidth;
  const height = image.clientHeight || image.naturalHeight;
  if (!width || !height) return null;
  return isPortraitSize(width, height);
}

export function OrientedImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [portrait, setPortrait] = useState(false);

  function apply(image: HTMLImageElement | null) {
    if (!image) return;
    const next = readPortrait(image);
    if (next == null) return;
    setPortrait((prev) => (prev === next ? prev : next));
  }

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (image?.complete) apply(image);
  }, [src]);

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      className={portrait ? "is-portrait" : undefined}
      onLoad={(event) => {
        const image = event.currentTarget;
        apply(image);
        requestAnimationFrame(() => apply(image));
      }}
    />
  );
}
