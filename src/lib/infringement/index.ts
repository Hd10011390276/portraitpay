/**
 * Infringement Monitoring & Rights Protection — Library Index
 *
 * Re-exports all infringement-related services for convenient imports.
 *
 * Usage:
 *   import { findSimilarPortraits } from "@/lib/infringement";
 *   import { captureEvidence } from "@/lib/infringement/evidence";
 *   import { renderNotice } from "@/lib/infringement/notice";
 */

// Core services
export { runMonitoringCycle } from "./scanner";
export { findSimilarPortraits, extractEmbeddingFromUrl, batchSimilarityCheck } from "./face-similarity";
export { captureEvidence, buildEvidenceSetHash } from "./evidence";
export {
  renderNotice,
  renderNoticeHtml,
  type RenderedNotice,
  type NoticeType,
  type NoticeTemplateData,
} from "./notice";
export {
  submitForNotarization,
  getNotarizationStatus,
  getNotarizationCertificate,
  isNotarizationConfigured,
  type NotarizationRequest,
  type NotarizationResult,
  type NotarizationStatus,
} from "./notarization";
export {
  sendInfringementAlertEmail,
  sendInfringementAlertSms,
  sendInfringementAlertWechat,
} from "./notifications";
