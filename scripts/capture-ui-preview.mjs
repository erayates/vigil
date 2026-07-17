import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const distDirectory = path.join(root, 'dist');
const outputPath = path.resolve(root, process.argv[2] ?? 'docs/assets/ui-concept-v0.0.2.png');

function builtPath(indexHtml, expression, label) {
  const match = indexHtml.match(expression)?.[1];
  if (!match) throw new Error(`Unable to locate built ${label} in dist/index.html.`);
  return path.join(distDirectory, match.replace(/^\//, ''));
}

function mimeFor(filePath) {
  if (filePath.endsWith('.png')) return 'image/png';
  throw new Error(`Unsupported embedded preview asset: ${filePath}`);
}

async function inlineRasterAssets(source) {
  const assetPaths = [...new Set(source.match(/\/assets\/[A-Za-z0-9_./-]+\.png/g) ?? [])];
  let result = source;

  for (const assetPath of assetPaths) {
    const localPath = path.join(distDirectory, assetPath.replace(/^\//, ''));
    const bytes = await readFile(localPath);
    const dataUrl = `data:${mimeFor(localPath)};base64,${bytes.toString('base64')}`;
    result = result.split(assetPath).join(dataUrl);
  }

  return result;
}

const indexHtml = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
let javascript = await readFile(
  builtPath(indexHtml, /src="([^"]+\.js)"/, 'JavaScript bundle'),
  'utf8',
);
let stylesheet = await readFile(builtPath(indexHtml, /href="([^"]+\.css)"/, 'stylesheet'), 'utf8');

const combined = await inlineRasterAssets(`${stylesheet}\n/* SCRIPT_BOUNDARY */\n${javascript}`);
[stylesheet, javascript] = combined.split('\n/* SCRIPT_BOUNDARY */\n');

const previewHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VIGIL UI Preview</title>
    <style>${stylesheet}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${javascript}</script>
  </body>
</html>`;

const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.setContent(previewHtml, { waitUntil: 'load' });
  await page.waitForSelector('.imperium-shell');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath });
  console.log(`Captured ${path.relative(root, outputPath)} at 1600x900.`);
} finally {
  await browser.close();
}
