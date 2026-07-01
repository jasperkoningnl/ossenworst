import type { Metadata } from "next";
import { Barlow_Semi_Condensed, IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import "./globals.css";

const barlow = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Ossenworst Manager",
  description: "Nieuwsaggregator voor Ajax",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${barlow.variable} ${plexMono.variable}`}
      // data-theme wordt vóór hydratie door het inline script hieronder gezet
      // (buiten React om) om een flits van het verkeerde thema te voorkomen.
      suppressHydrationWarning
    >
      <head>
        <script
          // Zet het thema-attribuut vóór hydratie zodat er geen flits van het
          // verkeerde thema is voor gebruikers met een opgeslagen voorkeur.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("osw-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
