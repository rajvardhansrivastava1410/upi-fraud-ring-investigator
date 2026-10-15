import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UPI Fraud-Ring Investigator',
  description: 'Analyst workbench for coordinated-behaviour review (synthetic data only)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200 antialiased">{children}</body>
    </html>
  );
}
