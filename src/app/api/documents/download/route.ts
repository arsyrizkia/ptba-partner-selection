import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

export async function GET(request: NextRequest) {
  const fileKey = request.nextUrl.searchParams.get("key");

  if (!fileKey) {
    return NextResponse.json({ error: "Missing file key" }, { status: 400 });
  }

  // Security: prevent path traversal attacks
  // Without this, a request like ?key=../../auth/users would make our server
  // fetch http://backend/api/auth/users instead of the document endpoint,
  // letting any logged-in user access admin-only API routes through our proxy.
  if (/\.\./.test(fileKey) || /[\r\n]/.test(fileKey)) {
    return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("accessToken")?.value;
  const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get presigned URL from backend — encode the key to prevent URL manipulation
    const res = await fetch(`${API_BASE}/documents/download/${encodeURIComponent(fileKey)}`, {
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
    // Security: only allow fetching from our MinIO server, not arbitrary URLs
    const internalUrl = data.url.replace("localhost:9000", "minio:9000");
    const parsed = new URL(internalUrl);
    if (!["minio:9000", "localhost:9000"].includes(parsed.host)) {
      return NextResponse.json({ error: "Invalid document URL" }, { status: 400 });
    }
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
