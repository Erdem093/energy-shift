import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Energy Shift — UK Demand Behaviour Analysis',
  description: 'Analysing UK household energy consumption patterns to model the behavioural incentives required to shift peak demand. Built on Carbon Intensity API & Elexon BMRS data.',
  keywords: ['UK energy', 'smart meter', 'carbon intensity', 'peak demand', 'time of use tariff', 'Agile Octopus'],
  openGraph: {
    title: 'Energy Shift — UK Demand Behaviour Analysis',
    description: 'Model the financial incentives required to shift UK peak electricity demand. Real data, interactive analysis.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
