import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "PortraitPay AI Privacy Policy — Learn how we collect, use, and protect your personal information, portrait data, and blockchain records.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 30, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              PortraitPay AI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) collects information you provide directly to us, such as when you create an account, upload a portrait, complete identity verification (KYC), submit an infringement report, or contact us for support.
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>Account information:</strong> email address, password, name, phone number</li>
              <li><strong>Portrait data:</strong> photographs you upload, face detection metadata, IPFS content identifiers (CIDs)</li>
              <li><strong>KYC data:</strong> government-issued ID documents, selfie photos, verification status</li>
              <li><strong>Blockchain records:</strong> Ethereum wallet addresses (if applicable), transaction hashes, on-chain certification timestamps</li>
              <li><strong>Usage data:</strong> pages visited, features used, device type, IP address</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Provide, maintain, and improve our portrait rights certification services</li>
              <li>Process KYC verification through third-party providers (Alibaba Cloud, Tencent Cloud)</li>
              <li>Record portrait certifications on the Ethereum blockchain (Sepolia testnet)</li>
              <li>Store portrait data and metadata on IPFS (decentralized storage)</li>
              <li>Detect and alert you to potential unauthorized use of your certified portraits</li>
              <li>Process licensing requests and royalty payments</li>
              <li>Send you service-related notifications (in-app and email)</li>
              <li>Respond to your comments, questions, and customer support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-3">
              <li><strong>Enterprise licensees:</strong> When you approve a licensing request, the requesting enterprise receives your portrait data and authorization terms.</li>
              <li><strong>Service providers:</strong> Third-party KYC providers (Alibaba Cloud, Tencent Cloud) process identity data on our behalf.</li>
              <li><strong>Blockchain/IPFS:</strong> Once your portrait is certified on-chain, the certification record (portrait CID, timestamp, certificate ID) becomes publicly visible on the Ethereum blockchain.</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or governmental regulation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Retention</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide services. KYC documents are retained for the duration of your account plus any legally required period. Blockchain records (once written) are immutable and cannot be deleted by us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We implement industry-standard security measures including TLS encryption in transit, AES-256 encryption at rest, role-based access controls, and regular security audits. No method of transmission or storage is 100% secure; we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data (subject to legal retention requirements)</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time (where processing is consent-based)</li>
            </ul>
            <p className="text-gray-600 text-sm leading-relaxed mt-3">
              To exercise any of these rights, please contact us at <a href="mailto:hi@portraitpayai.com" className="text-purple-600 hover:underline">hi@portraitpayai.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies & Tracking</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We use essential cookies for authentication (`pp_access_token`, `pp_refresh_token`) and language preference (`pp_locale`). We do not use advertising or analytics tracking cookies. Essential cookies are required for the service to function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal data, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Data Transfers</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. When we transfer data internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) where required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date. Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. KYC Data Deletion</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              To request deletion of your KYC and portrait data:
            </p>
            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2 mb-3">
              <li>Log in to your PortraitPay AI account</li>
              <li>Navigate to <strong>Settings → Privacy → Delete My Data</strong></li>
              <li>Submit a deletion request</li>
              <li>Our team will process within <strong>15 business days</strong></li>
            </ol>
            <p className="text-gray-600 text-sm leading-relaxed">
              For urgent requests or if you cannot access your account, email <a href="mailto:privacy@portraitpayai.com" className="text-purple-600 hover:underline">privacy@portraitpayai.com</a> with &ldquo;Data Deletion Request&rdquo; in the subject.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. GDPR Rights (EU/EEA Users)</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Access, rectify, or erase your personal data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with your local data protection authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. PIPL Compliance (China)</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              For Chinese users, we comply with China&apos;s Personal Information Protection Law (PIPL):
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Personal information processed only with individual consent</li>
              <li>Clear notice provided before data collection</li>
              <li>Chinese user data stored on servers within mainland China</li>
              <li>Cross-border transfers require separate consent and security assessment</li>
              <li>Sensitive personal information (face data, identity documents) requires explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Us</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              For privacy inquiries, data access or deletion requests, contact our Data Protection Officer:
            </p>
            <ul className="list-none pl-0 text-sm text-gray-600 space-y-1 mt-3">
              <li>📧 <a href="mailto:privacy@portraitpayai.com" className="text-purple-600 hover:underline">privacy@portraitpayai.com</a></li>
              <li>📧 EU Representative: <a href="mailto:eu-rep@portraitpayai.com" className="text-purple-600 hover:underline">eu-rep@portraitpayai.com</a></li>
              <li>💬 WeChat: PortraitPay_AI</li>
            </ul>
          </section>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-12" />

        {/* Chinese Section */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🇨🇳</span>
          <h2 className="text-2xl font-bold text-gray-900">隐私政策</h2>
        </div>
        <p className="text-sm text-gray-500 mb-8">最近更新：2026年3月30日</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-8">
            <p className="text-green-700 text-sm font-medium mb-1">🛡️ 数据保护合规</p>
            <p className="text-green-600 text-sm">PortraitPay AI 遵守《个人信息保护法》（PIPL）及 GDPR。您的肖像与身份数据均经过加密、分隔存储，并受到严格管控。</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">一、我们收集的信息</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>身份数据：</strong>姓名、电子邮件、电话号码、出生日期 — KYC 验证时收集</li>
              <li><strong>肖像数据：</strong>照片与人脸向量嵌入，用于认证与侵权检测</li>
              <li><strong>财务数据：</strong>银行账户信息、支付宝/微信支付ID</li>
              <li><strong>区块链数据：</strong>以太坊钱包地址、交易哈希</li>
              <li><strong>使用数据：</strong>IP地址、浏览器类型、访问页面及时间戳</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">二、我们如何使用您的信息</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>创建和管理您的账户</li>
              <li>进行身份验证（KYC）及欺诈防范</li>
              <li>在以太坊区块链上认证肖像</li>
              <li>处理授权交易与版税支付</li>
              <li>检测并提醒您潜在的肖像侵权行为</li>
              <li>传达服务更新及安全通知</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">三、数据最小化</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              我们仅收集严格必要的数据。人脸向量数据仅用于认证与侵权检测，绝不与第三方共享或用于其他用途。原始肖像图片可随时删除。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">四、人脸向量数据分离</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>原始肖像图片：</strong>以AES-256加密存储于安全云存储中，可随时删除</li>
              <li><strong>人脸向量嵌入：</strong>以数学形式表示面部特征，单独存储。账户关闭后按法律要求保留</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">五、《个人信息保护法》合规</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>个人信息须经个人同意方可处理</li>
              <li>在收集数据前提供清晰显著的告知</li>
              <li>数据本地化：中国用户数据存储于中国大陆境内服务器</li>
              <li>跨境传输需另行获得同意并进行安全评估</li>
              <li>用户享有访问、更正、删除和携带其数据的权利</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">六、数据共享</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">我们不出售您的个人数据。数据在以下情况下共享：</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>KYC 服务提供商：</strong>旷视科技（Face++）用于身份验证</li>
              <li><strong>云基础设施：</strong>加密存储（静态加密和传输加密）</li>
              <li><strong>区块链：</strong>交易哈希在以太坊上公开可见</li>
              <li><strong>支付处理商：</strong>银行、支付宝、微信支付用于处理提现</li>
              <li><strong>法律合规：</strong>法律、法院命令或政府机关要求时的披露</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">七、数据保留</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>账户数据：</strong>账户活跃期间保留；关闭后15个工作日内删除</li>
              <li><strong>原始肖像图片：</strong>用户请求后立即删除；备份存档保留最多30天</li>
              <li><strong>人脸向量数据：</strong>按法律要求保留（反洗钱最少3年），随后删除</li>
              <li><strong>KYC 文档：</strong>按金融合规要求保留5年</li>
              <li><strong>区块链记录：</strong>永久保留（区块链不可变特性）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">八、您的权利</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>访问权：</strong>请求获取我们持有的关于您的所有个人数据</li>
              <li><strong>更正权：</strong>请求更正不准确的数据</li>
              <li><strong>删除权：</strong>请求删除您的数据</li>
              <li><strong>拒绝权：</strong>拒绝基于合法利益的数据处理</li>
              <li><strong>携带权：</strong>以结构化、机器可读的格式接收您的数据</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">九、KYC 数据删除流程</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">申请删除您的KYC和肖像数据：</p>
            <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2 mb-3">
              <li>登录 PortraitPay AI 账户</li>
              <li>进入<strong>设置 → 隐私 → 删除我的数据</strong></li>
              <li>提交删除请求（需重新身份验证）</li>
              <li>我们的团队将在<strong>15 个工作日内</strong>处理</li>
            </ol>
            <p className="text-gray-600 text-sm leading-relaxed">
              如无法访问账户，请发送邮件至 <a href="mailto:privacy@portraitpayai.com" className="text-purple-600 hover:underline">privacy@portraitpayai.com</a>，邮件主题注明&ldquo;数据删除请求&rdquo;。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十、安全措施</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>加密：</strong>静态数据采用AES-256加密；传输采用TLS 1.3</li>
              <li><strong>访问控制：</strong>所有内部系统采用基于角色的访问控制（RBAC）</li>
              <li><strong>审计日志：</strong>所有数据访问均被记录并每季度审查</li>
              <li><strong>渗透测试：</strong>定期进行第三方安全审计</li>
              <li><strong>事件响应：</strong>24小时内通知数据泄露（GDPR第33条）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十一、Cookie 与追踪</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>必要 Cookie：</strong>身份验证、会话管理 — 服务运行所必需</li>
              <li><strong>分析 Cookie：</strong>匿名使用统计（自托管 Plausible Analytics — 无第三方追踪）</li>
              <li><strong>广告 Cookie：</strong>我们不使用任何广告追踪 Cookie</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十二、儿童隐私</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              PortraitPay AI 不收集18岁以下个人的个人数据。若发现收集了未成年人数据且未经父母同意，我们将立即删除。请通过 <a href="mailto:privacy@portraitpayai.com" className="text-purple-600 hover:underline">privacy@portraitpayai.com</a> 与我们联系。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十三、本政策变更</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              我们可能不时更新本隐私政策。重大变更将在生效前至少30天通过电子邮件通知您。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">十四、联系我们</h2>
            <ul className="list-none pl-0 text-sm text-gray-600 space-y-1">
              <li><strong>电子邮件：</strong> <a href="mailto:privacy@portraitpayai.com" className="text-purple-600 hover:underline">privacy@portraitpayai.com</a></li>
              <li><strong>欧盟代表：</strong> <a href="mailto:eu-rep@portraitpayai.com" className="text-purple-600 hover:underline">eu-rep@portraitpayai.com</a>（GDPR第27条代表）</li>
              <li><strong>地址：</strong>上海市浦东新区，中国</li>
            </ul>
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
