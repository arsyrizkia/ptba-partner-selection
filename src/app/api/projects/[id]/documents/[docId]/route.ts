import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;

  // Get auth token from cookie or header
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("accessToken")?.value;
  const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get presigned URL from backend
    const res = await fetch(`${API_BASE}/projects/${id}/documents/${docId}/url`, {
      headers: { Authorization: token.startsWith("Bearer") ? token : `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Document not found" }, { status: res.status });
    }

    const data = await res.json();
    if (!data.url) {
      return NextResponse.json({ error: "No URL" }, { status: 404 });
    }

    // Fetch the file from MinIO using the presigned URL (internal network)
    // Replace localhost back to internal hostname for server-side fetch
    const internalUrl = data.url.replace("localhost:9000", "minio:9000");
    const fileRes = await fetch(internalUrl);

    if (!fileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
    }

    const fileBuffer = await fileRes.arrayBuffer();
    const contentType = fileRes.headers.get("content-type") || "application/octet-stream";
    const docName = data.document?.name || "document";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${docName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
