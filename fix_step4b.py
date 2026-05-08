with open('src/app/enterprise/lawyer-registration/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace the entire COUNTRIES array
old_countries = '''const COUNTRIES = [
  { code: "US", name: "馃嚭馃嚫 United States", available: true },
  { code: "GB", name: "馃嚞馃嚙 United Kingdom", available: true },
  { code: "CA", name: "馃嚚馃嚘 Canada", available: true },
  { code: "AU", name: "馃嚘馃嚭 Australia", available: true },
  { code: "JP", name: "馃嚡馃嚨 Japan", available: true },
  { code: "KR", name: "馃嚢馃嚪 South Korea", available: true },
  { code: "SG", name: "馃嚫馃嚞 Singapore", available: true },
  { code: "HK", name: "馃嚟馃嚢 Hong Kong", available: true },
  { code: "TW", name: "馃嚬馃嚰 Taiwan", available: true },
  { code: "DE", name: "馃嚛馃嚜 Germany", available: true },
  { code: "FR", name: "馃嚝馃嚪 France", available: true },
  { code: "IT", name: "馃嚠馃嚬 Italy", available: true },
  { code: "ES", name: "馃嚜馃嚫 Spain", available: true },
  { code: "NL", name: "馃嚦馃嚤 Netherlands", available: true },
  { code: "CH", name: "馃嚚馃嚟 Switzerland", available: true },
  { code: "SE", name: "馃嚫馃嚜 Sweden", available: true },
  { code: "NO", name: "馃嚦馃嚧 Norway", available: true },
  { code: "DK", name: "馃嚛馃嚢 Denmark", available: true },
  { code: "FI", name: "馃嚝馃嚠 Finland", available: true },
  { code: "NZ", name: "馃嚦馃嚳 New Zealand", available: true },
  { code: "AE", name: "馃嚘馃嚜 UAE", available: true },
  { code: "SA", name: "馃嚫馃嚘 Saudi Arabia", available: true },
  { code: "IN", name: "馃嚠馃嚦 India", available: true },
  { code: "BR", name: "馃嚙馃嚪 Brazil", available: true },
  { code: "MX", name: "馃嚥馃嚱 Mexico", available: true },
  { code: "OTHER", name: "馃實 Other (Contact us)", available: true },
];'''

new_countries = '''const COUNTRIES = [
  { code: "US", name: "United States", available: true },
  { code: "GB", name: "United Kingdom", available: true },
  { code: "CA", name: "Canada", available: true },
  { code: "AU", name: "Australia", available: true },
  { code: "JP", name: "Japan", available: true },
  { code: "KR", name: "South Korea", available: true },
  { code: "SG", name: "Singapore", available: true },
  { code: "HK", name: "Hong Kong", available: true },
  { code: "TW", name: "Taiwan", available: true },
  { code: "DE", name: "Germany", available: true },
  { code: "FR", name: "France", available: true },
  { code: "IT", name: "Italy", available: true },
  { code: "ES", name: "Spain", available: true },
  { code: "NL", name: "Netherlands", available: true },
  { code: "CH", name: "Switzerland", available: true },
  { code: "SE", name: "Sweden", available: true },
  { code: "NO", name: "Norway", available: true },
  { code: "DK", name: "Denmark", available: true },
  { code: "FI", name: "Finland", available: true },
  { code: "NZ", name: "New Zealand", available: true },
  { code: "AE", name: "UAE", available: true },
  { code: "SA", name: "Saudi Arabia", available: true },
  { code: "IN", name: "India", available: true },
  { code: "BR", name: "Brazil", available: true },
  { code: "MX", name: "Mexico", available: true },
  { code: "OTHER", name: "Other (Contact us)", available: true },
];'''

if old_countries in c:
    c = c.replace(old_countries, new_countries)
    print('Replaced COUNTRIES array')
else:
    print('COUNTRIES array NOT found - checking what we have')
    # Show first few country lines
    idx = c.find('const COUNTRIES')
    print(repr(c[idx:idx+300]))

# Fix lawyerType comment
c = c.replace(
    '// "firm" = 寰嬪笀妤? "personal" = 涓\u001d汉寰嬪笀',
    '// "firm" = law firm, "personal" = solo lawyer'
)

with open('src/app/enterprise/lawyer-registration/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done')
