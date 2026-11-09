import { type NextRequest, NextResponse } from "next/server";

import type { DockerImageTag } from "@/lib/docker-registry";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const image = searchParams.get("image")?.trim() || "";

  if (!image) {
    return NextResponse.json({ error: "Missing image parameter" }, { status: 400 });
  }

  // Normalize image name for Docker Hub repository API
  let namespace = "library";
  let repo = image;
  if (image.includes("/")) {
    const parts = image.split("/");
    namespace = parts[0];
    repo = parts.slice(1).join("/");
  }

  try {
    const url = `https://hub.docker.com/v2/repositories/${encodeURIComponent(namespace)}/${encodeURIComponent(repo)}/tags/?page_size=20`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const data = await response.json();
      const tags: DockerImageTag[] = (data.results || []).map(
        (t: {
          name: string;
          full_size?: number;
          digest?: string;
          last_updated?: string;
          images?: { architecture?: string; os?: string; size?: number }[];
        }) => {
          const archs = Array.from(
            new Set((t.images || []).map((img) => img.architecture).filter(Boolean)),
          ) as string[];
          const osList = Array.from(new Set((t.images || []).map((img) => img.os).filter(Boolean))) as string[];
          const size = t.full_size || t.images?.[0]?.size || 0;

          return {
            name: t.name,
            size,
            digest: t.digest || "",
            lastUpdated: t.last_updated || new Date().toISOString(),
            architectures: archs.length > 0 ? archs : ["amd64"],
            os: osList.length > 0 ? osList : ["linux"],
          };
        },
      );

      return NextResponse.json({ image, tags, total: data.count || tags.length });
    }
  } catch {
    // Fall through to fallback tags
  }

  // Fallback tags if API is unreachable
  const fallbackTags: DockerImageTag[] = [
    {
      name: "latest",
      size: 55 * 1024 * 1024,
      digest: "sha256:fallback-latest",
      lastUpdated: new Date().toISOString(),
      architectures: ["amd64", "arm64"],
      os: ["linux"],
    },
    {
      name: "alpine",
      size: 15 * 1024 * 1024,
      digest: "sha256:fallback-alpine",
      lastUpdated: new Date().toISOString(),
      architectures: ["amd64", "arm64"],
      os: ["linux"],
    },
    {
      name: "slim",
      size: 35 * 1024 * 1024,
      digest: "sha256:fallback-slim",
      lastUpdated: new Date().toISOString(),
      architectures: ["amd64", "arm64"],
      os: ["linux"],
    },
  ];

  return NextResponse.json({ image, tags: fallbackTags, total: fallbackTags.length, source: "fallback" });
}
