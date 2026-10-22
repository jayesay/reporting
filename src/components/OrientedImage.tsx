"use client";

import { applyOrientedImageClass } from "@/lib/image-orientation";

export function OrientedImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      onLoad={(event) => applyOrientedImageClass(event.currentTarget)}
      ref={(node) => {
        if (node?.complete) applyOrientedImageClass(node);
      }}
    />
  );
}
