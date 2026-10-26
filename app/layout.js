import '@fontsource-variable/public-sans';
import '@fontsource-variable/fraunces';
import Script from 'next/script';
import './globals.css';

const title = 'What We Name Our Babies';
const description =
  'Every U.S. baby name on record since 1880, in charts: look up any name, see which names spiked and which stuck, and where a name is most popular today.';

export const metadata = {
  metadataBase: new URL('https://briandaviddavidson.com'),
  title,
  description,
  authors: [{ name: 'Brian Davidson', url: 'https://briandaviddavidson.com' }],
  openGraph: {
    title,
    description,
    url: '/names/',
    siteName: 'Brian Davidson',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f7f3' },
    { media: '(prefers-color-scheme: dark)', color: '#111214' },
  ],
};

export default function RootLayout({ children }) {
  return (
    // Browser extensions add attributes to <html> and <body> before hydration;
    // this ignores those two elements' attributes only.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-SHEBFEH58S" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-SHEBFEH58S');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
