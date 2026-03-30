import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "PortraitPay AI Terms of Service — User terms and conditions, payment terms, KYC data deletion instructions, and GDPR/PIPL compliance notes.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-600">
            <img src="/logo.png" alt="PortraitPay AI" className="w-7 h-7 rounded-lg" />
            PortraitPay AI
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 30, 2026 · Effective immediately</p>

        {/* Beta Notice */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
          <p className="text-blue-700 text-sm font-medium">⚠️ Beta Notice</p>
          <p className="text-blue-600 text-sm mt-1">PortraitPay AI is currently in Beta on Ethereum Sepolia Testnet. All transactions are on testnet only — no real currency is involved until mainnet launch.</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              By accessing or using PortraitPay AI (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Service. These Terms constitute a legally binding agreement between you (&ldquo;User&rdquo;) and PortraitPay AI (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Service Description</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              PortraitPay AI provides a platform for registering, certifying, and licensing portrait rights on the Ethereum blockchain. Services include:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Portrait upload and KYC identity verification</li>
              <li>Blockchain certification via smart contracts on Ethereum Sepolia</li>
              <li>IPFS-based metadata storage</li>
              <li>AI-powered infringement detection</li>
              <li>Licensing management between portrait owners and licensees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              You must be at least 18 years old (or the age of legal majority in your jurisdiction) to use the Service. Users under 18 require verified parental or guardian consent. Enterprise accounts require valid business registration. We reserve the right to suspend accounts that do not meet eligibility requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Portrait Rights & Ownership</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">By uploading a portrait to PortraitPay AI, you represent and warrant that:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>You own the portrait or have explicit permission from the portrait subject</li>
              <li>The portrait does not infringe third-party intellectual property, privacy, or publicity rights</li>
              <li>You have the legal capacity to enter into this agreement</li>
              <li>For celebrities/public figures: you are the subject or their authorized agent</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mt-4">
              <p className="text-yellow-700 text-sm"><strong>Note:</strong> Uploading another person&apos;s portrait without consent may violate privacy laws (including China&apos;s PIPL) and could result in legal liability.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. KYC (Know Your Customer)</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              PortraitPay AI performs identity verification to ensure authenticity of portrait rights claims. KYC data is processed by authorized third-party providers and handled per our <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>. You agree to provide accurate, current information and update it promptly. False KYC information may result in account termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Blockchain Certification</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Portrait certification on Ethereum Sepolia creates an immutable timestamp and record. This record is intended as evidence of existence and authorship — it does not constitute legal title or guarantee legal enforceability in all jurisdictions. We do not guarantee blockchain records will be admitted as evidence in any particular court.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Licensing & Smart Contracts</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Portrait owners may set licensing terms through our smart contract system. Licensees agree to the terms set by the portrait owner. PortraitPay AI takes a 1% platform fee on all transactions. Unauthorized use of a certified portrait constitutes a violation of these Terms and may trigger infringement alerts and legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Payment Terms</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-3">
              <li><strong>Platform Fee:</strong> 1% of each transaction, deducted automatically by smart contract</li>
              <li><strong>Portrait Owner Share:</strong> 99% of licensing revenue, credited to account balance</li>
              <li><strong>Minimum Withdrawal:</strong> ¥100 (CNY)</li>
              <li><strong>Withdrawal Time:</strong> 1–3 business days after approval</li>
              <li><strong>Supported Methods:</strong> Chinese bank transfer, Alipay, WeChat Pay</li>
            </ul>
            <p className="text-gray-600 text-sm leading-relaxed">All fees displayed in CNY. International users may see USD equivalents. Currency conversion rates are provided by third-party providers and may vary.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. User Conduct</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Upload portraits without the subject&apos;s consent</li>
              <li>Use the platform for any illegal purpose</li>
              <li>Attempt to manipulate the smart contract or blockchain records</li>
              <li>Use automated bots or scraping tools against the platform</li>
              <li>Harass, defame, or impersonate others using the platform</li>
              <li>Upload content that violates applicable laws (CSL, PIPL, GDPR, and equivalents)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. KYC Data Deletion Process</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">You may request deletion of your personal data at any time. To request data deletion:</p>
            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2 mb-3">
              <li>Log in to your PortraitPay AI account at portraitpayai.com</li>
              <li>Navigate to <strong>Settings → Privacy → Delete My Data</strong></li>
              <li>Submit a deletion request</li>
              <li>Our team will process the request within <strong>15 business days</strong></li>
            </ol>
            <p className="text-gray-600 text-sm leading-relaxed">
              For accounts with pending transactions or disputes, deletion may be delayed until resolution. Blockchain records (transaction hashes) cannot be deleted as they are permanent by design — however, they do not contain raw portrait data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Disclaimer & Limitation of Liability</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              PortraitPay AI provides the Service &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee uninterrupted or error-free service. We are not liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount of fees paid by you in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the People&apos;s Republic of China, without regard to conflict of law provisions. Disputes shall be subject to the exclusive jurisdiction of the courts of Shanghai, China.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may update these Terms from time to time. Material changes will be communicated via email and platform notification. Continued use after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Us</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              For questions about these Terms, please contact us at <a href="mailto:legal@portraitpayai.com" className="text-purple-600 hover:underline">legal@portraitpayai.com</a> or visit our <Link href="/contact" className="text-purple-600 hover:underline">Contact page</Link>.
            </p>
          </section>

        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-12" />

        {/* Chinese Section */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🇨🇳</span>
          <h2 className="text-2xl font-bold text-gray-900">服务条款</h2>
        </div>
        <p className="text-sm text-gray-500 mb-8">最近更新：2026年3月30日 · 即刻生效</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
            <p className="text-blue-700 text-sm font-medium">⚠️ Beta 版提示</p>
            <p className="text-blue-600 text-sm mt-1">PortraitPay AI 目前处于 Beta 阶段，运行于以太坊 Sepolia 测试网。主网上线前不涉及真实货币。</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">一、接受条款</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              访问或使用 PortraitPay AI（&ldquo;服务&rdquo;），即表示您同意受本服务条款（&ldquo;条款&rdquo;）的约束。若您不同意，请勿使用服务。本条款构成您（&ldquo;用户&rdquo;）与 PortraitPay AI（&ldquo;我们&rdquo;）之间的合法有约束力的协议。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">二、服务描述</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              PortraitPay AI 提供在以太坊区块链上注册、认证和授权肖像权的平台。服务包括：肖像上传与 KYC 身份验证、以太坊 Sepolia 智能合约区块链认证、IPFS 元数据存储、AI 侵权检测，以及肖像权人与被授权人之间的授权管理。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">三、资格要求</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              用户须年满18周岁。18岁以下用户需经监护人授权验证。企业账户需提供有效商业登记证明。我们保留暂停不符合资格要求的账户的权利。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">四、肖像权与所有权</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">通过上传肖像至 PortraitPay AI，您声明并保证：</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>您拥有该肖像或已获得肖像权人的明确许可</li>
              <li>该肖像不侵犯第三方知识产权、隐私权或肖像权</li>
              <li>您具有签订本协议的合法能力</li>
              <li>如为名人/公众人物：您为本人或获得其授权的代理人</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mt-4">
              <p className="text-yellow-700 text-sm"><strong>注意：</strong>未经同意上传他人肖像可能违反《个人信息保护法》，并可能导致法律责任。</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">五、KYC 身份验证</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              KYC 数据由授权第三方服务商处理，并依据我们的<a href="/privacy" className="text-purple-600 hover:underline">《隐私政策》</a>进行处理。提供虚假 KYC 信息可能导致账户终止。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">六、区块链认证</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              以太坊 Sepolia 上的肖像认证创建不可变的时间戳和记录。该记录旨在作为存在性和 authorship 的证据——不构成法律所有权或在任何司法管辖区均具有法律可执行性的保证。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">七、授权与智能合约</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              肖像权人可通过智能合约系统设置授权条款。PortraitPay AI 对所有交易收取 1% 平台费用。未经授权使用已认证肖像构成违反本条款。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">八、支付条款</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-3">
              <li><strong>平台服务费：</strong>每笔交易的 1%，由智能合约自动扣除</li>
              <li><strong>肖像权人收益：</strong>授权收入的 99%，记入账户余额</li>
              <li><strong>最低提现额度：</strong>人民币 100 元</li>
              <li><strong>到账时间：</strong>审批后 1-3 个工作日</li>
              <li><strong>支持的提现方式：</strong>国内银行转账、支付宝、微信支付</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">九、用户行为规范</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">您同意不从事以下行为：</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>未经本人同意上传其肖像</li>
              <li>将平台用于任何非法目的</li>
              <li>试图操纵智能合约或区块链记录</li>
              <li>使用自动化机器人或抓取工具攻击平台</li>
              <li>利用平台骚扰、诽谤或冒充他人</li>
              <li>上传违反适用法律（《网络安全法》《个人信息保护法》等）的内容</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十、KYC 数据删除流程</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">您可随时申请删除个人数据。申请删除的方式：</p>
            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2 mb-3">
              <li>登录 PortraitPay AI 账户</li>
              <li>进入<strong>设置 → 隐私 → 删除我的数据</strong></li>
              <li>提交删除请求</li>
              <li>我们的团队将在<strong>15 个工作日内</strong>处理</li>
            </ol>
            <p className="text-gray-600 text-sm leading-relaxed">
              区块链记录（交易哈希）因设计特性无法删除——但其中不包含原始肖像数据。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十一、免责声明与责任限制</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              PortraitPay AI 按&ldquo;现状&rdquo;提供服务，不提供任何明示或暗示的保证。我们的总责任不应超过您提出索赔前12个月内支付的费用金额。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十二、适用法律</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              本条款受中华人民共和国法律管辖并按其解释。争议应提交至上海市有管辖权的法院专属管辖。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十三、条款修改</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              我们可能不时更新本条款。重大变更将通过电子邮件和平台通知告知。变更后继续使用服务即表示接受修订后的条款。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十四、联系我们</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              如有问题，请通过 <a href="mailto:legal@portraitpayai.com" className="text-purple-600 hover:underline">legal@portraitpayai.com</a> 与我们联系，或访问我们的<a href="/contact" className="text-purple-600 hover:underline">联系页面</a>。
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-4 mt-16">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PortraitPay AI" className="w-5 h-5 rounded" />
            <span className="text-gray-400 text-sm">© 2026 PortraitPay AI</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-gray-600 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-gray-600 transition">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-sm text-gray-400 hover:text-gray-600 transition">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
