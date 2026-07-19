import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const neueMontreal = localFont({
  variable: "--font-neue-montreal",
  display: "swap",
  src: [
    {
      path: "../fonts/PPNeueMontreal-Light.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontreal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontreal-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ming-ma.com"),
  title: {
    default: "Ming Ma — Politics, Public Services & AI",
    template: "%s — Ming Ma",
  },
  description:
    "Ming Ma is a postdoctoral researcher studying how emerging technology and misinformation shape global politics, public services, and digital society.",
  authors: [{ name: "Ming Ma" }],
  openGraph: {
    type: "website",
    title: "Ming Ma — Politics, Public Services & AI",
    description:
      "Research on AI, public service transformation, authoritarian narratives, and digital society.",
    images: [{ url: "/images/robot-source.png", width: 1536, height: 1024 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${neueMontreal.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
