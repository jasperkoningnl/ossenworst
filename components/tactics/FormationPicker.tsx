"use client";

import { FORMATION_OPTIONS, type FormationOption } from "@/lib/mock/tactics";

export function FormationPicker({
  value,
  onChange,
}: {
  value: FormationOption;
  onChange: (formation: FormationOption) => void;
}) {
  return (
    <div className="flex gap-[5px] px-3.5 pb-2.5">
      {FORMATION_OPTIONS.map((f) => {
        const active = f === value;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            className="flex-none rounded-[3px] border px-2.5 py-1.5 font-mono text-[10px] font-semibold"
            style={{
              background: active ? "var(--bd)" : "var(--chip)",
              color: active ? "var(--fg)" : "var(--fg3)",
              borderColor: active ? "#2C6FD6" : "var(--bd2)",
            }}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}
