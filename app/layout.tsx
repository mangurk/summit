import type { Metadata, Viewport } from "next";
import { Manrope, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const display = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Summit — The Nine Summits",
  description: "Turn daily check-ins into an expedition, one summit at a time.",
  appleWebApp: { capable: true, title: "Summit", statusBarStyle: "default" },
  icons: {
    icon: { url: "/icon.png?v=summit-gradient", type: "image/png", sizes: "128x128" },
    apple: { url: "/summit/summit-mark-192.png", type: "image/png", sizes: "192x192" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f3f8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${display.variable}`}>
      <body>
        <Script id="mobile-scroll-restoration" strategy="beforeInteractive">
          {`if (window.matchMedia("(max-width: 699px)").matches) history.scrollRestoration = "manual";`}
        </Script>
        {children}
      </body>
    </html>
  );
}
