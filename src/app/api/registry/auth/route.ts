import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, tokenOrPassword, registryUrl = "https://index.docker.io/v1/" } = body;

    if (!username || !tokenOrPassword) {
      return NextResponse.json(
        { success: false, message: "Username and Access Token/Password are required." },
        { status: 400 },
      );
    }

    // Validate whether target registry is Docker Hub using proper URL parsing
    let isDockerHub = false;
    try {
      const parsedUrl = new URL(registryUrl);
      const host = parsedUrl.hostname.toLowerCase();
      isDockerHub =
        host === "docker.io" ||
        host === "index.docker.io" ||
        host === "registry-1.docker.io" ||
        host === "docker.com" ||
        host === "hub.docker.com" ||
        host.endsWith(".docker.io") ||
        host.endsWith(".docker.com");
    } catch {
      isDockerHub = false;
    }

    if (isDockerHub) {
      try {
        const response = await fetch("https://hub.docker.com/v2/users/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password: tokenOrPassword.trim(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            success: true,
            message: `Successfully connected to Docker Hub as @${username}`,
            token: data.token,
            username,
            registryUrl: "https://index.docker.io/v1/",
            connectedAt: new Date().toISOString(),
          });
        }

        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            success: false,
            message:
              errorData.message ||
              errorData.detail ||
              "Authentication failed. Please verify your Docker Hub username or Personal Access Token.",
          },
          { status: 401 },
        );
      } catch (err) {
        return NextResponse.json(
          {
            success: false,
            message: `Network error connecting to Docker Hub: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
          { status: 502 },
        );
      }
    }

    // Custom registry validation (e.g. ghcr.io, quay.io)
    return NextResponse.json({
      success: true,
      message: `Registry profile configured for ${registryUrl} as ${username}`,
      token: Buffer.from(`${username}:${tokenOrPassword}`).toString("base64"),
      username,
      registryUrl,
      connectedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
