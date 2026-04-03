import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Celebrity data from JSON files
const celebrityData = [
  // Sports (18)
  { name: '马龙', enName: 'Ma Long', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Ma_Long' },
  { name: '姚明', enName: 'Yao Ming', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Yao_Ming' },
  { name: '谷爱凌', enName: 'Eileen Gu', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Eileen_Gu' },
  { name: '苏炳添', enName: 'Su Bingtian', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Su_Bingtian' },
  { name: '全红婵', enName: 'Quan Hongchan', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Quan_Hongchan' },
  { name: '张继科', enName: 'Zhang Jike', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhang_Jike' },
  { name: '孙杨', enName: 'Sun Yang', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Sun_Yang' },
  { name: '刘翔', enName: 'Liu Xiang', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Liu_Xiang' },
  { name: '郎平', enName: 'Lang Ping', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Lang_Ping' },
  { name: '李娜', enName: 'Li Na', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Li_Na' },
  { name: '武磊', enName: 'Wu Lei', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Wu_Lei' },
  { name: '许昕', enName: 'Xu Xin', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Xu_Xin' },
  { name: '樊振东', enName: 'Fan Zhendong', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Fan_Zhendong' },
  { name: '朱婷', enName: 'Zhu Ting', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhu_Ting' },
  { name: '林丹', enName: 'Lin Dan', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Lin_Dan' },
  { name: '张雨霏', enName: 'Zhang Yufei', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhang_Yufei' },
  { name: '潘展乐', enName: 'Pan Zhanle', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Pan_Zhanle' },
  { name: '郑钦文', enName: 'Zheng Qinwen', category: 'sports', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zheng_Qinwen' },
  // TV (20)
  { name: '何炅', enName: 'He Jiong', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/He_Jiong' },
  { name: '汪涵', enName: 'Wang Han', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Wang_Han_(host)' },
  { name: '董卿', enName: 'Dong Qing', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Dong_Qing' },
  { name: '撒贝宁', enName: 'Sa Beining', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Sa_Beining' },
  { name: '谢娜', enName: 'Xie Na', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Xie_Na' },
  { name: '李思思', enName: 'Li Sisi', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Li_Sisi' },
  { name: '大张伟', enName: 'Zhang Wei', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Da_Zhang_Wei' },
  { name: '吴昕', enName: 'Wu Xin', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Wu_Xin' },
  { name: '贾玲', enName: 'Jia Ling', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Jia_Ling' },
  { name: '李佳琦', enName: 'Li Jiaqi', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Li_Jiaqi' },
  { name: '李子柒', enName: 'Li Ziqi', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Li_Ziqi' },
  { name: 'papi酱', enName: 'Papi Jiang', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Papi_Jiang' },
  { name: '李雪琴', enName: 'Li Xueqin', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Li_Xueqin' },
  { name: '薇娅', enName: 'Viya', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Viya_(streamer)' },
  { name: '欧阳娜娜', enName: 'Nana Ouyang', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Nana_Ouyang' },
  { name: '虞书欣', enName: 'Esther Yu', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Esther_Yu' },
  { name: '赵露思', enName: 'Zhao Lusi', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhao_Lusi' },
  { name: '王心凌', enName: 'Cyndi Wang', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Cyndi_Wang' },
  { name: '刘德华', enName: 'Andy Lau', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Andy_Lau' },
  { name: '张大大', enName: 'Zhang Dadi', category: 'tv', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhang_Da_Da' },
  // Film (22)
  { name: '章子怡', enName: 'Zhang Ziyi', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhang_Ziyi' },
  { name: '巩俐', enName: 'Gong Li', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Gong_Li' },
  { name: '杨颖', enName: 'Angelababy', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Angelababy' },
  { name: '范冰冰', enName: 'Fan Bingbing', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Fan_Bingbing' },
  { name: '刘亦菲', enName: 'Liu Yifei', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Liu_Yifei' },
  { name: '迪丽热巴', enName: 'Dilraba Dilmurat', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Dilraba_Dilmurat' },
  { name: '赵丽颖', enName: 'Zhao Liying', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhao_Liying' },
  { name: '杨幂', enName: 'Yang Mi', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Yang_Mi' },
  { name: '倪妮', enName: 'Ni Ni', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Ni_Ni' },
  { name: '汤唯', enName: 'Tang Wei', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Tang_Wei' },
  { name: '李冰冰', enName: 'Li Bingbing', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Li_Bingbing' },
  { name: '孙俪', enName: 'Sun Li', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Sun_Li_(actress)' },
  { name: '周迅', enName: 'Zhou Xun', category: 'film', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhou_Xun' },
  { name: 'Joaquin Phoenix', enName: 'Joaquin Phoenix', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Joaquin_Phoenix' },
  { name: 'Scarlett Johansson', enName: 'Scarlett Johansson', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Scarlett_Johansson' },
  { name: 'Brad Pitt', enName: 'Brad Pitt', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Brad_Pitt' },
  { name: 'Robert Downey Jr.', enName: 'Robert Downey Jr.', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Robert_Downey_Jr.' },
  { name: 'Johnny Depp', enName: 'Johnny Depp', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Johnny_Depp' },
  { name: 'Tom Hanks', enName: 'Tom Hanks', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Tom_Hanks' },
  { name: 'Angelina Jolie', enName: 'Angelina Jolie', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Angelina_Jolie' },
  { name: 'Leonardo DiCaprio', enName: 'Leonardo DiCaprio', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Leonardo_DiCaprio' },
  { name: 'Meryl Streep', enName: 'Meryl Streep', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Meryl_Streep' },
  // Music (10)
  { name: '周杰伦', enName: 'Jay Chou', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Jay_Chou' },
  { name: '王菲', enName: 'Faye Wong', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Faye_Wong' },
  { name: '邓紫棋', enName: 'G.E.M.', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/G.E.M._(singer)' },
  { name: '周深', enName: 'Zhou Shen', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhou_Shen' },
  { name: '李荣浩', enName: 'Li Ronghao', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Li_Ronghao' },
  { name: '张杰', enName: 'Zhang Jie', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhang_Jie_(singer)' },
  { name: '李宇春', enName: 'Li Yuchun', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Li_Yuchun' },
  { name: '周笔畅', enName: 'Zhou Bichang', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Zhou_Bichang' },
  { name: '杨千嬅', enName: 'Miriam Yeung', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Miriam_Yeung' },
  { name: '张学友', enName: 'Jackie Cheung', category: 'music', country: 'CN', sourceUrl: 'https://en.wikipedia.org/wiki/Jackie_Cheung' },
];

export async function POST() {
  try {
    // Create Celebrity table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Celebrity" (
        "id" TEXT NOT NULL DEFAULT gen_random_cuid(),
        "name" TEXT NOT NULL,
        "enName" TEXT,
        "category" TEXT NOT NULL,
        "imageUrl" TEXT,
        "sourceUrl" TEXT,
        "country" TEXT DEFAULT 'CN',
        "faceId" TEXT,
        "active" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Celebrity_pkey" PRIMARY KEY ("id")
      );
    `);

    // Clear existing data
    await prisma.celebrity.deleteMany({});

    // Insert all celebrities
    const created = await prisma.celebrity.createMany({
      data: celebrityData.map((c, i) => ({
        ...c,
        id: `celeb_${Date.now()}_${i}`,
      })),
    });

    return NextResponse.json({
      success: true,
      count: created.count,
      total: celebrityData.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed celebrity data', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const count = await prisma.celebrity.count();
  return NextResponse.json({ count });
}
