import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Sora & Sol | Japanese soul. Bulgarian heart. Bansko.",
  description:
    "Japanese craft meets Bulgarian hospitality in Bansko. Explore our seasonal menu, discover the dining room, and choose your perfect table.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
