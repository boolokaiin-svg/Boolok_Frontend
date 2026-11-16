const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');

  // Replace default title and insert SEO & Google verification tags
  const tagsToInject = `
    <title>Boolok AI - AI Agent For Real Estate Services</title>
    <meta name="description" content="Boolok AI - Next-generation AI agent for real estate services, 3D architectural blueprints, deed verification, and social real estate network." />
    <meta name="google-site-verification" content="1EGLvEwSBWIt9oM3P3XbSWZ8hgGFrF-Jr4rnAlWv28E" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
    <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
    <link rel="shortcut icon" href="/favicon.ico" />`;

  if (html.includes('<title>boolokgpt</title>')) {
    html = html.replace('<title>boolokgpt</title>', tagsToInject);
  } else if (html.includes('</head>')) {
    html = html.replace('</head>', `${tagsToInject}\n  </head>`);
  }

  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log('[post-export] Successfully injected Google verification & SEO tags into dist/index.html');
}

// Copy public assets (favicon.ico, favicon.png, icons) to dist root
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
  fs.cpSync(publicDir, distDir, { recursive: true, force: true });
  console.log('[post-export] Successfully copied public assets to dist/');
}
