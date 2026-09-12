import { NextResponse } from "next/server";
import {
  perceptualHashFromBuffer,
  perceptualHashFromUrl,
} from "@/lib/hashing/perceptual";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const url = form.get("url");

      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const contentHash = await perceptualHashFromBuffer(buffer);
        return NextResponse.json({ contentHash });
      }

      if (typeof url === "string" && url.length > 0) {
        const contentHash = await perceptualHashFromUrl(url);
        return NextResponse.json({ contentHash });
      }

      return NextResponse.json(
        { error: "Provide file or url in form data" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as { url?: string; imageBase64?: string };
    if (body.url) {
      const contentHash = await perceptualHashFromUrl(body.url);
      return NextResponse.json({ contentHash });
    }
    if (body.imageBase64) {
      const raw = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const contentHash = await perceptualHashFromBuffer(Buffer.from(raw, "base64"));
      return NextResponse.json({ contentHash });
    }

    return NextResponse.json(
      { error: "Provide url or imageBase64" },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Hash failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
