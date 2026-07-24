import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { Toaster } from "sonner";
import { SITE_URL, STUDIO_NAME } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: STUDIO_NAME,
    template: `%s | ${STUDIO_NAME}`,
  },
  description: "Agende seu horário na Delicadeza Nails de forma fácil e rápida",
  openGraph: {
    title: STUDIO_NAME,
    description: "Agende seu horário na Delicadeza Nails de forma fácil e rápida",
    url: "/",
    siteName: STUDIO_NAME,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#fff",
              color: "#2d1b14",
              border: "1px solid #e8ddd8",
            },
          }}
        />
      </body>
    </html>
  );
}
