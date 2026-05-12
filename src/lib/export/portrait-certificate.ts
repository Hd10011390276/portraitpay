/**
 * Generate PNG certificate by overlaying text on user's template image
 */

import sharp from "sharp";
import { format } from "date-fns";
import path from "path";

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

export async function buildCertificateImage(data: CertificateData, templatePath?: string): Promise<Buffer> {
  const networkLabel = data.network === "base" ? "Base Mainnet" : "Ethereum Sepolia";
  const certDateStr = format(data.certifiedAt, "yyyy-MM-dd HH:mm:ss");

  // Format values - escape special chars for SVG text
  const txt = (s: string, maxLen = 40) => {
    if (!s) return '';
    const escaped = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return escaped.length > maxLen ? escaped.slice(0, maxLen) + '...' : escaped;
  };

  // Early contributor badge
  const earlyBadgeSvg = data.isEarlyContributor
    ? `<text x="400" y="545" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#fbbf24">★ EARLY CONTRIBUTOR ★</text>`
    : '';

  // Create SVG text overlay - dimensions match 800x600 template
  const svg = `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Certificate Number Section -->
  <text x="70" y="175" font-family="Arial" font-size="10" fill="#94a3b8">CERTIFICATE</text>
  <text x="70" y="195" font-family="Arial" font-size="14" font-weight="bold" fill="#fbbf24">${txt(data.certificateNo)}</text>

  <!-- Portrait Title -->
  <text x="70" y="235" font-family="Arial" font-size="10" fill="#94a3b8">PORTRAIT TITLE</text>
  <text x="70" y="255" font-family="Arial" font-size="13" fill="white">${txt(data.portraitTitle, 30)}</text>

  <!-- Owner Name -->
  <text x="70" y="285" font-family="Arial" font-size="10" fill="#94a3b8">OWNER NAME</text>
  <text x="70" y="305" font-family="Arial" font-size="13" fill="white">${txt(data.idCardName, 25)}</text>

  <!-- ID Type -->
  <text x="400" y="285" font-family="Arial" font-size="10" fill="#94a3b8">ID TYPE</text>
  <text x="400" y="305" font-family="Arial" font-size="13" fill="white">${txt(data.idCardType, 20)}</text>

  <!-- Divider -->
  <line x1="70" y1="320" x2="730" y2="320" stroke="#374151" stroke-width="1"/>

  <!-- Network -->
  <text x="70" y="340" font-family="Arial" font-size="10" fill="#94a3b8">BLOCKCHAIN</text>
  <text x="70" y="360" font-family="Arial" font-size="12" fill="#a855f7">${networkLabel}</text>

  <!-- Certified Time -->
  <text x="400" y="340" font-family="Arial" font-size="10" fill="#94a3b8">CERTIFIED TIME</text>
  <text x="400" y="360" font-family="Arial" font-size="12" fill="white">${certDateStr}</text>

  <!-- Divider 2 -->
  <line x1="70" y1="385" x2="730" y2="385" stroke="#374151" stroke-width="1"/>

  <!-- Transaction Hash -->
  <text x="70" y="405" font-family="Arial" font-size="9" fill="#94a3b8">TX HASH</text>
  <text x="70" y="420" font-family="monospace" font-size="8" fill="#a855f7">${txt(data.blockchainTxHash, 45)}</text>

  <!-- Image Hash -->
  <text x="70" y="440" font-family="Arial" font-size="9" fill="#94a3b8">IMAGE HASH</text>
  <text x="70" y="455" font-family="monospace" font-size="8" fill="#a855f7">${txt(data.portraitHash || '', 45)}</text>

  <!-- Footer -->
  <text x="400" y="555" text-anchor="middle" font-family="Arial" font-size="9" fill="#64748b">portraitpayai.com</text>
  ${earlyBadgeSvg}
</svg>
`;

  // If no template provided, generate standalone certificate
  if (!templatePath) {
    const fallbackSvg = createFallbackCertificate(data);
    const buffer = Buffer.from(fallbackSvg);
    return sharp(buffer, { density: 300 }).resize(800, 600).png().toBuffer();
  }

  try {
    // Load template and composite SVG overlay
    const templateBuffer = await sharp(templatePath)
      .resize(800, 600)
      .png()
      .toBuffer();

    const svgBuffer = Buffer.from(svg);

    // Create overlay image from SVG
    const overlayBuffer = await sharp(svgBuffer, { density: 300 })
      .resize(800, 600)
      .png()
      .toBuffer();

    // Composite SVG over template
    const result = await sharp(templateBuffer)
      .composite([{
        input: overlayBuffer,
        blend: 'over',
      }])
      .png()
      .toBuffer();

    return result;
  } catch (err) {
    console.error('[Certificate] Template overlay failed, using fallback:', err);
    const fallbackSvg = createFallbackCertificate(data);
    const buffer = Buffer.from(fallbackSvg);
    return sharp(buffer, { density: 300 }).resize(800, 600).png().toBuffer();
  }
}

