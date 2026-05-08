"""
Rewrite en-US block in translations.ts - Step 2 homepage copy rewrite
"""
import re

with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Define replacements for en-US block only
# We work within the "en-US" block by finding its boundaries
en_start = content.index('"en-US":')
# Find the closing brace of the en-US object by counting braces
depth = 0
i = en_start
while i < len(content):
    if content[i] == '{':
        depth += 1
    elif content[i] == '}':
        depth -= 1
        if depth == 0:
            en_end = i + 1
            break
    i += 1

en_block = content[en_start:en_end]

# === Hero section replacements ===
replacements = [
    # Hero
    ('badge: "Now on Ethereum Sepolia"', 'badge: "Beta Now Live in LA"'),
    ('headline: "Your Portrait\\nYour Rights"', 'headline: "Create AI Actors\\nWith Verified Consent"'),
    ('sub: "Register your portrait rights on the Ethereum blockchain with immutable timestamps and smart-contract licensing. Own your image identity 鈥?once and for all."',
     'sub: "For LA actors and creators: collect consent, define usage rights, and generate a verifiable license packet before creating digital human videos."'),
    ('cta1: "Start Free 鈥?Register Now"',
     'cta1: "For Actors: Create Free Consent Passport"'),
    ('cta2: "See How It Works"',
     'cta2: "For Creators: Verify a License"'),

    # Features title/sub
    ('title: "Everything you need to protect your portrait rights"',
     'title: "Complete consent management for digital human creation"'),
    ('sub: "From upload to on-chain certification in minutes. Fully automated, cryptographically secure."',
     'sub: "Built for actors, creators, and legal professionals working with AI-generated content."'),

    # Feature 1
    ('feature1Title: "Blockchain Certification"',
     'feature1Title: "Actor Consent Passport"'),
    ('feature1Desc: "Mint your portrait as an on-chain asset on Sepolia. Immutable timestamps, tamper-proof records."',
     'feature1Desc: "Create a verifiable consent profile that defines what uses are allowed and prohibited."'),

    # Feature 2
    ('feature2Title: "Cloud Storage"',
     'feature2Title: "Usage Scope & Prohibited Uses"'),
    ('feature2Desc: "Your portrait and metadata stored securely in the cloud 鈥?redundant and always accessible."',
     'feature2Desc: "Precisely define permitted uses, platforms, duration, and explicit exclusions."'),

    # Feature 3
    ('feature3Title: "Smart Licensing"',
     'feature3Title: "Verifiable License Packet"'),
    ('feature3Desc: "Define who can use your portrait, for how long, and at what price. Enforced automatically by smart contract."',
     'feature3Desc: "Download a timestamped, tamper-evident license agreement for each authorization."'),

    # Feature 4
    ('feature4Title: "Royalty Collection"',
     'feature4Title: "Lawyer Review Lite"'),
    ('feature4Desc: "Earn automatically when your portrait is licensed. Every transaction routed through smart contract with split ratios."',
     'feature4Desc: "Optional professional review of your consent terms before sharing."'),

    # Feature 5
    ('feature5Title: "Blockchain Timestamp"',
     'feature5Title: "Creator Verification Page"'),
    ('feature5Desc: "Your portrait image hash + timestamp are recorded on the Sepolia blockchain, building a complete evidence chain."',
     'feature5Desc: "Public-facing page for creators to verify an actor consent status before publishing."'),

    # Feature 6
    ('feature6Title: "KYC Verified Profiles"',
     'feature6Title: "Privacy-first Evidence Record"'),
    ('feature6Desc: "Enterprise-grade identity verification for celebrities, artists, and public figures. Whitelisted on-chain."',
     'feature6Desc: "Securely stored, tamper-evident records of consent. Your photos and biometric data are never published."'),

    # How it Works
    ('title: "From portrait to protected asset in 4 steps"',
     'title: "Simple, fast, built for LA"'),
    ('sub: "No crypto expertise required. We handle the blockchain complexity 鈥?you keep control."',
     'sub: "Create a consent passport in minutes. No wallet, no crypto required."'),
    ('step1: "Upload Portrait"',
     'step1: "Create Profile"'),
    ('step1Desc: "Upload a clear, high-resolution portrait. We detect faces automatically and crop for you."',
     'step1Desc: "Upload your portrait and create a basic consent profile. Takes 2 minutes."'),
    ('step2: "Complete KYC"',
     'step2: "Set Permissions"'),
    ('step2Desc: "Verify your identity to unlock enterprise licensing and increase your profile trust score."',
     'step2Desc: "Define allowed uses, prohibited uses, platforms, and duration for your likeness."'),
    ('step3: "Certify On-Chain"',
     'step3: "Sign Consent"'),
    ('step3Desc: "One-click mint on Sepolia. Your portrait hash, metadata, and timestamp are permanently recorded."',
     'step3Desc: "Sign the consent agreement and get a timestamped verification record."'),
    ('step4: "License & Earn"',
     'step4: "Share & Verify"'),
    ('step4Desc: "Set terms. Accept license requests, collect royalties, withdraw earnings 鈥?all handled automatically."',
     'step4Desc: "Share your verification link. Creators verify your consent before publishing."'),

    # Steps array within howItWorks
    ('step: "01"', 'step: "1"'),
    ('title: "Upload Portrait"',
     'title: "Create Profile"'),
    ('title: "Complete KYC"',
     'title: "Set Permissions"'),
    ('title: "Certify On-Chain"',
     'title: "Sign Consent"'),
    ('title: "License & Earn"',
     'title: "Share & Verify"'),
    ('desc: "Upload a clear, high-resolution portrait. We detect faces automatically and crop for you."',
     'desc: "Upload your portrait and create a basic consent profile. Takes 2 minutes."'),
    ('desc: "Verify your identity to unlock enterprise licensing and increase your profile trust score."',
     'desc: "Define allowed uses, prohibited uses, platforms, and duration for your likeness."'),
    ('desc: "One click to mint on Sepolia. Your portrait hash, metadata, and timestamp permanently recorded."',
     'desc: "Sign the consent agreement and get a timestamped verification record."'),
    ('desc: "Set your terms. Accept license requests, collect royalties, withdraw earnings 鈥?all from your dashboard."',
     'desc: "Share your verification link. Creators verify your consent before publishing."'),

    # Pricing
    ('title: "Simple, transparent pricing"',
     'title: "Beta Free during testing"'),
    ('sub: "Start free. Scale as you grow. No hidden fees."',
     'sub: "All features are free during our LA beta. No credit card required."'),
    ('freeTitle: "Free"',
     'freeTitle: "Beta Free"'),
    ('freeDesc: "For individual creators getting started"',
     'freeDesc: "For actors and creators in LA"'),
    ('freeLi1: "5 portrait uploads"',
     'freeLi1: "Free actor consent passport"'),
    ('freeLi2: "Basic KYC (self-attested)"',
     'freeLi2: "Free basic verification link"'),
    ('freeLi3: "Community support"',
     'freeLi3: "Free license packet draft"'),
    ('proTitle: "Pro"',
     'proTitle: "Beta Free"'),
    ('proPrice: "$0"',
     'proPrice: "$0"'),
    ('proDesc: "For professional artists and influencers"',
     'proDesc: "All features included during beta"'),
    ('proLi1: "Unlimited portraits"',
     'proLi1: "Free actor consent passport"'),
    ('proLi2: "Full KYC verification"',
     'proLi2: "Free basic verification link"'),
    ('proLi3: "Priority support"',
     'proLi3: "Free license packet draft"'),
    ('proLi4: "Smart contract licensing"',
     'proLi4: "Optional lawyer review (coming soon)"'),
    ('proLi5: "Real-time earnings dashboard"',
     'proLi5: "Creator verification page"'),
    ('proLi6: "Secure cloud storage"',
     'proLi6: "Privacy-first evidence record"'),
    ('contactTitle: "Enterprise"',
     'contactTitle: "Beta Free"'),
    ('contactPrice: "Custom"',
     'contactPrice: "$0"'),
    ('contactDesc: "For agencies and entertainment companies"',
     'contactDesc: "Contact us for enterprise features"'),
    ('contactLi1: "Everything in Pro"',
     'contactLi1: "Multi-artist management"'),
    ('contactLi2: "Multi-artist management"',
     'contactLi2: "Custom licensing terms"'),
    ('contactLi3: "White-label certificates"',
     'contactLi3: "API access (coming soon)"'),
    ('contactLi4: "Dedicated account manager"',
     'contactLi4: "Dedicated account manager"'),
    ('contactLi5: "Custom licensing terms"',
     'contactLi5: "Priority support"'),
    ('contactLi6: "API access"',
     'contactLi6: "Enterprise SLA"'),
    ('proBadge: "Most Popular"',
     'proBadge: "All features included"'),

    # Plans array
    ('name: "Free"',
     'name: "Beta Free"'),
    ('name: "Pro"',
     'name: "Beta Free"'),
    ('name: "Enterprise"',
     'name: "Beta Free"'),
    ('period: "forever"',
     'period: "during beta"'),
    ('period: " / month"',
     'period: "during beta"'),

    # FAQ
    ('q1: "What is portrait rights certification?"',
     'q1: "What does PortraitPay AI do?"'),
    ('a1: "Portrait rights certification records your portrait\'s existence, authorship, and timestamp on the Ethereum blockchain. This creates an immutable, legally admissible proof of when and by whom the portrait was created."',
     'a1: "PortraitPay AI helps actors and creators manage consent for AI-generated digital humans. Create a consent passport, define usage rights, and generate verifiable license packets before creating digital human videos."'),
    ('q2: "Do I need cryptocurrency to use PortraitPay?"',
     'q2: "Do I need a crypto wallet to use PortraitPay?"'),
    ('a2: "No. We handle all gas fees for certification. You can link PayPal or bank account for withdrawals. No wallet setup required."',
     'a2: "No. PortraitPay does not require any cryptocurrency or wallet. Sign up with email."'),
    ('q3: "How does blockchain timestamping work?"',
     'q3: "How does the verification record work?"'),
    ('a3: "Blockchain timestamping builds a legal evidence chain for your portrait: when you upload a portrait, the system computes an image hash and records it together with a timestamp and face embedding on the Sepolia blockchain, while Anyone can verify the portrait\'s existence time, authorship, and integrity via the blockchain."',
     'a3: "Verification records store consent status and metadata with timestamps. We do not publish photos or biometric templates on-chain. Parties and counsel can verify the consent status via a secure link."'),
    ('q4: "What is KYC and why do I need it?"',
     'q4: "What is identity verification for?"'),
    ('a4: "KYC (Know Your Customer) verifies your identity to prevent fraud. For public figures and celebrities, full KYC is required to certify portraits and access enterprise licensing features."',
     'a4: "Identity verification helps build trust between actors and creators. Full verification is required for certain high-value licensing workflows."'),
    ('q5: "Can enterprises bulk-register their artists?"',
     'q5: "Can agencies manage multiple artists?"'),
    ('a5: "Yes. Enterprise plans include agency dashboards for managing multiple artists, batch portrait uploads, and group licensing agreements."',
     'a5: "Agency accounts are coming soon. Contact us if you need multi-artist management."'),

    # FAQ items array
    ('q: "What is portrait rights certification?"',
     'q: "What does PortraitPay AI do?"'),
    ('a: "Portrait rights certification records your portrait\'s existence, authorship, and timestamp on the Ethereum blockchain. This creates an immutable, legally admissible proof of when and by whom the portrait was created."',
     'a: "PortraitPay AI helps actors and creators manage consent for AI-generated digital humans. Create a consent passport, define usage rights, and generate verifiable license packets before creating digital human videos."'),
    ('q: "Do I need cryptocurrency to use PortraitPay?"',
     'q: "Do I need a crypto wallet to use PortraitPay?"'),
    ('a: "No. We handle all gas fees for certification. You can link PayPal or bank account for withdrawals. No wallet setup required."',
     'a: "No. PortraitPay does not require any cryptocurrency or wallet. Sign up with email."'),
    ('q: "How does blockchain timestamping work?"',
     'q: "How does the verification record work?"'),
    ('a: "Blockchain timestamping builds a legal evidence chain for your portrait: when you upload a portrait, the system computes an image hash and records it together with a timestamp and face embedding on the Sepolia blockchain, while Anyone can verify the portrait\'s existence time, authorship, and integrity via the blockchain."',
     'a: "Verification records store consent status and metadata with timestamps. We do not publish photos or biometric templates on-chain. Parties and counsel can verify consent status via a secure link."'),
    ('q: "What is KYC and why do I need it?"',
     'q: "What is identity verification for?"'),
    ('a: "KYC (Know Your Customer) verifies your identity to prevent fraud. For public figures and celebrities, full KYC is required to certify portraits and access enterprise licensing features."',
     'a: "Identity verification helps build trust between actors and creators. Full verification is required for certain high-value licensing workflows."'),
    ('q: "Can enterprises bulk-register their artists?"',
     'q: "Can agencies manage multiple artists?"'),
    ('a: "Yes. Enterprise plans include agency dashboards for managing multiple artists, batch portrait uploads, and group licensing agreements."',
     'a: "Agency accounts are coming soon. Contact us if you need multi-artist management."'),

    # CTA section
    ('title: "Ready to own your portrait rights?"',
     'title: "Give Actors Control Over Their Likeness in the AI Era"'),
    ('sub: "Join thousands of creators today and protect your image identity on the blockchain."',
     'sub: "PortraitPay AI helps actors and creators manage consent for AI-generated digital humans."'),

    # Footer
    ('copyright: "漏 2026 PortraitPay AI. All rights reserved."',
     'copyright: "© 2026 PortraitPay AI. All rights reserved. Beta product."'),
]

# Apply replacements to en_block
for old, new in replacements:
    if old in en_block:
        en_block = en_block.replace(old, new)
        print(f'OK: {old[:50]}...')
    else:
        print(f'MISS: {old[:60]}')

# Reconstruct file
new_content = content[:en_start] + en_block + content[en_end:]

with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('\nDone!')