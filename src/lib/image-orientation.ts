const ORIENTATION_FRAME_SELECTOR =
  ".photo-item, .deliverable-thumb, .deliverable-grid li";

export function isPortraitSize(width: number, height: number) {
  return height > width;
}

export function applyOrientedImageClass(image: HTMLImageElement | null) {
  if (!image) return;
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) return;

  const portrait = isPortraitSize(width, height);
  image.classList.toggle("is-portrait", portrait);
  image.closest(ORIENTATION_FRAME_SELECTOR)?.classList.toggle(
    "is-portrait",
    portrait,
  );
}

function readU16(bytes: Uint8Array, offset: number, littleEndian = false) {
  if (offset + 1 >= bytes.length) return 0;
  const first = bytes[offset];
  const second = bytes[offset + 1];
  return littleEndian ? first | (second << 8) : (first << 8) | second;
}

function readU32(bytes: Uint8Array, offset: number) {
  if (offset + 3 >= bytes.length) return 0;
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

function pngSize(bytes: Uint8Array) {
  if (
    bytes.length < 24 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null;
  }
  return { width: readU32(bytes, 16), height: readU32(bytes, 20) };
}

function jpegSize(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: readU16(bytes, offset + 5),
        width: readU16(bytes, offset + 7),
      };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = readU16(bytes, offset + 2);
    if (length < 2) break;
    offset += 2 + length;
  }
  return null;
}

function gifSize(bytes: Uint8Array) {
  if (bytes.length < 10) return null;
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  return {
    width: readU16(bytes, 6, true),
    height: readU16(bytes, 8, true),
  };
}

function readImageSize(bytes: Uint8Array) {
  return pngSize(bytes) ?? jpegSize(bytes) ?? gifSize(bytes);
}

function bytesFromDataUrlPrefix(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const payload = dataUrl.slice(comma + 1, comma + 1 + 87384);
  try {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function displayWidthForDataUrl(dataUrl: string) {
  const bytes = bytesFromDataUrlPrefix(dataUrl);
  if (!bytes) return "100%";
  const size = readImageSize(bytes);
  if (!size || !size.width || !size.height) return "100%";
  return isPortraitSize(size.width, size.height) ? "50%" : "100%";
}
