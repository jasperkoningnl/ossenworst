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
    <div className="flex gap-[5px]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 cursor-pointer rounded-[3px] border py-1.5 px-2 font-mono text-[9.5px] font-semibold"
            style={{
              background: active ? "var(--bd)" : "var(--chip)",
              color: active ? "var(--fg)" : "var(--fg3)",
              borderColor: active ? "var(--accent-blue)" : "var(--bd2)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
