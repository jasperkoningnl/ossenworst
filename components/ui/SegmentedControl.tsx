"use client";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 cursor-pointer rounded-sm border px-2 py-2 text-[12.5px] font-bold"
            style={{
              background: active ? "var(--ajax-red)" : "var(--chip)",
              color: active ? "#fff" : "var(--fg2)",
              borderColor: active ? "var(--ajax-red-dark)" : "var(--bd2)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
