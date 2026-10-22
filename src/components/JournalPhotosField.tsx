"use client";

import { useRef, useState } from "react";
import { OrientedImage } from "@/components/OrientedImage";
import { compressImageForLocalStorage } from "@/lib/compress-image";
import type { LocalPhoto } from "@/lib/view-photos";

export function JournalPhotosField({
  photos,
  onChange,
}: {
  photos: LocalPhoto[];
  onChange: (next: LocalPhoto[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError(null);

    try {
      const next: LocalPhoto[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await compressImageForLocalStorage(file);
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          dataUrl,
        });
      }
      if (next.length === 0) {
        setPhotoError("이미지 파일만 추가할 수 있습니다.");
        return;
      }
      onChange([...photos, ...next]);
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "사진 추가에 실패했습니다.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="field">
      <label>사진</label>
      <input
        ref={fileRef}
        className="deliverable-file"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          void addPhotos(event.target.files);
        }}
      />
      {photos.length > 0 ? (
        <ul className="deliverable-thumbs">
          {photos.map((photo) => (
            <li key={photo.id} className="deliverable-thumb">
              <OrientedImage src={photo.dataUrl} alt={photo.name || "사진"} />
              <button
                type="button"
                className="deliverable-thumb-remove"
                onClick={() =>
                  onChange(photos.filter((row) => row.id !== photo.id))
                }
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        className="btn ghost compact"
        onClick={() => fileRef.current?.click()}
      >
        사진 추가
      </button>
      <p className="hint">
        이 브라우저에만 저장됩니다. 보고서 저장 내용에는 들어가지 않고, 팀원
        화면에는 보이지 않습니다.
      </p>
      {photoError ? <p className="error-text">{photoError}</p> : null}
    </div>
  );
}
