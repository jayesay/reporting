export type LocalPhoto = {
  id: string;
  name: string;
  dataUrl: string;
};

export type PhotosByJournal = Record<string, LocalPhoto[]>;

export function photoStorageKey(slug: string) {
  return `innosight-view-photos:${slug}`;
}

export function readPhotoStore(
  raw: string,
  fallbackJournalId?: string,
): PhotosByJournal {
  const parsed = JSON.parse(raw) as unknown;
  if (Array.isArray(parsed)) {
    if (!fallbackJournalId || parsed.length === 0) return {};
    return { [fallbackJournalId]: parsed as LocalPhoto[] };
  }
  if (parsed && typeof parsed === "object") {
    const next: PhotosByJournal = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (Array.isArray(value)) next[key] = value as LocalPhoto[];
    }
    return next;
  }
  return {};
}

export function loadPhotosByJournal(
  slug: string,
  fallbackJournalId?: string,
): PhotosByJournal {
  try {
    const raw = window.localStorage.getItem(photoStorageKey(slug));
    if (!raw) return {};
    return readPhotoStore(raw, fallbackJournalId);
  } catch {
    return {};
  }
}

export function savePhotosByJournal(slug: string, photos: PhotosByJournal) {
  window.localStorage.setItem(photoStorageKey(slug), JSON.stringify(photos));
}

export function clearPhotosByJournal(slug: string) {
  window.localStorage.removeItem(photoStorageKey(slug));
}
