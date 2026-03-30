import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PortraitPay AI" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-gray-900 dark:text-white">PortraitPay AI</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {["Features", "How it Works", "Pricing", "FAQ"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login"
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/register"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/20 -z-10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200 dark:bg-purple-900/10 rounded-full blur-3xl -z-10 opacity-40" />
        <div className="absolute top-40 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 opacity-40" />

        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              Now live on Ethereum Sepolia Testnet
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
              Your Portrait.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Rights.
              </span>
              <br />
              On Chain.
            </h1>

            {/* Sub */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Register your portrait rights on the Ethereum blockchain with
              immutable timestamps, IPFS storage, and smart-contract licensing.
              Own your image identity — once and for all.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5">
                Start Free — Register Now
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 hover:-translate-y-0.5">
                See How It Works
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-col items-center gap-3 pt-4">
              <div className="flex -space-x-2">
                {["JD", "MW", "SK", "AL", "RK"].map(( initials, i) => (
                  <div key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-950">
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">2,400+</span> artists and creators registered
              </p>
            </div>
          </div>

          {/* Hero visual */}
          <div className="mt-16 max-w-4xl mx-auto relative">
            <div className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 text-center text-xs text-gray-400">PortraitPay Dashboard</div>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Portraits Certified", value: "24", delta: "+3" },
                  { label: "Total Earnings", value: "¥12,840", delta: "+¥1,200" },
                  { label: "Pending Authorizations", value: "5", delta: "" },
                  { label: "Blockchain Status", value: "✅ Live", delta: "" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    {stat.delta && <p className="text-xs text-green-600 mt-0.5">{stat.delta}</p>}
                  </div>
                ))}
              </div>
              <div className="p-6 pt-0 grid grid-cols-3 gap-4">
                {[
                  { title: "Portrait of Jane D.", status: "✅ Certified On-chain", tx: "0x7a3f...c9e2" },
                  { title: "Artist Portrait — M.W.", status: "🔍 Under Review", tx: "" },
                  { title: "Celebrity Portrait — S.K.", status: "✅ Certified On-chain", tx: "0xb2d1...f8a0" },
                ].map((card) => (
                  <div key={card.title} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center text-3xl">👤</div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{card.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.status}</p>
                      {card.tx && <p className="text-xs font-mono text-gray-400 mt-1">{card.tx}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to protect your portrait rights
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              From upload to on-chain certification in minutes. Fully automated,
              cryptographically secure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🔗",
                title: "Blockchain Certification",
                desc: "Mint your portrait as an on-chain asset on Ethereum Sepolia. Immutable timestamps, tamper-proof records.",
                color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
                border: "border-purple-200 dark:border-purple-800",
              },
              {
                icon: "🖼️",
                title: "IPFS Storage",
                desc: "Your portrait and metadata stored on IPFS — decentralized, redundant, and censorship-resistant forever.",
                color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
                border: "border-blue-200 dark:border-blue-800",
              },
              {
                icon: "📋",
                title: "Smart Licensing",
                desc: "Define who can use your portrait, for how long, and at what price. Enforced automatically by smart contract.",
                color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
                border: "border-green-200 dark:border-green-800",
              },
              {
                icon: "💰",
                title: "Royalty Collection",
                desc: "Earn automatically when your portrait is licensed. Every transaction routed through smart contract with split ratios.",
                color: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
                border: "border-yellow-200 dark:border-yellow-800",
              },
              {
                icon: "👁️",
                title: "Infringement Detection",
                desc: "AI-powered image scanning monitors the web for unauthorized use of your certified portraits 24/7.",
                color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
                border: "border-red-200 dark:border-red-800",
              },
              {
                icon: "🔐",
                title: "KYC Verified Profiles",
                desc: "Enterprise-grade identity verification for celebrities, artists, and public figures. Whitelisted on-chain.",
                color: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20",
                border: "border-indigo-200 dark:border-indigo-800",
              },
            ].map((feature) => (
              <div key={feature.title}
                className={`bg-gradient-to-br ${feature.color} rounded-2xl p-6 border ${feature.border} hover:shadow-lg transition-shadow`}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              From portrait to protected asset in 4 steps
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No crypto expertise required. We handle the blockchain complexity — you keep control.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", icon: "📤", title: "Upload Portrait", desc: "Upload a clear, high-resolution portrait. We detect faces automatically and crop for you." },
              { step: "02", icon: "🔍", title: "Complete KYC", desc: "Verify your identity to unlock enterprise licensing and increase your profile trust score." },
              { step: "03", icon: "🔗", title: "Certify On-Chain", desc: "One click to mint on Ethereum Sepolia. Your portrait hash, metadata, and timestamp permanently recorded." },
              { step: "04", icon: "💎", title: "License & Earn", desc: "Set your terms. Accept license requests, collect royalties, withdraw earnings — all from your dashboard." },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-gray-300 dark:from-gray-700 to-transparent -translate-x-1/2" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-3xl shadow-sm">
                      {item.icon}
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Start free. Scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "¥0",
                period: "forever",
                desc: "For individual creators getting started",
                features: ["5 portrait uploads", "Basic KYC (self-attested)", "Community support", "Standard licensing"],
                cta: "Get Started",
                highlight: false,
              },
              {
                name: "Pro",
                price: "¥99",
                period: "/ month",
                desc: "For professional artists and influencers",
                features: ["Unlimited portraits", "Full KYC verification", "Priority support", "Smart contract licensing", "Real-time earnings dashboard", "IPFS permanent storage"],
                cta: "Start Pro Trial",
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "For agencies and entertainment companies",
                features: ["Everything in Pro", "Multi-artist management", "White-label certificates", "Dedicated account manager", "Custom licensing terms", "API access"],
                cta: "Contact Sales",
                highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name}
                className={`rounded-2xl p-8 border-2 transition-shadow hover:shadow-xl
                  ${plan.highlight
                    ? "bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-gray-900 border-blue-500 dark:border-blue-500 shadow-lg"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg"
                  }`}>
                {plan.highlight && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block w-full text-center px-6 py-3 rounded-xl font-semibold transition-all
                    ${plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "What is portrait rights certification?",
                a: "Portrait rights certification records your portrait's existence, authorship, and timestamp on the Ethereum blockchain. This creates an immutable, legally admissible proof of when and by whom the portrait was created.",
              },
              {
                q: "Do I need cryptocurrency to use PortraitPay?",
                a: "No. We handle all gas fees for certification. You can link a Chinese bank account or Alipay/WeChat Pay for withdrawals. No wallet setup required.",
              },
              {
                q: "How does the AI infringement detection work?",
                a: "Our AI scans websites, social media, and stock photo platforms using face recognition + visual similarity. When a match is found above your threshold, you receive an alert and evidence package.",
              },
              {
                q: "What is KYC and why do I need it?",
                a: "KYC (Know Your Customer) verifies your identity to prevent fraud. For public figures and celebrities, full KYC is required to certify portraits and access enterprise licensing features.",
              },
              {
                q: "Can enterprises bulk-register their artists?",
                a: "Yes. Enterprise plans include agency dashboards for managing multiple artists, batch portrait uploads, and group licensing agreements.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-gray-900 dark:text-white font-medium">
                  {faq.q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white" />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to own your portrait rights?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of creators protecting their image identity on the blockchain today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
                Start Free Today
              </Link>
              <Link href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PortraitPay AI" className="w-7 h-7 rounded-lg" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">© 2026 PortraitPay AI. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Contact"].map((link) => (
              <a key={link} href="#"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
