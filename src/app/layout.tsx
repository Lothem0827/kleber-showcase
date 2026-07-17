import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ReactDevInspector } from "@/components/dev/ReactDevInspector";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kleber Showcase",
  description: "Demo registration form showcasing Kleber validation APIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full font-sans", inter.variable, jetbrainsMono.variable)}
      style={
        {
          "--font-inter": inter.style.fontFamily,
          "--font-jetbrains-mono": jetbrainsMono.style.fontFamily,
        } as CSSProperties
      }
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ReactDevInspector />
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
