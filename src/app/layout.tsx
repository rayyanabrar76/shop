import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Shopflow - The Minimalist Commerce Engine",
  description: "Built for creators who value simplicity and speed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#212121",
          colorBackground: "#fdfdfc",
          colorText: "#212121",
          colorTextSecondary: "#6b6b6b",
          borderRadius: "1rem",
          fontFamily: "var(--font-geist-sans)",
        },
        elements: {
          card: "shadow-none border border-[#e8e8e3] bg-[#fdfdfc]",
          navbar: "hidden",
          headerTitle: "text-[#212121] tracking-tight font-bold",
          headerSubtitle: "text-[#6b6b6b]",
          formButtonPrimary:
            "bg-[#212121] hover:bg-black text-[13px] font-bold transition-all border-none",
          footerActionLink: "text-[#212121] hover:text-black font-semibold",
          identityPreviewText: "text-[#212121]",
          formFieldLabel:
            "text-[#6b6b6b] text-[12px] font-bold uppercase tracking-wider",
          formFieldInput:
            "bg-white border-[#e8e8e3] focus:border-[#212121] focus:ring-0 transition-all rounded-xl",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Runs synchronously before paint, prevents flash of wrong theme */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('admin-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fdfdfc] text-[#212121] selection:bg-[#e8e8e3] selection:text-black`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}