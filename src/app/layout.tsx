import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { hotelName } from "@/lib/config";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: hotelName,
  description: "Acesso Wi-Fi por tempo, após o pagamento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f4f6f8] font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
