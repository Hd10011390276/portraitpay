"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import { translations } from "@/lib/i18n/translations";

// ─── Icons (inline SVG) ─────────────────────────────────────────
type IconProps = { className?: string; style?: React.CSSProperties };
const IconShield = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
const IconLock = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconGlobe = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconZap = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconBarChart = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconUsers = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconArrowRight = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconCheck = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconChevronDown = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconFace = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round"/>
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);
const IconChain = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IconMoney = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

// ─── FAQ Accordion Item (Expanded by default) ─────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "20px", marginBottom: "20px" }}>
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
          {question}
        </span>
      </div>
      <div>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

// ─── Step Item ──────────────────────────────────────────────────
function StepItem({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
      <div style={{
        width: "56px", height: "56px",
        borderRadius: "var(--radius-full)",
        background: "var(--accent-light)",
        border: "2px solid var(--accent-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px", fontWeight: 700,
        color: "var(--accent-primary)",
        flexShrink: 0,
      }}>
        {number}
      </div>
      <div>
        <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>{title}</h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── Feature Card ───────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{
        width: "44px", height: "44px",
        borderRadius: "var(--radius-md)",
        background: "var(--accent-light)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--accent-primary)",
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>{title}</h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.65 }}>{desc}</p>
      </div>
    </div>
  );
}


