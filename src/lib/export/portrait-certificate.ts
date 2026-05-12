/**
 * Generate PNG certificate using pure sharp + SVG
 * Standalone certificate with professional design - no external template needed
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

// Convert text to SVG path-like elements for guaranteed rendering
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateHash(hash: string, maxLen: number = 40): string {
  if (!hash || hash.length <= maxLen) return hash || '';
  return hash.slice(0, 16) + '...' + hash.slice(-16);
}

export async function buildCertificateImage(
  data: CertificateData,
  _templatePath?: string
): Promise<Buffer> {
  const networkLabel = data.network === "base" ? "Base Mainnet" : "Ethereum Sepolia";
  const certDateStr = format(data.certifiedAt, "yyyy-MM-dd HH:mm:ss");

  // Prepare values
  const certNo = escapeXml(data.certificateNo);
  const portraitTitle = escapeXml(data.portraitTitle);
  const ownerName = escapeXml(data.idCardName);
  const idCardType = escapeXml(data.idCardType);
  const txHash = truncateHash(data.blockchainTxHash, 44);
  const imgHash = truncateHash(data.portraitHash || '', 44);

  const earlyBadgeSvg = data.isEarlyContributor
    ? `<text x="400" y="568" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#fbbf24">★ EARLY CONTRIBUTOR ★</text>`
    : '';

  // Build complete certificate SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1f2e"/>
      <stop offset="100%" stop-color="#0f1219"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="600" fill="url(#bgGrad)"/>

  <!-- Outer gold border -->
  <rect x="8" y="8" width="784" height="584" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
  <rect x="16" y="16" width="768" height="568" rx="2" fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity="0.5"/>

  <!-- Header bar -->
  <rect x="50" y="40" width="700" height="90" rx="8" fill="url(#purpleGrad)"/>
  <text x="400" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" letter-spacing="2">BLOCKCHAIN CERTIFICATE</text>
  <text x="400" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#c4b5fd" letter-spacing="1">PORTRAITPAY AI</text>

  <!-- Main content box -->
  <rect x="50" y="145" width="700" height="360" rx="12" fill="rgba(30,41,59,0.6)" stroke="#a855f7" stroke-width="1"/>

  <!-- Certificate number section -->
  <text x="70" y="172" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">CERTIFICATE NUMBER</text>
  <text x="70" y="195" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#fbbf24">${certNo}</text>

  <!-- Portrait Title section -->
  <text x="70" y="225" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">PORTRAIT TITLE</text>
  <text x="70" y="245" font-family="Arial, sans-serif" font-size="13" font-weight="500" fill="white">${portraitTitle}</text>

  <!-- Owner Name section -->
  <text x="70" y="275" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">OWNER NAME</text>
  <text x="70" y="295" font-family="Arial, sans-serif" font-size="13" font-weight="500" fill="white">${ownerName}</text>

  <!-- ID Type section -->
  <text x="400" y="275" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">ID TYPE</text>
  <text x="400" y="295" font-family="Arial, sans-serif" font-size="13" font-weight="500" fill="white">${idCardType}</text>

  <!-- Divider line 1 -->
  <line x1="70" y1="315" x2="730" y2="315" stroke="#334155" stroke-width="1"/>

  <!-- Blockchain Network section -->
  <text x="70" y="335" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">BLOCKCHAIN NETWORK</text>
  <text x="70" y="355" font-family="Arial, sans-serif" font-size="12" fill="#a855f7" font-weight="500">${networkLabel}</text>

  <!-- Certified Time section -->
  <text x="400" y="335" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">CERTIFIED TIME (UTC)</text>
  <text x="400" y="355" font-family="Arial, sans-serif" font-size="12" fill="white" font-weight="500">${certDateStr}</text>

  <!-- Divider line 2 -->
  <line x1="70" y1="375" x2="730" y2="375" stroke="#334155" stroke-width="1"/>

  <!-- Transaction Hash section -->
  <text x="70" y="395" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">TRANSACTION HASH</text>
  <text x="70" y="415" font-family="Courier New, monospace" font-size="9" fill="#a855f7">${escapeXml(txHash)}</text>

  <!-- Image Hash section -->
  <text x="70" y="440" font-family="Arial, sans-serif" font-size="9" fill="#64748b" letter-spacing="1">IMAGE HASH (SHA-256)</text>
  <text x="70" y="460" font-family="Courier New, monospace" font-size="9" fill="#a855f7">${escapeXml(imgHash)}</text>

  <!-- Verification badge -->
  <rect x="580" y="170" width="150" height="130" rx="8" fill="none" stroke="url(#goldGrad)" stroke-width="2"/>
  <circle cx="655" cy="210" r="30" fill="none" stroke="#fbbf24" stroke-width="2"/>
  <path d="M635 210 L650 225 L675 195" stroke="#fbbf24" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="655" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#fbbf24" filter="url(#glow)">VERIFIED</text>
  <text x="655" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#94a3b8">portraitpayai.com</text>

  <!-- Footer -->
  <text x="400" y="545" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#64748b">This certificate is permanently stored on the blockchain</text>
  <text x="400" y="558" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#475569">portraitpayai.com | Powered by Ethereum</text>
  ${earlyBadgeSvg}
</svg>`;

  // Convert SVG to PNG
  const svgBuffer = Buffer.from(svg);
  const pngBuffer = await sharp(svgBuffer, {
    width: 800,
    height: 600,
  })
    .png()
    .toBuffer();

  return pngBuffer;
}

export { buildCertificateImage as buildPortraitCertificate };
