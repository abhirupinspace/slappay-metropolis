import { NextResponse } from "next/server";
import { z } from "zod";
import { parseIntent } from "@/lib/intent/parser";
import { log } from "@/lib/log";

const Body = z.object({ text: z.string().min(3).max(1000) });

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "text required" }, { status: 400 });
  const result = await parseIntent(body.data.text);
  if (result.intent) log("intent_parsed", { type: result.intent.type, source: result.source });
  else log("intent_validation_failed", { note: result.note, source: result.source });
  return NextResponse.json(result);
}
