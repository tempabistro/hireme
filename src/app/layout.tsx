import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ApplyPilot AI — AI-Powered Job Application Agent',
  description:
    'ApplyPilot AI is your intelligent job application operating system. Country-aware, quality-focused AI that tailors CVs, cover letters, and application answers for every market.',
  keywords: ['job application', 'AI', 'CV', 'resume', 'cover letter', 'job search'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
