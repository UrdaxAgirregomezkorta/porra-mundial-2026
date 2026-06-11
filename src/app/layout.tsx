import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AISAO Porria - 2026ko Mundiala",
  description: "2026ko Mundialeko AISAO porria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${outfit.className} min-h-full flex flex-col bg-slate-950 text-slate-50`}>
        <main className="flex-1">{children}</main>
        <footer className="py-6 text-center text-slate-500 text-sm border-t border-slate-800/50 bg-slate-950 mt-auto">
          <p>
            <span className="text-emerald-500 font-semibold">AISAO </span> porria &copy; 2026
          </p>
          <p className="mt-1">
            Urdax-ek garatua 🚀
          </p>
        </footer>
      </body>
    </html>
  );
}
