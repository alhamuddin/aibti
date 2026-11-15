import { formatDateWithOptions } from "@/utils/date-time";

export type CourseCertificate = {
  participantName: string;
  courseTitle: string;
  batchName: string;
  certificateNumber: string;
  completedAt: Date;
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function certificateText(value: string, y: number, size: number, color: string) {
  const maxWidth = 820;
  return `<text x="500" y="${y}" text-anchor="middle" fill="${color}" font-family="Georgia, serif" font-size="${size}" textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs">${escapeXml(value)}</text>`;
}

export function renderCourseCertificate(certificate: CourseCertificate): string {
  const completionDate = formatDateWithOptions(certificate.completedAt, {
    dateStyle: "long",
    timeZone: "UTC",
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700" role="img" aria-labelledby="title description">
  <title id="title">Certificate of completion for ${escapeXml(certificate.participantName)}</title>
  <desc id="description">${escapeXml(certificate.participantName)} completed ${escapeXml(certificate.courseTitle)} in ${escapeXml(certificate.batchName)}.</desc>
  <rect width="1000" height="700" fill="#f8f6f0"/>
  <rect x="28" y="28" width="944" height="644" rx="8" fill="none" stroke="#173f35" stroke-width="4"/>
  <rect x="44" y="44" width="912" height="612" rx="4" fill="none" stroke="#c49a46" stroke-width="1.5"/>
  <circle cx="500" cy="112" r="34" fill="#173f35"/>
  <path d="M482 112l12 12 25-27" fill="none" stroke="#f8f6f0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  ${certificateText("CERTIFICATE OF COMPLETION", 194, 32, "#173f35")}
  <text x="500" y="237" text-anchor="middle" fill="#68736d" font-family="Arial, sans-serif" font-size="16" letter-spacing="3">THIS CERTIFICATE IS PROUDLY PRESENTED TO</text>
  ${certificateText(certificate.participantName, 310, 42, "#173f35")}
  <line x1="250" y1="335" x2="750" y2="335" stroke="#c49a46" stroke-width="2"/>
  <text x="500" y="385" text-anchor="middle" fill="#68736d" font-family="Arial, sans-serif" font-size="17">for successfully completing</text>
  ${certificateText(certificate.courseTitle, 440, 30, "#173f35")}
  <text x="500" y="486" text-anchor="middle" fill="#68736d" font-family="Arial, sans-serif" font-size="16">Batch: ${escapeXml(certificate.batchName)}</text>
  <text x="500" y="528" text-anchor="middle" fill="#68736d" font-family="Arial, sans-serif" font-size="16">Completed on ${escapeXml(completionDate)}</text>
  <line x1="350" y1="584" x2="650" y2="584" stroke="#173f35" stroke-width="1.5"/>
  <text x="500" y="610" text-anchor="middle" fill="#173f35" font-family="Arial, sans-serif" font-size="13" letter-spacing="1">AIBTI · TRAINING INSTITUTE</text>
  <text x="500" y="640" text-anchor="middle" fill="#68736d" font-family="Arial, sans-serif" font-size="11">Certificate No. ${escapeXml(certificate.certificateNumber)}</text>
</svg>`;
}
