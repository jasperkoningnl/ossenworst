"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
        Er ging iets mis bij het ophalen van de gegevens.
      </p>
      <p className="text-xs" style={{ color: "var(--fg2)" }}>
        Probeer het straks opnieuw.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-[5px] px-4 py-2 font-mono text-[11px] font-bold tracking-wide text-white"
        style={{ background: "#D2122E" }}
      >
        PROBEER OPNIEUW
      </button>
    </div>
  );
}
