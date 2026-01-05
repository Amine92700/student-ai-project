export const runtime = "nodejs";

import { NextResponse } from "next/server";
import pdf from "pdf-parse-fixed";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);

    return NextResponse.json({ text: data.text });
  } catch (e) {
    console.log("PDF ERROR => ", e);
    return NextResponse.json({ error: "parse failed" }, { status: 500 });
  }
}
