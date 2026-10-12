import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerCompiler — AI Resume Engineering Platform",
  description:
    "Upload your master resume and automatically generate job-specific PDF variants using AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--color-border)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.025em', cursor: 'pointer' }}>
              Career<span className="text-gradient">Compiler</span>
            </div>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <a href="/" className="nav-link">
              Upload New Resume
            </a>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.25rem' }}>
              AI Resume Engineering
            </div>
          </div>
        </nav>
        <main style={{ minHeight: 'calc(100vh - 80px)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
