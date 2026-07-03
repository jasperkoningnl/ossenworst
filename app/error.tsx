"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-[15px] font-semibold" style={{ color: "var(--fg)" }}>
        Er ging iets mis bij het ophalen van de gegevens.
      </p>
      <p className="text-[13px]" style={{ color: "var(--fg2)" }}>
        Probeer het straks opnieuw.
      </p>
      <button
        onClick={reset}
        className="mt-2 cursor-pointer rounded-md px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white"
        style={{ background: "var(--ajax-red)" }}
      >
        Probeer opnieuw
      </button>
    </div>
  );
}
