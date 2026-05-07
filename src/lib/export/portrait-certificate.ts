/**
 * Generate PNG certificate using template
 * Uses sharp to overlay text on template image
 */

import sharp from "sharp";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

// Read template from disk (cached in lambda)
let templateBuffer: Buffer | null = null;

async function getTemplate(): Promise<Buffer> {
  if (!templateBuffer) {
    try {
      const fs = require('fs');
      templateBuffer = fs.readFileSync('./public/images/certificate-template.png');
    } catch {
      // Fallback - create a simple certificate if template not found
      templateBuffer = await createFallbackTemplate();
    }
  }
  return templateBuffer;
}

async function createFallbackTemplate(): Promise<Buffer> {
  // Create a simple certificate template if file not found
  return await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 4,
      background: { r: 10, g: 20, b: 40, alpha: 1 }
    }
  }).png().toBuffer();
}

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
  const template = await getTemplate();
  
  const networkLabel = data.network === "base" ? "Base Mainnet" : "Ethereum Sepolia";
  const certDateStr = format(data.certifiedAt, "yyyy-MM-dd HH:mm:ss", { locale: zhCN });
  
  // Truncate hashes for display
  const shortTx = data.blockchainTxHash.slice(0, 18) + "...";
  const shortHash = data.portraitHash.slice(0, 18) + "...";
  
  // Create SVG overlay with text
  const svgOverlay = `
    <svg width="800" height="600">
      <style>
        .title { font-family: Arial, sans-serif; font-size: 28px; fill: white; font-weight: bold; }
        .subtitle { font-family: Arial, sans-serif; font-size: 16px; fill: #a855f7; }
        .label { font-family: Arial, sans-serif; font-size: 12px; fill: #94a3b8; }
        .value { font-family: monospace; font-size: 11px; fill: #ffffff; }
        .verified { font-family: Arial, sans-serif; font-size: 14px; fill: #fbbf24; font-weight: bold; }
        .time { font-family: Arial, sans-serif; font-size: 11px; fill: #94a3b8; }
      </style>
      
      <!-- Certificate Title -->
      <text x="400" y="80" text-anchor="middle" class="title">BLOCKCHAIN CERTIFICATE</text>
      <text x="400" y="105" text-anchor="middle" class="subtitle">PORTRAITPAY AI</text>
      
      <!-- User Info Box -->
      <rect x="50" y="140" width="700" height="320" rx="10" fill="rgba(30, 41, 59, 0.8)" stroke="#a855f7" stroke-width="1"/>
      
      <!-- Field: Portrait Title -->
      <text x="70" y="175" class="label">PORTRAIT TITLE</text>
      <text x="70" y="195" class="value" fill="#f8fafc" font-size="14">${data.portraitTitle}</text>
      
      <!-- Field: User Name -->
      <text x="70" y="230" class="label">OWNER NAME</text>
      <text x="70" y="250" class="value" fill="#f8fafc" font-size="14">${data.idCardName}</text>
      
      <!-- Field: ID Type -->
      <text x="380" y="230" class="label">ID TYPE</text>
      <text x="380" y="250" class="value" fill="#f8fafc" font-size="14">${data.idCardType}</text>
      
      <!-- Dividers -->
      <line x1="70" y1="270" x2="730" y2="270" stroke="#374151" stroke-width="1"/>
      <line x1="70" y1="340" x2="730" y2="340" stroke="#374151" stroke-width="1"/>
      <line x1="70" y1="410" x2="730" y2="410" stroke="#374151" stroke-width="1"/>
      
      <!-- Field: Network -->
      <text x="70" y="295" class="label">NETWORK</text>
      <text x="70" y="315" class="value" fill="#a855f7" font-size="13">${networkLabel}</text>
      
      <!-- Field: Certified Time -->
      <text x="380" y="295" class="label">CERTIFIED TIME</text>
      <text x="380" y="315" class="value" fill="#f8fafc" font-size="13">${certDateStr}</text>
      
      <!-- Field: Transaction Hash -->
      <text x="70" y="365" class="label">TRANSACTION HASH</text>
      <text x="70" y="385" class="value" fill="#a855f7" font-size="10">${data.blockchainTxHash}</text>
      
      <!-- Field: Image Hash (SHA-256) -->
      <text x="70" y="435" class="label">IMAGE HASH (SHA-256)</text>
      <text x="70" y="455" class="value" fill="#a855f7" font-size="10">${data.portraitHash}</text>
      
      <!-- Verification Box -->
      <rect x="580" y="150" width="150" height="120" rx="8" fill="none" stroke="#fbbf24" stroke-width="2"/>
      <text x="655" y="205" text-anchor="middle" class="verified">✓ VERIFIED</text>
      <text x="655" y="255" text-anchor="middle" font-family="Arial" font-size="10" fill="#94a3b8">portraitpayai.com</text>
      
      <!-- Footer -->
      <text x="400" y="550" text-anchor="middle" class="time">This certificate is permanently stored on the blockchain</text>
      <text x="400" y="570" text-anchor="middle" class="time">portraitpayai.com · Powered by Ethereum</text>
    </svg>
  `;

  // Composite template + overlay
  const result = await sharp(template)
    .composite([{
      input: Buffer.from(svgOverlay),
      top: 0,
      left: 0
    }])
    .png()
    .toBuffer();

  return result;
}