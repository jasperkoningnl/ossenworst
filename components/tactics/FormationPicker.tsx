"use client";

import { FORMATION_OPTIONS, type FormationOption } from "@/lib/players/formations";

export function FormationPicker({
  value,
  onChange,
}: {
  value: FormationOption;
  onChange: (formation: FormationOption) => void;
}) {
  return (
    <div className="flex gap-1.5 px-4 pb-3">
      {FORMATION_OPTIONS.map((f) => {
        const active = f === value;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            className="flex-1 cursor-pointer rounded-sm border px-2 py-1.5 font-mono text-[12px] font-bold"
            style={{
              background: active ? "var(--ajax-red)" : "var(--chip)",
              color: active ? "#fff" : "var(--fg2)",
              borderColor: active ? "var(--ajax-red-dark)" : "var(--bd2)",
            }}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}
