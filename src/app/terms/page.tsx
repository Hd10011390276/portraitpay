"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function TermsPage() {
  const { t } = useLanguage();
  const l = t.legal.terms;

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

        {/* Beta Notice */}
        <div className="rounded-xl p-4 mb-8" style={{
          background: "var(--accent-light)",
          border: "1px solid var(--accent-primary)",
        }}>
          <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>{l.betaNotice}</p>
          <p className="text-sm mt-1" style={{ color: "var(--accent-primary)", opacity: 0.8 }}>{l.betaNoticeDesc}</p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Acceptance */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.acceptance}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.acceptanceDesc}
            </p>
          </section>

          {/* Section 2: Service Description */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.serviceDesc}</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {l.sections.serviceDescDesc}
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>{l.sections.serviceDescList.upload}</li>
              <li>{l.sections.serviceDescList.blockchain}</li>
              <li>{l.sections.serviceDescList.ipfs}</li>
              <li>{l.sections.serviceDescList.licensing}</li>
            </ul>
          </section>

          {/* Section 3: Eligibility */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.eligibility}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.eligibilityDesc}
            </p>
          </section>

          {/* Section 4: Portrait Rights */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.portraitRights}</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {l.sections.portraitRightsDesc}
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>{l.sections.portraitRightsList.own}</li>
              <li>{l.sections.portraitRightsList.noInfringe}</li>
              <li>{l.sections.portraitRightsList.capacity}</li>
              <li>{l.sections.portraitRightsList.celebrity}</li>
            </ul>
            <div className="rounded-xl p-4" style={{ background: "var(--warning-light)", border: "1px solid var(--warning)" }}>
              <p className="text-base" style={{ color: "var(--warning)" }}>
                <strong>Note:</strong> {l.sections.portraitRightsWarning}
              </p>
            </div>
          </section>

          {/* Section 6: Payment Terms */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.blockchain}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.blockchainDesc}
            </p>
          </section>

          {/* Section 7: Licensing */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.licensing}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.licensingDesc}
            </p>
          </section>

          {/* Section 8: Payment Terms */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.payment}</h2>
            <ul className="list-disc pl-5 text-base space-y-1 mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.paymentList.platformFee}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.paymentList.ownerShare}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.paymentList.minWithdrawal}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.paymentList.withdrawalTime}</strong></li>
              <li><strong style={{ color: "var(--text-primary)" }}>{l.sections.paymentList.methods}</strong></li>
            </ul>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.paymentNote}
            </p>
          </section>

          {/* Section 9: User Conduct */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.conduct}</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {l.sections.conductDesc}
            </p>
            <ul className="list-disc pl-5 text-base space-y-1 mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>{l.sections.conductList.consent}</li>
              <li>{l.sections.conductList.illegal}</li>
              <li>{l.sections.conductList.manipulate}</li>
              <li>{l.sections.conductList.bot}</li>
              <li>{l.sections.conductList.harass}</li>
              <li>{l.sections.conductList.violate}</li>
            </ul>
          </section>

          {/* Section 10: Deletion Process */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.deletionProcess}</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              {l.sections.deletionProcessDesc}
            </p>
            <ol className="list-decimal pl-5 text-base space-y-2 mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <li>{l.sections.deletionSteps.step1}</li>
              <li>{l.sections.deletionSteps.step2}</li>
              <li>{l.sections.deletionSteps.step3}</li>
              <li>{l.sections.deletionSteps.step4}</li>
            </ol>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.deletionNote}
            </p>
          </section>

          {/* Section 11: Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.disclaimer}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.disclaimerDesc}
            </p>
          </section>

          {/* Section 12: Governing Law */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.governingLaw}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.governingLawDesc}
            </p>
          </section>

          {/* Section 4.4: Dispute Resolution */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Dispute Resolution</h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              Any dispute, claim, or controversy arising out of or relating to these Terms or the use of the Platform shall be resolved by binding arbitration administered by JAMS in Los Angeles County, California, under its Comprehensive Arbitration Rules. Judgment on the award may be entered in any court having jurisdiction.
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              The exclusive venue for any action not subject to arbitration shall be the state and federal courts located in Los Angeles County, California. You and PortraitPay AI hereby consent to the personal jurisdiction of such courts.
            </p>
          </section>

          {/* Section 13: Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.changesToTerms}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.changesToTermsDesc}
            </p>
          </section>

          {/* Section 14: Contact Us */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{l.sections.contactUs}</h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {l.sections.contactUsDesc}
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