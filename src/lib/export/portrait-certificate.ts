/**
 * Generate PNG certificate completely with sharp
 * No external template needed - creates stylized certificate directly
 */

import sharp from "sharp";
import { format } from "date-fns";

export interface CertificateData {
  portraitTitle: string;
  portraitHash: string;
  idCardHash: string;
  blockchainTxHash: string;
  network: string;
  certifiedAt: Date;
  idCardName: string;
  idCardType: string;
}

export async function buildCertificateImage(data: CertificateData): Promise<Buffer> {
  const networkLabel = data.network === "base" ? "Base Mainnet" : "Ethereum Sepolia";
  const certDateStr = format(data.certifiedAt, "yyyy-MM-dd HH:mm:ss");
  
  // Format values
  const txt = (s: string, maxLen = 40) => {
    const escaped = (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.length > maxLen ? escaped.slice(0, maxLen) + '...' : escaped;
  };

  // Create SVG directly with all elements
  const svg = `
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
  
  <!-- Background -->
  <rect width="800" height="600" fill="url(#bg)"/>
  
  <!-- Gold Border -->
  <rect x="10" y="10" width="780" height="580" fill="none" stroke="url(#gold)" stroke-width="3"/>
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#gold)" stroke-width="1"/>
  
  <!-- Header -->
  <rect x="50" y="50" width="700" height="80" rx="8" fill="#7c3aed" opacity="0.9"/>
  <text x="400" y="85" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="white">BLOCKCHAIN CERTIFICATE</text>
  <text x="400" y="110" text-anchor="middle" font-family="Arial" font-size="14" fill="#e9d5ff">PORTRAITPAY AI</text>
  
  <!-- Main Content Box -->
  <rect x="50" y="150" width="700" height="350" rx="12" fill="rgba(30,41,59,0.8)" stroke="#a855f7" stroke-width="1"/>
  
  <!-- Portrait Title -->
  <text x="70" y="180" font-family="Arial" font-size="11" fill="#94a3b8">PORTRAIT TITLE</text>
  <text x="70" y="205" font-family="Arial" font-size="15" fill="white">${txt(data.portraitTitle, 35)}</text>
  
  <!-- Owner Name -->
  <text x="70" y="240" font-family="Arial" font-size="11" fill="#94a3b8">OWNER NAME</text>
  <text x="70" y="265" font-family="Arial" font-size="15" fill="white">${txt(data.idCardName, 30)}</text>
  
  <!-- ID Type -->
  <text x="400" y="240" font-family="Arial" font-size="11" fill="#94a3b8">ID TYPE</text>
  <text x="400" y="265" font-family="Arial" font-size="15" fill="white">${txt(data.idCardType, 20)}</text>
  
  <!-- Divider -->
  <line x1="70" y1="290" x2="730" y2="290" stroke="#374151" stroke-width="1"/>
  
  <!-- Network -->
  <text x="70" y="315" font-family="Arial" font-size="11" fill="#94a3b8">BLOCKCHAIN NETWORK</text>
  <text x="70" y="340" font-family="Arial" font-size="14" fill="#a855f7">${networkLabel}</text>
  
  <!-- Certified Time -->
  <text x="400" y="315" font-family="Arial" font-size="11" fill="#94a3b8">CERTIFIED TIME</text>
  <text x="400" y="340" font-family="Arial" font-size="14" fill="white">${certDateStr}</text>
  
  <!-- Divider 2 -->
  <line x1="70" y1="375" x2="730" y2="375" stroke="#374151" stroke-width="1"/>
  
  <!-- Transaction Hash -->
  <text x="70" y="400" font-family="Arial" font-size="11" fill="#94a3b8">TRANSACTION HASH</text>
  <text x="70" y="425" font-family="monospace" font-size="10" fill="#a855f7">${txt(data.blockchainTxHash, 50)}</text>
  
  <!-- Image Hash -->
  <text x="70" y="455" font-family="Arial" font-size="11" fill="#94a3b8">IMAGE HASH (SHA-256)</text>
  <text x="70" y="480" font-family="monospace" font-size="10" fill="#a855f7">${txt(data.portraitHash, 50)}</text>
  
  <!-- Verification Box -->
  <rect x="580" y="170" width="150" height="130" rx="8" fill="none" stroke="#fbbf24" stroke-width="2"/>
  <path d="M620 220 L645 245 L680 205" stroke="#fbbf24" stroke-width="4" fill="none"/>
  <text x="655" y="280" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#fbbf24">VERIFIED</text>
  <text x="655" y="295" text-anchor="middle" font-family="Arial" font-size="10" fill="#94a3b8">portraitpayai.com</text>
  
  <!-- Footer -->
  <text x="400" y="545" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">This certificate is permanently stored on the blockchain</text>
  <text x="400" y="565" text-anchor="middle" font-family="Arial" font-size="10" fill="#475569">portraitpayai.com  Powered by Ethereum</text>
</svg>
`;

  const buffer = Buffer.from(svg);
  
  const result = await sharp(buffer, { density: 300 })
    .resize(800, 600)
    .png()
    .toBuffer();
  
  return result;
}

// Alias for backward compatibility — use proper ESM re-export
export { buildCertificateImage as buildPortraitCertificate };
