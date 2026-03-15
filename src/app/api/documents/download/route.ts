import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

export async function GET(request: NextRequest) {
  const fileKey = request.nextUrl.searchParams.get("key");

  if (!fileKey) {
    return NextResponse.json({ error: "Missing file key" }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("accessToken")?.value;
  const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get presigned URL from backend
    const res = await fetch(`${API_BASE}/documents/download/${fileKey}`, {
      headers: { Authorization: token.startsWith("Bearer") ? token : `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Document not found" }, { status: res.status });
    }

    const data = await res.json();
    if (!data.url) {
      return NextResponse.json({ error: "No URL" }, { status: 404 });
    }

    // Fetch file from MinIO using internal hostname
    const internalUrl = data.url.replace("localhost:9000", "minio:9000");
    const fileRes = await fetch(internalUrl);

    if (!fileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
    }

    const fileBuffer = await fileRes.arrayBuffer();
    const contentType = fileRes.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
