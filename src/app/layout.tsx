import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { NexusProvider } from "@/lib/nexus-store";
import { Ticket } from "@/components/Ticket";
import { ClaimLock } from "@/components/ClaimLock";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "CELLS — structure of a shared mind",
    template: "%s · CELLS",
  },
  description:
    "CELLS is one shared digital character mapped as 128 brain cells. Claim a seat, buy a contract, speak from the structure.",
  applicationName: "CELLS",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080601" },
    { media: "(prefers-color-scheme: light)", color: "#fceafc" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${plex.variable} h-full`}
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
