import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML document for Expo Router Web.
 * This file is web-only and configures the root HTML for every web page during static rendering.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>BoolokOne - AI Agent For Real Estate Services</title>
        <meta
          name="description"
          content="BoolokOne - Next-generation AI agent for real estate services, 3D architectural blueprints, deed verification, and social real estate network."
        />

        {/* Google Search Console Site Verification */}
        <meta
          name="google-site-verification"
          content="1EGLvEwSBWIt9oM3P3XbSWZ8hgGFrF-Jr4rnAlWv28E"
        />

        {/* Webpage Favicons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Disable body scrolling on web similar to mobile */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
