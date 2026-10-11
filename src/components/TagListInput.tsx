"use client";

import { useRef, useState } from "react";

type TagListInputProps = {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
};

function parseNames(raw: string) {
  return raw
    .split(/[,，、/\n]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function TagListInput({
  label,
  hint,
  values,
  onChange,
}: TagListInputProps) {
  const [draft, setDraft] = useState("");
  const composingRef = useRef(false);

  function addNames(raw: string) {
    const nextNames = parseNames(raw);
    if (nextNames.length === 0) {
      setDraft("");
      return;
    }

    const merged = [...values];
    for (const name of nextNames) {
      if (!merged.includes(name)) {
        merged.push(name);
      }
    }
    onChange(merged);
    setDraft("");
  }

  return (
    <div className="field tag-field">
      <label>{label}</label>
      {hint ? <p className="hint">{hint}</p> : null}
      <div className="tag-input-box">
        {values.map((name) => (
          <button
            key={name}
            type="button"
            className="tag"
            onClick={() => onChange(values.filter((item) => item !== name))}
            aria-label={`${name} 제거`}
          >
            {name}
            <span aria-hidden>×</span>
          </button>
        ))}
        <input
          type="text"
          className="tag-draft-input"
          value={draft}
          placeholder={
            values.length === 0
              ? "예: 김민수, 이서연, 박준호"
              : "이름 추가"
          }
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(event) => {
            composingRef.current = false;
            const value = event.currentTarget.value;
            if (/[,，、/\n]/.test(value)) {
              addNames(value);
            } else {
              setDraft(value);
            }
          }}
          onChange={(event) => {
            const value = event.target.value;
            // 한글 조합 중에는 그대로 두고, 쉼표가 들어온 뒤에만 분리
            const nativeEvent = event.nativeEvent as InputEvent;
            if (composingRef.current || nativeEvent.isComposing) {
              setDraft(value);
              return;
            }
            if (/[,，、/\n]/.test(value)) {
              addNames(value);
              return;
            }
            setDraft(value);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) {
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              if (draft.trim()) {
                addNames(draft);
              }
              return;
            }

            if (event.key === "Backspace" && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (composingRef.current) return;
            if (draft.trim()) {
              addNames(draft);
            }
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (/[,，、/\n]/.test(text)) {
              event.preventDefault();
              addNames(`${draft}${text}`);
            }
          }}
        />
      </div>
    </div>
  );
}
