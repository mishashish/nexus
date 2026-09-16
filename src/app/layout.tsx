import type { Metadata } from "next";
import { IBM_Plex_Mono, Nunito } from "next/font/google";
import { NexusProvider } from "@/lib/nexus-store";
import { Ticket } from "@/components/Ticket";
import { ClaimLock } from "@/components/ClaimLock";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800", "900"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "NEXUS — one mind in bloom",
  description:
    "NEXUS is a single shared digital character. 128 people hold its nodes. Claim one, send a scenario, watch the mind bloom.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${plex.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('nexus-sky')==='day')document.documentElement.classList.add('linen');var h=function(){document.querySelectorAll('nextjs-portal').forEach(function(n){n.remove();});};h();new MutationObserver(h).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}})();",
          }}
        />
        <NexusProvider>
          {children}
          <ClaimLock />
          <Ticket />
        </NexusProvider>
      </body>
    </html>
  );
}