function createFallbackCertificate(data: CertificateData): string {
  const networkLabel = data.network === "base" ? "Base Mainnet" : "Ethereum Sepolia";
  const certDateStr = format(data.certifiedAt, "yyyy-MM-dd HH:mm:ss");

  const txt = (s: string, maxLen = 40) => {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, maxLen);
  };

  const earlyBadge = data.isEarlyContributor
    ? `<text x="400" y="165" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#fbbf24">★ EARLY CONTRIBUTOR ★</text>`
    : '';

  return `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#d97706"/>
    </linearGradient>
  </defs>

  <rect width="800" height="600" fill="url(#bg)"/>
  <rect x="10" y="10" width="780" height="580" fill="none" stroke="url(#gold)" stroke-width="3"/>
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#gold)" stroke-width="1"/>

  <rect x="50" y="50" width="700" height="80" rx="8" fill="#7c3aed" opacity="0.9"/>
  <text x="400" y="85" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="white">BLOCKCHAIN CERTIFICATE</text>
  <text x="400" y="110" text-anchor="middle" font-family="Arial" font-size="14" fill="#e9d5ff">PORTRAITPAY AI</text>

  <rect x="50" y="150" width="700" height="350" rx="12" fill="rgba(30,41,59,0.8)" stroke="#a855f7" stroke-width="1"/>

  ${earlyBadge}
  <text x="70" y="175" font-family="Arial" font-size="11" fill="#94a3b8">CERTIFICATE NUMBER</text>
  <text x="70" y="200" font-family="Arial" font-size="18" font-weight="bold" fill="#fbbf24">${txt(data.certificateNo)}</text>

  <text x="70" y="235" font-family="Arial" font-size="11" fill="#94a3b8">PORTRAIT TITLE</text>
  <text x="70" y="260" font-family="Arial" font-size="15" fill="white">${txt(data.portraitTitle, 35)}</text>

  <text x="70" y="290" font-family="Arial" font-size="11" fill="#94a3b8">OWNER NAME</text>
  <text x="70" y="315" font-family="Arial" font-size="15" fill="white">${txt(data.idCardName, 30)}</text>

  <text x="400" y="290" font-family="Arial" font-size="11" fill="#94a3b8">ID TYPE</text>
  <text x="400" y="315" font-family="Arial" font-size="15" fill="white">${txt(data.idCardType, 20)}</text>

  <line x1="70" y1="345" x2="730" y2="345" stroke="#374151" stroke-width="1"/>

  <text x="70" y="365" font-family="Arial" font-size="11" fill="#94a3b8">BLOCKCHAIN NETWORK</text>
  <text x="70" y="390" font-family="Arial" font-size="14" fill="#a855f7">${networkLabel}</text>

  <text x="400" y="365" font-family="Arial" font-size="11" fill="#94a3b8">CERTIFIED TIME</text>
  <text x="400" y="390" font-family="Arial" font-size="14" fill="white">${certDateStr}</text>

  <line x1="70" y1="420" x2="730" y2="420" stroke="#374151" stroke-width="1"/>

  <text x="70" y="445" font-family="Arial" font-size="11" fill="#94a3b8">TRANSACTION HASH</text>
  <text x="70" y="470" font-family="monospace" font-size="10" fill="#a855f7">${txt(data.blockchainTxHash, 50)}</text>

  <text x="70" y="495" font-family="Arial" font-size="11" fill="#94a3b8">IMAGE HASH (SHA-256)</text>
  <text x="70" y="520" font-family="monospace" font-size="10" fill="#a855f7">${txt(data.portraitHash || '', 50)}</text>

  <rect x="580" y="170" width="150" height="130" rx="8" fill="none" stroke="#fbbf24" stroke-width="2"/>
  <path d="M620 220 L645 245 L680 205" stroke="#fbbf24" stroke-width="4" fill="none"/>
  <text x="655" y="280" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#fbbf24">VERIFIED</text>
  <text x="655" y="295" text-anchor="middle" font-family="Arial" font-size="10" fill="#94a3b8">portraitpayai.com</text>

  <text x="400" y="545" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">This certificate is permanently stored on the blockchain</text>
  <text x="400" y="565" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">portraitpayai.com  Powered by Ethereum</text>
</svg>
`;
}

export { buildCertificateImage as buildPortraitCertificate };
