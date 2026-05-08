with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix Chinese comments
c = c.replace('// "firm" = 寰嬪笀妤? "personal" = 涓\u001d汉寰嬪笀', '// "firm" = law firm, "personal" = solo lawyer')

# Fix Chinese error prefix
c = c.replace('鉂?', '')

# Fix Chinese country names - all to English with emoji flags
countries = [
    ('US', 'United States'),
    ('GB', 'United Kingdom'),
    ('CA', 'Canada'),
    ('AU', 'Australia'),
    ('JP', 'Japan'),
    ('KR', 'South Korea'),
    ('SG', 'Singapore'),
    ('HK', 'Hong Kong'),
    ('TW', 'Taiwan'),
    ('DE', 'Germany'),
    ('FR', 'France'),
    ('IT', 'Italy'),
    ('ES', 'Spain'),
    ('NL', 'Netherlands'),
    ('CH', 'Switzerland'),
    ('SE', 'Sweden'),
    ('NO', 'Norway'),
    ('DK', 'Denmark'),
    ('FI', 'Finland'),
    ('NZ', 'New Zealand'),
    ('AE', 'UAE'),
    ('SA', 'Saudi Arabia'),
    ('IN', 'India'),
    ('BR', 'Brazil'),
    ('MX', 'Mexico'),
    ('OTHER', 'Other (Contact us)'),
]

# Fix country names that have Chinese chars embedded
c = c.replace('馃嚭馃嚫 United States', '🇺🇸 United States')
c = c.replace('馃嚞馃嚙 United Kingdom', '🇬🇧 United Kingdom')
c = c.replace('馃嚚馃嚘 Canada', '🇨🇦 Canada')
c = c.replace('馃嚘馃嚭 Australia', '🇦🇺 Australia')
c = c.replace('馃嚡馃嚨 Japan', '🇯🇵 Japan')
c = c.replace('馃嚢馃嚪 South Korea', '🇰🇷 South Korea')
c = c.replace('馃嚫馃嚞 Singapore', '🇸🇬 Singapore')
c = c.replace('馃嚟馃嚢 Hong Kong', '🇭🇰 Hong Kong')
c = c.replace('馃嚬馃嚰 Taiwan', '🇹🇼 Taiwan')
c = c.replace('馃嚛馃嚜 Germany', '🇩🇪 Germany')
c = c.replace('馃嚝馃嚪 France', '🇫🇷 France')
c = c.replace('馃嚠馃嚬 Italy', '🇮🇹 Italy')
c = c.replace('馃嚜馃嚫 Spain', '🇪🇸 Spain')
c = c.replace('馃嚦馃嚤 Netherlands', '🇳🇱 Netherlands')
c = c.replace('馃嚚馃嚟 Switzerland', '🇨🇭 Switzerland')
c = c.replace('馃嚫馃嚜 Sweden', '🇸🇪 Sweden')
c = c.replace('馃嚦馃嚧 Norway', '🇳🇴 Norway')
c = c.replace('馃嚛馃嚢 Denmark', '🇩🇰 Denmark')
c = c.replace('馃嚝馃嚠 Finland', '🇫🇮 Finland')
c = c.replace('馃嚦馃嚳 New Zealand', '🇳🇿 New Zealand')
c = c.replace('馃嚘馃嚜 UAE', '🇦🇪 UAE')
c = c.replace('馃嚫馃嚘 Saudi Arabia', '🇸🇦 Saudi Arabia')
c = c.replace('馃嚠馃嚦 India', '🇮🇳 India')
c = c.replace('馃嚙馃嚪 Brazil', '🇧🇷 Brazil')
c = c.replace('馃嚥馃嚱 Mexico', '🇲🇽 Mexico')
c = c.replace('馃實 Other (Contact us)', '🌐 Other (Contact us)')

# Fix Chinese emoji in law firm button
c = c.replace('馃彌锔?', '⚖️')

# Fix remaining Chinese char in button
c = c.replace('鈿栵笍', '👤')

# Fix section comment blocks (Header, Success Content, Main Content, Hero Banner, Form Card)
c = c.replace('// 鈹€鈹€ Header 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€', '// Header')
c = c.replace('// 鈹€鈹€ Success Content 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€', '// Success Content')
c = c.replace('// 鈹€鈹€ Main Content 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€', '// Main Content')
c = c.replace('// 鈹€鈹€ Hero Banner 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€', '// Hero Banner')
c = c.replace('// 鈹€鈹€ Form Card 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€', '// Form Card')

with open('src/app/enterprise/lawyer-registration/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Fixed lawyer-registration/page.tsx')

