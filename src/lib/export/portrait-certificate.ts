/**
 * Generate PNG certificate by overlaying text on template image
 * Uses embedded fonts to work in Vercel serverless environment
 */

import sharp from "sharp";
import { format } from "date-fns";

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
  const idCardType = escapeXml(data.idCardType);
  const txHash = truncateHash(data.blockchainTxHash, 66);
  const imgHash = truncateHash(data.portraitHash || "", 66);

  const VAL_X = 1229;

  // Use Google Fonts for all text - works in Vercel serverless if network is available
  // Noto Sans SC covers both Latin and Chinese characters
  const googleFontUrl = "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans:wght@400;500;700&display=swap";

  const overlaySvg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      @import url('${googleFontUrl}');
    </style>
  </defs>

  <!-- Network - y=1216 -->
  <text x="${VAL_X}" y="1216"
        font-family="'Noto Sans', 'Noto Sans SC', sans-serif" font-size="50"
        fill="#a855f7" font-weight="500">
    ${networkLabel}
  </text>

  <!-- User ID / Owner Name - y=1336 -->
  <text x="${VAL_X}" y="1336"
        font-family="'Noto Sans SC', 'Noto Sans', sans-serif" font-size="50"
        font-weight="500" fill="white">
    ${ownerName}
  </text>

  <!-- Portrait Title - y=1459 -->
  <text x="${VAL_X}" y="1459"
        font-family="'Noto Sans SC', 'Noto Sans', sans-serif" font-size="50"
        font-weight="500" fill="white">
    ${portraitTitle}
  </text>

  <!-- Transaction Hash - y=1651 -->
  <text x="${VAL_X}" y="1651"
        font-family="'Noto Sans', monospace" font-size="42"
        fill="#a855f7">
    ${escapeXml(txHash)}
  </text>

  <!-- Image Hash (SHA-256) - y=1894 -->
  <text x="${VAL_X}" y="1894"
        font-family="'Noto Sans', monospace" font-size="42"
        fill="#a855f7">
    ${escapeXml(imgHash)}
  </text>

  <!-- Certified Time - y=2086 -->
  <text x="${VAL_X}" y="2086"
        font-family="'Noto Sans SC', 'Noto Sans', sans-serif" font-size="48"
        fill="white" font-weight="500">
    ${certDateStr}
  </text>

  <!-- Early Contributor Badge -->
  ${data.isEarlyContributor ? `
  <text x="${W * 0.5}" y="${H * 0.92}"
        text-anchor="middle" font-family="'Noto Sans', sans-serif" font-size="48"
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
