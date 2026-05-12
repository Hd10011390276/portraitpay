/**
 * Client-side certificate generator using Canvas API
 * Uses system fonts (including Chinese) to render certificate
 */

interface CertificateData {
  portraitTitle: string;
  portraitHash?: string;
  blockchainTxHash: string;
  network: string;
  certifiedAt: Date;
  idCardName: string;
  certificateNo: string;
  isEarlyContributor?: boolean;
}

const CERTIFICATE_TEMPLATE_URL = "/images/blockchain-certificate-template-final.png";

const W = 5000;
const H = 2813;

// Template text positions (same as server-side)
const POSITIONS = {
  network: { x: 1229, y: 1216 },
  ownerName: { x: 1229, y: 1336 },
  portraitTitle: { x: 1229, y: 1459 },
  txHash: { x: 1229, y: 1651 },
  imgHash: { x: 1229, y: 1894 },
  certifiedTime: { x: 1229, y: 2086 },
  earlyContributor: { x: W * 0.5, y: H * 0.92 },
};

function truncateHash(hash: string, maxLen: number = 40): string {
  if (!hash || hash.length <= maxLen) return hash || "";
  return hash.slice(0, 16) + "..." + hash.slice(-16);
}

export async function generateCertificateClientSide(
  data: CertificateData,
  templateUrl: string = CERTIFICATE_TEMPLATE_URL
): Promise<Blob> {
  // Load the template image
  const templateImg = await loadImage(templateUrl);

  // Create canvas at full resolution
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Draw template
  ctx.drawImage(templateImg, 0, 0, W, H);

  // Prepare text values
  const networkLabel = data.network === "base" ? "Base Mainnet" : "Ethereum Sepolia";
  const certDateStr = formatDate(data.certifiedAt);
  const txHash = truncateHash(data.blockchainTxHash, 66);
  const imgHash = truncateHash(data.portraitHash || "", 66);

  // Set up font styles
  ctx.textBaseline = "top";

  // Network - purple, bold
  ctx.font = '500 50px "Noto Sans SC", "Microsoft YaHei", "Arial", sans-serif';
  ctx.fillStyle = "#a855f7";
  ctx.fillText(networkLabel, POSITIONS.network.x, POSITIONS.network.y - 50);

  // Owner Name - white
  ctx.font = '500 50px "Noto Sans SC", "Microsoft YaHei", "Arial", sans-serif';
  ctx.fillStyle = "white";
  ctx.fillText(data.idCardName, POSITIONS.ownerName.x, POSITIONS.ownerName.y - 50);

  // Portrait Title - white
  ctx.font = '500 50px "Noto Sans SC", "Microsoft YaHei", "Arial", sans-serif';
  ctx.fillStyle = "white";
  ctx.fillText(data.portraitTitle, POSITIONS.portraitTitle.x, POSITIONS.portraitTitle.y - 50);

  // Transaction Hash - purple, monospace-like
  ctx.font = '42px "Noto Sans SC", "Courier New", monospace';
  ctx.fillStyle = "#a855f7";
  ctx.fillText(txHash, POSITIONS.txHash.x, POSITIONS.txHash.y - 42);

  // Image Hash - purple
  ctx.font = '42px "Noto Sans SC", "Courier New", monospace';
  ctx.fillStyle = "#a855f7";
  ctx.fillText(imgHash, POSITIONS.imgHash.x, POSITIONS.imgHash.y - 42);

  // Certified Time - white
  ctx.font = '500 48px "Noto Sans SC", "Microsoft YaHei", "Arial", sans-serif';
  ctx.fillStyle = "white";
  ctx.fillText(certDateStr, POSITIONS.certifiedTime.x, POSITIONS.certifiedTime.y - 48);

  // Early Contributor Badge
  if (data.isEarlyContributor) {
    ctx.font = 'bold 48px "Noto Sans SC", "Arial", sans-serif';
    ctx.fillStyle = "#fbbf24";
    ctx.textAlign = "center";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 10;
    ctx.fillText("★ EARLY CONTRIBUTOR ★", POSITIONS.earlyContributor.x, POSITIONS.earlyContributor.y - 48);
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to generate certificate image"));
    }, "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Download certificate using client-side generation
export async function downloadCertificateClientSide(
  portraitId: string,
  data: CertificateData
): Promise<void> {
  const blob = await generateCertificateClientSide(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `portrait-certificate-${portraitId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