# Also fix translations.ts zh-Hant lawyerRegistration fields that are still Chinese
with open('src/lib/i18n/translations.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Find zh-Hant block and fix
idx = c.index('"zh-Hant":')
idx2 = c.index('"es-ES":', idx)
block = c[idx:idx2]

# Replace Chinese lawyerRegistration in zh-Hant
replacements = [
    ('pageTitle: "律师注册",', 'pageTitle: "律師註冊",'),
    ('pageSubtitle: "入驻后，您的律所或工作室将作为平台授权的肖像权保护机构，为用户提供法律咨询、维权及侵权处理服务。",', 'pageSubtitle: "Join as an entertainment or IP lawyer to review actor consent terms and handle licensing disputes.",'),
    ('registrationType: "注册类型",', 'registrationType: "註冊類型",'),
    ('lawFirm: "律所",', 'lawFirm: "律所",'),
    ('lawFirmDesc: "律师事务所，已备案",', 'lawFirmDesc: "已備案的律師事務所",'),
    ('personalLawyer: "个人律师",', 'personalLawyer: "個人律師",'),
    ('personalLawyerDesc: "独立执业律师",', 'personalLawyerDesc: "獨立執業律師",'),
    ('companyName: "律所/公司名称",', 'companyName: "律所/公司名稱",'),
    ('companyNamePersonal: "您的姓名",', 'companyNamePersonal: "您的姓名",'),
    ('companyNameRequired: "请输入公司名称",', 'companyNameRequired: "請輸入公司名稱",'),
    ('companyNamePersonalRequired: "请输入您的姓名",', 'companyNamePersonalRequired: "請輸入您的姓名",'),
    ('selectCountry: "国家/地区",', 'selectCountry: "國家/地區",'),
    ('countryRequired: "请选择国家/地区",', 'countryRequired: "請選擇國家/地區",'),
    ('countryNotAvailable: "该地区暂未开放，请选择其他地区。",', 'countryNotAvailable: "該地區暫未開放，請選擇其他地區。",'),
    ('contactName: "联系人",', 'contactName: "聯絡人",'),
    ('contactNameRequired: "请输入联系人姓名",', 'contactNameRequired: "請輸入聯絡人姓名",'),
    ('email: "邮箱",', 'email: "電子郵箱",'),
    ('emailRequired: "请输入邮箱",', 'emailRequired: "請輸入電子郵箱",'),
    ('emailInvalid: "邮箱格式无效",', 'emailInvalid: "電子郵箱格式無效",'),
    ('phone: "手机",', 'phone: "電話",'),
    ('phoneRequired: "请输入手机号码",', 'phoneRequired: "請輸入電話號碼",'),
    ('licenseUrl: "执照/证书链接",', 'licenseUrl: "執照/證書連結",'),
    ('licenseUrlOptional: "选填",', 'licenseUrlOptional: "選填",'),
    ('licenseUrlHint: "上传至云存储后粘贴链接，也可稍后补充",', 'licenseUrlHint: "上傳至雲端存儲後貼上連結，也可稍後補充",'),
    ('notes: "须知",', 'notes: "須知",'),
    ('note1: "审核周期：3-5个工作日",', 'note1: "審核週期：3-5個工作日",'),
    ('note2: "需持有有效的律师事务所营业执照",', 'note2: "需持有有效的律師事務所營業執照",'),
    ('note3: "审核通过后可在平台接单",', 'note3: "審核通過後可在平台接單",'),
    ('note4: "平台收取一定比例的服务费，详见协议",', 'note4: "平台收取一定比例的服務費，詳見協議",'),
    ('submit: "提交申请",', 'submit: "提交申請",'),
    ('submitting: "提交中...",', 'submitting: "提交中...",'),
    ('successTitle: "申请已提交！",', 'successTitle: "申請已提交！",'),
    ('successDesc: "感谢您的申请。我们的审核团队将在3-5个工作日内完成审核，并通过邮件通知您。",', 'successDesc: "感謝您的申請。我們的審核團隊將在3-5個工作日內完成審核，並通過郵件通知您。",'),
    ('backToHome: "返回首页",', 'backToHome: "返回首頁",'),
    ('submitError: "提交失败，请重试",', 'submitError: "提交失敗，請重試",'),
    ('networkError: "网络错误，请检查网络连接",', 'networkError: "網絡錯誤，請檢查網絡連接",'),
]

for old, new in replacements:
    if old in block:
        block = block.replace(old, new)
        print(f'Fixed zh-Hant: {old[:40]}')
    else:
        print(f'MISS zh-Hant: {old[:40]}')

c = c[:idx] + block + c[idx2:]
with open('src/lib/i18n/translations.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('\nAll done!')
