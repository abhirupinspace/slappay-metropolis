import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Nav } from "@/components/Nav";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Slappay — The programmable neobank",
  description: "Your money. Your rules. A bank account that can think, pay and execute, settled on Monad.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${manrope.variable}`}>
      <body className="min-h-full font-sans">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
