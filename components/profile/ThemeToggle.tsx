"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useTheme } from "@/lib/theme/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mb-4">
      <div className="mb-2 font-mono text-[9px] tracking-wide" style={{ color: "var(--fg3)" }}>
        WEERGAVE
      </div>
      <SegmentedControl
        value={theme}
        onChange={setTheme}
        options={[
          { value: "dark", label: "DONKER" },
          { value: "light", label: "LICHT" },
        ]}
      />
    </div>
  );
}
