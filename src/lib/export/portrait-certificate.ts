/**
 * Generate PNG certificate by overlaying text on template image
 * Uses fonts from node_modules to work in Vercel serverless environment
 */

import sharp from "sharp";
import { format } from "date-fns";
import * as fs from "fs";
import * as path from "path";

export interface CertificateData {
  portraitTitle: string;
  portraitHash?: string;
  idCardHash?: string;
  blockchainTxHash: string;
  network: string;
  certifiedAt: Date;
  idCardName: string;
  idCardType: string;
  idCardNumberMasked?: string;
  certificateNo: string;
  isEarlyContributor?: boolean;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateHash(hash: string, maxLen: number = 40): string {
  if (!hash || hash.length <= maxLen) return hash || "";
  return hash.slice(0, 16) + "..." + hash.slice(-16);
}

// Load font file and return as base64
function loadFontBase64(fontPath: string): string | null {
  try {
    if (fs.existsSync(fontPath)) {
      const fontData = fs.readFileSync(fontPath);
      return fontData.toString("base64");
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

function getNotoSansLatinBase64(): string | null {
  const paths = [
    // Production: process.cwd() should be the project root on Vercel
    path.join(process.cwd(), "node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff"),
    path.join(process.cwd(), "node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff2"),
    // Development fallback paths
    path.join(__dirname, "../../node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff"),
    path.join(__dirname, "../../node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff2"),
  ];

  for (const p of paths) {
    const result = loadFontBase64(p);
    if (result) return result;
  }
  return null;
}

export async function buildCertificateImage(
  data: CertificateData,
  templatePath?: string
): Promise<Buffer> {
  const templateFilePath =
    templatePath ||
    `${process.cwd()}/public/images/blockchain-certificate-template-final.png`;

  const W = 5000;
  const H = 2813;

  const networkLabel = data.network === "base" ? "Base Mainnet" : "Ethereum Sepolia";
  const certDateStr = format(data.certifiedAt, "yyyy-MM-dd HH:mm:ss");

  const portraitTitle = escapeXml(data.portraitTitle);
  const ownerName = escapeXml(data.idCardName);
  const txHash = truncateHash(data.blockchainTxHash, 66);
  const imgHash = truncateHash(data.portraitHash || "", 66);

  const VAL_X = 1229;

  // Try to load Noto Sans Latin font for ASCII text (hashes, dates, etc.)
  // Font file is ~16KB and is bundled via @fontsource/noto-sans
  const fontBase64 = getNotoSansLatinBase64();

  // Build CSS with embedded font if available, otherwise use system fonts
  const fontFaceCSS = fontBase64
    ? `
    @font-face {
      font-family: 'NotoSans';
      src: url(data:font/woff;base64,${fontBase64}) format('woff');
      font-weight: 400;
      font-style: normal;
    }`
    : '';

  // Font stack - try embedded Noto Sans first, then fall back to common fonts
  // that might be available on the system
  const fontFamilyASCII = fontBase64
    ? "'NotoSans', 'Arial', 'Helvetica', sans-serif"
    : "'Arial', 'Helvetica', sans-serif";
  const fontFamilyAsian = fontBase64
    ? "'NotoSans', 'Noto Sans SC', 'Microsoft YaHei', 'SimHei', sans-serif"
    : "'Noto Sans SC', 'Microsoft YaHei', 'SimHei', 'Arial', sans-serif";
  const fontFamilyMono = fontBase64
    ? "'NotoSans', 'Courier New', monospace"
    : "'Courier New', monospace";

  const overlaySvg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      ${fontFaceCSS}
    </style>
  </defs>

  <!-- Network - y=1216 (ASCII only) -->
  <text x="${VAL_X}" y="1216"
        font-family="${fontFamilyASCII}" font-size="50"
        fill="#a855f7" font-weight="500">
    ${networkLabel}
  </text>

  <!-- User ID / Owner Name - y=1336 (may have Chinese) -->
  <text x="${VAL_X}" y="1336"
        font-family="${fontFamilyAsian}" font-size="50"
        font-weight="500" fill="white">
    ${ownerName}
  </text>

  <!-- Portrait Title - y=1459 (may have Chinese) -->
  <text x="${VAL_X}" y="1459"
        font-family="${fontFamilyAsian}" font-size="50"
        font-weight="500" fill="white">
    ${portraitTitle}
  </text>

  <!-- Transaction Hash - y=1651 (ASCII only) -->
  <text x="${VAL_X}" y="1651"
        font-family="${fontFamilyMono}" font-size="42"
        fill="#a855f7">
    ${escapeXml(txHash)}
  </text>

  <!-- Image Hash (SHA-256) - y=1894 (ASCII only) -->
  <text x="${VAL_X}" y="1894"
        font-family="${fontFamilyMono}" font-size="42"
        fill="#a855f7">
    ${escapeXml(imgHash)}
  </text>

  <!-- Certified Time - y=2086 (ASCII only) -->
  <text x="${VAL_X}" y="2086"
        font-family="${fontFamilyASCII}" font-size="48"
        fill="white" font-weight="500">
    ${certDateStr}
  </text>

  <!-- Early Contributor Badge -->
  ${data.isEarlyContributor ? `
  <text x="${W * 0.5}" y="${H * 0.92}"
        text-anchor="middle" font-family="${fontFamilyASCII}" font-size="48"
        font-weight="bold" fill="#fbbf24" filter="url(#glow)">
    ★ EARLY CONTRIBUTOR ★
  </text>` : ""}
</svg>`;

  const svgBuffer = Buffer.from(overlaySvg);

  const pngBuffer = await sharp(templateFilePath)
    .resize(W, H)
    .composite([
      {
        input: svgBuffer,
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  return pngBuffer;
}

export { buildCertificateImage as buildPortraitCertificate };
