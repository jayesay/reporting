"use client";

import { useState } from "react";

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

  function addNames(raw: string) {
    const nextNames = parseNames(raw);
    if (nextNames.length === 0) return;

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
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addNames(draft);
            }
            if (event.key === "Backspace" && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => {
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