// ─── Pricing Card ────────────────────────────────────────────────
function PricingCard({ title, price, period, desc, features, cta, badge, highlighted }: {
  title: string; price: string; period?: string; desc: string;
  features: string[]; cta: string; badge?: string; highlighted?: boolean;
}) {
  return (
    <div style={{
      background: highlighted ? "var(--accent-primary)" : "var(--surface)",
      border: highlighted ? "none" : "1px solid var(--border-default)",
      borderRadius: "var(--radius-xl)",
      padding: "32px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      boxShadow: highlighted ? "var(--shadow-lg)" : "var(--shadow-sm)",
      flex: 1,
    }}>
      {badge && (
        <span className="badge" style={{
          background: highlighted ? "rgba(255,255,255,0.2)" : "var(--accent-light)",
          color: highlighted ? "white" : "var(--accent-primary)",
          alignSelf: "flex-start",
        }}>
          {badge}
        </span>
      )}
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: highlighted ? "white" : "var(--text-primary)", marginBottom: "4px" }}>
          {title}
        </h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
          <span style={{ fontSize: "40px", fontWeight: 700, color: highlighted ? "white" : "var(--text-primary)", letterSpacing: "-0.03em" }}>
            {price}
          </span>
          {period && (
            <span style={{ fontSize: "14px", color: highlighted ? "rgba(255,255,255,0.7)" : "var(--text-tertiary)" }}>
              /{period}
            </span>
          )}
        </div>
        <p style={{ fontSize: "14px", color: highlighted ? "rgba(255,255,255,0.75)" : "var(--text-secondary)" }}>
          {desc}
        </p>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: highlighted ? "white" : "var(--text-secondary)" }}>
            <span style={{ color: highlighted ? "white" : "var(--success)", flexShrink: 0, marginTop: "1px" }}>
              <IconCheck className="w-4 h-4" />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link href="/register" style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 24px",
        borderRadius: "var(--radius-md)",
        fontSize: "15px",
        fontWeight: 600,
        textDecoration: "none",
        transition: "all 150ms ease-out",
        background: highlighted ? "white" : "var(--accent-primary)",
        color: highlighted ? "var(--accent-primary)" : "white",
      }}>
        {cta}
      </Link>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function HomePage() {
  const { locale } = useLanguage();
  const t = locale === "zh-CN" ? translations["zh-CN"] : translations["en-US"];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-headline { animation: fadeUp 0.5s ease-out forwards; }
        .hero-sub { animation: fadeUp 0.5s 0.1s ease-out both; }
        .hero-cta { animation: fadeUp 0.5s 0.2s ease-out both; }
        .hero-stats { animation: fadeUp 0.5s 0.3s ease-out both; }
        .section-fade { opacity: 0; transform: translateY(16px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
        .section-fade.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* ── Navigation ─────────────────────────────────────── */}
      <header className="nav-glass" style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>PortraitPay AI</span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: "32px" }} className="hidden-mobile">
            <a href="#features" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}
               onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
               onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{t.nav.features}</a>
            <a href="#how-it-works" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}
               onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
               onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{t.nav.howItWorks}</a>
            <a href="#pricing" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}
               onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
               onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{t.nav.pricing}</a>
            <a href="#faq" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}
               onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
               onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{t.nav.faq}</a>
            <a href="/enterprise/lawyer-registration" style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent-primary)", textDecoration: "none", padding: "6px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-primary)", transition: "all 150ms" }}
               onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-primary)"; e.currentTarget.style.color = "white"; }}
               onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent-primary)"; }}>{t.nav.lawyer}</a>
            <a href="/lawyers" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}
               onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
               onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>{t.nav.findLawyer}</a>
          </nav>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="btn btn-secondary btn-sm hidden-mobile">{t.nav.signIn}</Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────── */}
        <section style={{
          background: "var(--bg-primary)",
          padding: "120px 0 96px",
          textAlign: "center",
        }}>
          <div className="container">
            {/* Badge */}
            <div className="hero-headline" style={{ marginBottom: "24px" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                background: "var(--accent-light)",
                border: "1px solid rgba(37,99,235,0.15)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--accent-primary)",
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-primary)", display: "inline-block" }} />
                {t.hero.badge}
              </span>
            </div>

            {/* Headline */}
            <h1 className="hero-headline" style={{
              fontSize: "var(--text-hero)",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginBottom: "24px",
              maxWidth: "720px",
              whiteSpace: "pre-line",
              margin: "0 auto 24px",
            }}>
              {t.hero.headline}
            </h1>

            {/* Sub */}
            <p className="hero-sub" style={{
              fontSize: "18px",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
              maxWidth: "560px",
              margin: "0 auto 40px",
            }}>
              {t.hero.sub}
            </p>

            {/* CTAs */}
            <div className="hero-cta" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "64px" }}>
              <Link href="/register" className="btn btn-primary btn-lg">
                {t.hero.cta1}
              </Link>
              <Link href="#how-it-works" className="btn btn-secondary btn-lg">
                {t.hero.cta2}
                <span style={{ width: "16px", height: "16px", display: "inline-flex", flexShrink: 0 }}><IconArrowRight /></span>
              </Link>
            </div>

            </div>
        </section>

        {/* ── Features ───────────────────────────────────────── */}
        <section id="features" style={{ background: "var(--bg-secondary)", padding: "96px 0" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <p className="text-overline" style={{ marginBottom: "12px" }}>Features</p>
              <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
                {t.features.title}
              </h2>
              <p style={{ fontSize: "17px", color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto" }}>
                {t.features.sub}
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}>
              <FeatureCard
                icon={<IconShield style={{ width: "22px", height: "22px" }} />}
                title={t.features.feature1Title}
                desc={t.features.feature1Desc}
              />
              <FeatureCard
                icon={<IconChain style={{ width: "22px", height: "22px" }} />}
                title={t.features.feature2Title}
                desc={t.features.feature2Desc}
              />
              <FeatureCard
                icon={<IconLock style={{ width: "22px", height: "22px" }} />}
                title={t.features.feature3Title}
                desc={t.features.feature3Desc}
              />
              <FeatureCard
                icon={<IconMoney style={{ width: "22px", height: "22px" }} />}
                title={t.features.feature4Title}
                desc={t.features.feature4Desc}
              />
              <FeatureCard
                icon={<IconBarChart style={{ width: "22px", height: "22px" }} />}
                title={t.features.feature5Title}
                desc={t.features.feature5Desc}
              />
              <FeatureCard
                icon={<IconUsers style={{ width: "22px", height: "22px" }} />}
                title={t.features.feature6Title}
                desc={t.features.feature6Desc}
              />
            </div>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────── */}
        <section id="how-it-works" style={{ background: "var(--bg-primary)", padding: "96px 0" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <p className="text-overline" style={{ marginBottom: "12px" }}>How it Works</p>
              <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
                {t.howItWorks.title}
              </h2>
              <p style={{ fontSize: "17px", color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto" }}>
                {t.howItWorks.sub}
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "32px",
              position: "relative",
            }}>
              {/* Connector lines (desktop only) */}
              <div style={{
                position: "absolute",
                top: "28px",
                left: "10%",
                right: "10%",
                height: "1px",
                background: "var(--border-default)",
                zIndex: 0,
                display: "none",
              }} className="hidden-mobile" />

              <StepItem number="1" title={t.howItWorks.step1} desc={t.howItWorks.step1Desc} />
              <StepItem number="2" title={t.howItWorks.step2} desc={t.howItWorks.step2Desc} />
              <StepItem number="3" title={t.howItWorks.step3} desc={t.howItWorks.step3Desc} />
              <StepItem number="4" title={t.howItWorks.step4} desc={t.howItWorks.step4Desc} />
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────── */}
        <section id="pricing" style={{ background: "var(--bg-secondary)", padding: "96px 0" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <p className="text-overline" style={{ marginBottom: "12px" }}>Pricing</p>
              <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "16px" }}>
                {t.pricing.title}
              </h2>
              <p style={{ fontSize: "17px", color: "var(--text-secondary)", maxWidth: "520px", margin: "0 auto" }}>
                {t.pricing.sub}
              </p>
            </div>

            <div style={{
              display: "flex",
              gap: "24px",
              maxWidth: "800px",
              margin: "0 auto",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
              <PricingCard
                title={t.pricing.freeTitle}
                price={t.pricing.freePrice}
                period={t.pricing.freePeriod}
                desc={t.pricing.freeDesc}
                features={[
                  t.pricing.freeLi1,
                  t.pricing.freeLi2,
                  t.pricing.freeLi3,
                ]}
                cta={t.nav.getStarted}
              />
              <PricingCard
                title={t.pricing.proTitle}
                price={t.pricing.proPrice}
                desc={t.pricing.proDesc}
                features={[
                  t.pricing.proLi1,
                  t.pricing.proLi2,
                  t.pricing.proLi3,
                ]}
                cta={t.pricing.contactUs}
                badge={t.pricing.proBadge}
                highlighted
              />
            </div>
          </div>
        </section>

        {/* ── Lawyer Section ─────────────────────────────────────── */}
        <section style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1a3a5c 100%)",
          padding: "80px 0",
        }}>
          <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🏛️</div>
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>
              {t.lawyerSection.title}
            </h2>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.75)", maxWidth: "540px", lineHeight: 1.65 }}>
              {t.lawyerSection.desc}
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <a href="/enterprise/lawyer-registration" className="btn btn-lg" style={{
                background: "white",
                color: "#1e3a5f",
                fontWeight: 700,
                borderRadius: "var(--radius-lg)",
                padding: "14px 32px",
                fontSize: "15px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 150ms",
              }}>
                {t.lawyerSection.applyNow}
              </a>
              <a href="/enterprise" className="btn btn-lg" style={{
                background: "transparent",
                color: "white",
                fontWeight: 600,
                borderRadius: "var(--radius-lg)",
                padding: "14px 32px",
                fontSize: "15px",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}>
                {t.lawyerSection.learnMore}
              </a>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
              {t.lawyerSection.footer}
            </p>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────── */}
        <section id="faq" style={{ background: "var(--bg-primary)", padding: "96px 0" }}>
          <div className="container" style={{ maxWidth: "720px" }}>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <p className="text-overline" style={{ marginBottom: "12px" }}>FAQ</p>
              <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                {t.faq.title}
              </h2>
            </div>

            <div>
              <FAQItem question={t.faq.q1} answer={t.faq.a1} />
              <FAQItem question={t.faq.q2} answer={t.faq.a2} />
              <FAQItem question={t.faq.q3} answer={t.faq.a3} />
              <FAQItem question={t.faq.q4} answer={t.faq.a4} />
              <FAQItem question={t.faq.q5} answer={t.faq.a5} />
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────── */}
        <section style={{
          background: "var(--bg-secondary)",
          padding: "96px 0",
          textAlign: "center",
        }}>
          <div className="container">
            <div style={{
              maxWidth: "560px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
            }}>
              <h2 style={{
                fontSize: "var(--text-h2)",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}>
                {t.cta.title}
              </h2>
              <p style={{ fontSize: "17px", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                {t.cta.sub}
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                <Link href="/register" className="btn btn-primary btn-lg">
                  {t.cta.cta1}
                </Link>
                <Link href="/login" className="btn btn-secondary btn-lg">
                  {t.cta.cta2}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer style={{
          background: "var(--bg-primary)",
          borderTop: "1px solid var(--border-default)",
          padding: "40px 0",
        }}>
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img
                src="/logo.png"
                alt="PortraitPay AI Logo"
                className="logo-light"
                style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }}
              />
              <img
                src="/logo-dark.png"
                alt="PortraitPay AI Logo"
                className="logo-dark"
                style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }}
              />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                PortraitPay AI
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0 }}>
              {t.footer.copyright}
            </p>
            <div style={{ display: "flex", gap: "24px" }}>
              <Link href="/privacy" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{t.footer.privacy}</Link>
              <Link href="/terms" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{t.footer.terms}</Link>
              <Link href="/contact" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{t.footer.contact}</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}


