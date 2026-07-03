"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/lib/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mb-6">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--fg-label)" }}>
        Weergave
      </div>
      <SegmentedControl
        value={theme}
        onChange={setTheme}
        options={[
          { value: "light", label: "Licht" },
          { value: "dark", label: "Donker" },
        ]}
      />
    </div>
  );
}
