import "./globals.css";

export const metadata = {
  title: "Surjtech | Store Manager",
  description: "Store management app for Surjtech Mobile Phones & Accessories Enterprises",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)]" suppressHydrationWarning>{children}</body>
    </html>
  );
}
