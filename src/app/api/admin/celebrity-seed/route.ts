import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

// Celebrity data - international celebrities for testing
const celebrityData = [
  // Sports (18)
  { name: 'Lionel Messi', enName: 'Lionel Messi', category: 'sports', country: 'AR', sourceUrl: 'https://en.wikipedia.org/wiki/Lionel_Messi' },
  { name: 'Cristiano Ronaldo', enName: 'Cristiano Ronaldo', category: 'sports', country: 'PT', sourceUrl: 'https://en.wikipedia.org/wiki/Cristiano_Ronaldo' },
  { name: 'LeBron James', enName: 'LeBron James', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/LeBron_James' },
  { name: 'Michael Jordan', enName: 'Michael Jordan', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Michael_Jordan' },
  { name: 'Tom Brady', enName: 'Tom Brady', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Tom_Brady' },
  { name: 'Serena Williams', enName: 'Serena Williams', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Serena_Williams' },
  { name: 'Usain Bolt', enName: 'Usain Bolt', category: 'sports', country: 'JM', sourceUrl: 'https://en.wikipedia.org/wiki/Usain_Bolt' },
  { name: 'Roger Federer', enName: 'Roger Federer', category: 'sports', country: 'CH', sourceUrl: 'https://en.wikipedia.org/wiki/Roger_Federer' },
  { name: 'Rafael Nadal', enName: 'Rafael Nadal', category: 'sports', country: 'ES', sourceUrl: 'https://en.wikipedia.org/wiki/Rafael_Nadal' },
  { name: 'Neymar Jr', enName: 'Neymar Jr', category: 'sports', country: 'BR', sourceUrl: 'https://en.wikipedia.org/wiki/Neymar' },
  { name: 'Kevin Durant', enName: 'Kevin Durant', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Kevin_Durant' },
  { name: 'Stephen Curry', enName: 'Stephen Curry', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Stephen_Curry' },
  { name: 'Lewis Hamilton', enName: 'Lewis Hamilton', category: 'sports', country: 'GB', sourceUrl: 'https://en.wikipedia.org/wiki/Lewis_Hamilton' },
  { name: 'David Beckham', enName: 'David Beckham', category: 'sports', country: 'GB', sourceUrl: 'https://en.wikipedia.org/wiki/David_Beckham' },
  { name: 'Kobe Bryant', enName: 'Kobe Bryant', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Kobe_Bryant' },
  { name: 'Tiger Woods', enName: 'Tiger Woods', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Tiger_Woods' },
  { name: 'Shaquille O\'Neal', enName: 'Shaquille O\'Neal', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Shaquille_O%27Neal' },
  { name: 'Mike Tyson', enName: 'Mike Tyson', category: 'sports', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Mike_Tyson' },
  // TV/Entertainment (20)
  { name: 'Taylor Swift', enName: 'Taylor Swift', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift' },
  { name: 'Beyonce', enName: 'Beyonce', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Beyonce' },
  { name: 'Kim Kardashian', enName: 'Kim Kardashian', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Kim_Kardashian' },
  { name: 'Jimmy Fallon', enName: 'Jimmy Fallon', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Jimmy_Fallon' },
  { name: 'Ellen DeGeneres', enName: 'Ellen DeGeneres', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Ellen_DeGeneres' },
  { name: 'Dwayne Johnson', enName: 'Dwayne Johnson', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Dwayne_Johnson' },
  { name: 'Oprah Winfrey', enName: 'Oprah Winfrey', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Oprah_Winfrey' },
  { name: 'Ryan Reynolds', enName: 'Ryan Reynolds', category: 'tv', country: 'CA', sourceUrl: 'https://en.wikipedia.org/wiki/Ryan_Reynolds' },
  { name: 'Hugh Jackman', enName: 'Hugh Jackman', category: 'tv', country: 'AU', sourceUrl: 'https://en.wikipedia.org/wiki/Hugh_Jackman' },
  { name: 'Chris Pratt', enName: 'Chris Pratt', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Chris_Pratt' },
  { name: 'Zendaya', enName: 'Zendaya', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Zendaya' },
  { name: 'Emma Stone', enName: 'Emma Stone', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Emma_Stone' },
  { name: 'Jennifer Lawrence', enName: 'Jennifer Lawrence', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Jennifer_Lawrence_(actress)' },
  { name: 'Ariana Grande', enName: 'Ariana Grande', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Ariana_Grande' },
  { name: 'Selena Gomez', enName: 'Selena Gomez', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Selena_Gomez' },
  { name: 'Justin Bieber', enName: 'Justin Bieber', category: 'tv', country: 'CA', sourceUrl: 'https://en.wikipedia.org/wiki/Justin_Bieber' },
  { name: 'Ed Sheeran', enName: 'Ed Sheeran', category: 'tv', country: 'GB', sourceUrl: 'https://en.wikipedia.org/wiki/Ed_Sheeran' },
  { name: 'Billie Eilish', enName: 'Billie Eilish', category: 'tv', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Billie_Eilish' },
  { name: 'Harry Styles', enName: 'Harry Styles', category: 'tv', country: 'GB', sourceUrl: 'https://en.wikipedia.org/wiki/Harry_Styles' },
  { name: 'Rihanna', enName: 'Rihanna', category: 'tv', country: 'BB', sourceUrl: 'https://en.wikipedia.org/wiki/Rihanna' },
  // Film (22)
  { name: 'Leonardo DiCaprio', enName: 'Leonardo DiCaprio', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Leonardo_DiCaprio' },
  { name: 'Brad Pitt', enName: 'Brad Pitt', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Brad_Pitt' },
  { name: 'Angelina Jolie', enName: 'Angelina Jolie', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Angelina_Jolie' },
  { name: 'Scarlett Johansson', enName: 'Scarlett Johansson', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Scarlett_Johansson' },
  { name: 'Robert Downey Jr.', enName: 'Robert Downey Jr.', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Robert_Downey_Jr.' },
  { name: 'Chris Evans', enName: 'Chris Evans', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Chris_Evans_(actor)' },
  { name: 'Tom Hanks', enName: 'Tom Hanks', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Tom_Hanks' },
  { name: 'Johnny Depp', enName: 'Johnny Depp', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Johnny_Depp' },
  { name: 'Meryl Streep', enName: 'Meryl Streep', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Meryl_Streep' },
  { name: 'Denzel Washington', enName: 'Denzel Washington', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Denzel_Washington' },
  { name: 'Morgan Freeman', enName: 'Morgan Freeman', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Morgan_Freeman' },
  { name: 'Julia Roberts', enName: 'Julia Roberts', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Julia_Roberts' },
  { name: 'Cate Blanchett', enName: 'Cate Blanchett', category: 'film', country: 'AU', sourceUrl: 'https://en.wikipedia.org/wiki/Cate_Blanchett' },
  { name: 'Margot Robbie', enName: 'Margot Robbie', category: 'film', country: 'AU', sourceUrl: 'https://en.wikipedia.org/wiki/Margot_Robbie' },
  { name: 'Ryan Gosling', enName: 'Ryan Gosling', category: 'film', country: 'CA', sourceUrl: 'https://en.wikipedia.org/wiki/Ryan_Gosling' },
  { name: 'Emma Watson', enName: 'Emma Watson', category: 'film', country: 'GB', sourceUrl: 'https://en.wikipedia.org/wiki/Emma_Watson' },
  { name: 'Tom Cruise', enName: 'Tom Cruise', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Tom_Cruise' },
  { name: 'Will Smith', enName: 'Will Smith', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Will_Smith' },
  { name: 'Sandra Bullock', enName: 'Sandra Bullock', category: 'film', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Sandra_Bullock' },
  { name: 'Keanu Reeves', enName: 'Keanu Reeves', category: 'film', country: 'CA', sourceUrl: 'https://en.wikipedia.org/wiki/Keanu_Reeves' },
  { name: 'Chris Hemsworth', enName: 'Chris Hemsworth', category: 'film', country: 'AU', sourceUrl: 'https://en.wikipedia.org/wiki/Chris_Hemsworth' },
  { name: 'Gal Gadot', enName: 'Gal Gadot', category: 'film', country: 'IL', sourceUrl: 'https://en.wikipedia.org/wiki/Gal_Gadot' },
  // Music (10)
  { name: 'Adele', enName: 'Adele', category: 'music', country: 'GB', sourceUrl: 'https://en.wikipedia.org/wiki/Adele' },
  { name: 'Bruno Mars', enName: 'Bruno Mars', category: 'music', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Bruno_Mars' },
  { name: 'Lady Gaga', enName: 'Lady Gaga', category: 'music', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Lady_Gaga' },
  { name: 'Beyonce', enName: 'Beyonce', category: 'music', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Beyonce' },
  { name: 'The Weeknd', enName: 'The Weeknd', category: 'music', country: 'CA', sourceUrl: 'https://en.wikipedia.org/wiki/The_Weeknd' },
  { name: 'Drake', enName: 'Drake', category: 'music', country: 'CA', sourceUrl: 'https://en.wikipedia.org/wiki/Drake_(musician)' },
  { name: 'Post Malone', enName: 'Post Malone', category: 'music', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Post_Malone' },
  { name: 'Katy Perry', enName: 'Katy Perry', category: 'music', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Katy_Perry' },
  { name: 'Taylor Swift', enName: 'Taylor Swift', category: 'music', country: 'US', sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift' },
  { name: 'BTS', enName: 'BTS', category: 'music', country: 'KR', sourceUrl: 'https://en.wikipedia.org/wiki/BTS_(band)' },
];

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req as any);
  if (!session?.userId || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
        "country" TEXT DEFAULT 'US',
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
      { error: "Failed to seed celebrity data", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req as any);
  if (!session?.userId || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const count = await prisma.celebrity.count();
  return NextResponse.json({ count });
}