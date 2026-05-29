"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function PrivacyPage() {
  const { t } = useLanguage();
  const l = t.legal.privacy;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-default)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            <img src="/logo.png" alt="PortraitPay AI" className="w-7 h-7 rounded-lg dark:hidden" />
            <img src="/logo-dark.png" alt="PortraitPay AI" className="w-7 h-7 rounded-lg hidden dark:block" />
            PortraitPay AI
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm transition"
              style={{ color: "var(--text-tertiary)" }}
            >
              {l.backToHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{l.title}</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>{l.lastUpdated}</p>

        <div className="space-y-8">
          {/* Section 1: Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.infoWeCollect}</h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {l.sections.infoWeCollectDesc}
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.infoWeCollectList.account}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.infoWeCollectList.portrait}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.infoWeCollectList.blockchain}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.infoWeCollectList.usage}</strong></li>
            </ul>
          </section>

          {/* Section 2: How We Use */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.howWeUse}</h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {l.sections.howWeUseDesc}
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>{l.sections.howWeUseList.provide}</li>
              <li>{l.sections.howWeUseList.blockchain}</li>
              <li>{l.sections.howWeUseList.ipfs}</li>
              <li>{l.sections.howWeUseList.licensing}</li>
              <li>{l.sections.howWeUseList.notifications}</li>
              <li>{l.sections.howWeUseList.support}</li>
            </ul>
          </section>

          {/* Section 3: Information Sharing */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.infoSharing}</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {l.sections.infoSharingDesc}
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.infoSharingList.enterprise}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.infoSharingList.providers}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.infoSharingList.blockchain}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.infoSharingList.legal}</strong></li>
            </ul>
          </section>

          {/* Section 4: Data Retention */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.dataRetention}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.dataRetentionDesc}
            </p>
          </section>

          {/* Section 5: Data Security */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.dataSecurity}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.dataSecurityDesc}
            </p>
          </section>

          {/* Section 6: Your Rights */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.yourRights}</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {l.sections.yourRightsDesc}
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>{l.sections.yourRightsContact}</li>
            </ul>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.yourRightsContact} <a href={`mailto:${l.sections.contactEmail}`} className="underline" style={{ color: "var(--accent-primary)" }}>{l.sections.contactEmail}</a>
            </p>
          </section>

          {/* Section 7: Cookies */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.cookies}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.cookiesDesc}
            </p>
          </section>

          {/* Section 8: Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.childrenPrivacy}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.childrenPrivacyDesc}
            </p>
          </section>

          {/* Section 9: Changes to Policy */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.changesToPolicy}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.changesToPolicyDesc}
            </p>
          </section>

          {/* Section 10: Contact Us */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.contactUs}</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {l.sections.contactUsDesc}
            </p>
            <ul className="list-none pl-0 text-base space-y-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>
                <a href={`mailto:${l.sections.contactEmail}`} className="underline" style={{ color: "var(--accent-primary)" }}>
                  {l.sections.contactEmail}
                </a>
              </li>
            </ul>
          </section>

          {/* Section 4.1: California Privacy Rights (CCPA) */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>California Privacy Rights</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              Under the California Consumer Privacy Act (CCPA), California residents have the right to:
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>Know what personal information is collected, used, shared, or sold.</li>
              <li>Delete personal information held by businesses.</li>
              <li>Opt-out of the sale of personal information. PortraitPay AI does not sell personal information.</li>
              <li>Non-discrimination for exercising CCPA rights.</li>
            </ul>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              To exercise your rights under CCPA, contact us at <a href="mailto:contact@portraitpayai.com" className="underline" style={{ color: "var(--accent-primary)" }}>contact@portraitpayai.com</a> with subject "CCPA Request". We will respond within 45 days as required by law.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              PortraitPay AI does not sell your personal information. Under CCPA, you have the right to opt out of the sale of your personal information. Since we do not sell data, no opt-out is required, but you may contact us at <a href="mailto:contact@portraitpayai.com" className="underline" style={{ color: "var(--accent-primary)" }}>contact@portraitpayai.com</a> with any questions about data sharing.
            </p>
          </section>

          {/* Section 4.5: Biometric Information Privacy (BIPA) */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Biometric Information Privacy</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              PortraitPay AI collects and stores biometric data (facial images and voice recordings) solely for the purpose of identity verification and infringement detection as authorized by you. We:
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>Do not sell, lease, or trade biometric data to any third party.</li>
              <li>Store biometric data using industry-standard encryption.</li>
              <li>Retain biometric data only while your account is active, and delete it upon your request or account deletion.</li>
              <li>Obtain your explicit consent before collecting biometric data.</li>
            </ul>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              If you are an Illinois resident, you have additional rights under the Biometric Information Privacy Act (BIPA). Contact us at <a href="mailto:contact@portraitpayai.com" className="underline" style={{ color: "var(--accent-primary)" }}>contact@portraitpayai.com</a> for BIPA-specific requests.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-default)",
        padding: "32px 0",
        marginTop: "64px",
      }}>
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PortraitPay AI" className="w-5 h-5 rounded dark:hidden" />
            <img src="/logo-dark.png" alt="PortraitPay AI" className="w-5 h-5 rounded hidden dark:block" />
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>© 2026 PortraitPay AI</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-sm transition" style={{ color: "var(--text-tertiary)" }}>
              {t.footer.privacy}
            </Link>
            <Link href="/terms" className="text-sm transition" style={{ color: "var(--text-tertiary)" }}>
              {t.footer.terms}
            </Link>
            <Link href="/contact" className="text-sm transition" style={{ color: "var(--text-tertiary)" }}>
              {t.footer.contact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}