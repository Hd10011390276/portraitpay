import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

const ALLOWED_FILES = [
  "00-Overview-and-Signing-Guide.docx",
  "01-Standard-License-Agreement.docx",
  "02-Exclusive-License-Agreement.docx",
  "03-Endorsement-License-Agreement.docx",
  "04-Film-Adaptation-License-Agreement.docx",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name } = await params;

  if (!ALLOWED_FILES.includes(name)) {
    return new NextResponse("File not found", { status: 404 });
  }

  const filePath = join(process.cwd(), "public", "contracts", name);

  try {
    await stat(filePath);
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }

  const fileBuffer = await readFile(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": fileBuffer.length.toString(),
    },
  });
}
