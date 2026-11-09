import { type NextRequest, NextResponse } from "next/server";

import { CURATED_DOCKER_IMAGES, type DockerHubRepository } from "@/lib/docker-registry";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim() || "";
  const filter = searchParams.get("filter") || "all";
  const category = searchParams.get("category") || "all";
  const dockerToken = request.headers.get("x-docker-token");
  const dockerUsername = request.headers.get("x-docker-username");

  const cleanQuery = rawQuery.replace(/^@/, "").replace(/\/$/, "").trim();

  // 1. If user explicitly requests their connected account's private/personal repositories
  if (filter === "mine" && dockerUsername) {
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (dockerToken) {
        headers.Authorization = `Bearer ${dockerToken}`;
      }
      const response = await fetch(
        `https://hub.docker.com/v2/repositories/${encodeURIComponent(dockerUsername)}/?page_size=50`,
        { headers, next: { revalidate: 60 } },
      );

      if (response.ok) {
        const data = await response.json();
        const results: DockerHubRepository[] = (data.results || []).map(
          (repo: {
            name: string;
            namespace?: string;
            description?: string;
            star_count?: number;
            pull_count?: number;
            is_private?: boolean;
            last_updated?: string;
          }) => ({
            repoName: `${repo.namespace || dockerUsername}/${repo.name}`,
            shortDescription: repo.description || "Personal Docker repository",
            starCount: repo.star_count || 0,
            pullCount: repo.pull_count || 0,
            isOfficial: false,
            publisher: repo.namespace || dockerUsername,
            categories: repo.is_private ? ["Private Repo"] : ["Public Repo"],
            updatedAt: repo.last_updated,
          }),
        );
        return NextResponse.json({
          results,
          total: data.count || results.length,
          source: "user-repositories",
          namespace: dockerUsername,
        });
      }
    } catch {
      // Fallback
    }
  }

  // 2. If a search query is provided
  if (cleanQuery) {
    const combinedResults: DockerHubRepository[] = [];
    const seenRepos = new Set<string>();

    const headers: Record<string, string> = { Accept: "application/json" };
    if (dockerToken && dockerUsername && cleanQuery.toLowerCase() === dockerUsername.toLowerCase()) {
      headers.Authorization = `Bearer ${dockerToken}`;
    }

    // A) Check if cleanQuery is a specific Docker username / organization namespace
    // (e.g. "harshhaareddy", "bitnami", "grafana", "hashicorp")
    if (!cleanQuery.includes(" ") && !cleanQuery.includes("/")) {
      try {
        const userRepoUrl = `https://hub.docker.com/v2/repositories/${encodeURIComponent(cleanQuery)}/?page_size=50`;
        const userRes = await fetch(userRepoUrl, { headers, next: { revalidate: 120 } });

        if (userRes.ok) {
          const userData = await userRes.json();
          if (Array.isArray(userData.results) && userData.results.length > 0) {
            for (const repo of userData.results) {
              const fullName = `${repo.namespace || cleanQuery}/${repo.name}`;
              if (!seenRepos.has(fullName)) {
                seenRepos.add(fullName);
                combinedResults.push({
                  repoName: fullName,
                  shortDescription: repo.description || `Repository by @${cleanQuery}`,
                  starCount: repo.star_count || 0,
                  pullCount: repo.pull_count || 0,
                  isOfficial: false,
                  publisher: repo.namespace || cleanQuery,
                  categories: repo.is_private ? ["Private Repo"] : ["User Repository"],
                  updatedAt: repo.last_updated,
                });
              }
            }
          }
        }
      } catch {
        // Continue to keyword search
      }
    }

    // B) Check if cleanQuery is an exact image (e.g. "harshhaareddy/kubernetes-dashboard")
    if (cleanQuery.includes("/") && cleanQuery.split("/").length === 2) {
      const [ns, repoName] = cleanQuery.split("/");
      try {
        const exactUrl = `https://hub.docker.com/v2/repositories/${encodeURIComponent(ns)}/${encodeURIComponent(repoName)}/`;
        const exactRes = await fetch(exactUrl, { headers, next: { revalidate: 120 } });
        if (exactRes.ok) {
          const exactData = await exactRes.json();
          const fullName = `${exactData.namespace || ns}/${exactData.name || repoName}`;
          if (!seenRepos.has(fullName)) {
            seenRepos.add(fullName);
            combinedResults.unshift({
              repoName: fullName,
              shortDescription: exactData.description || `Docker container image ${fullName}`,
              starCount: exactData.star_count || 0,
              pullCount: exactData.pull_count || 0,
              isOfficial: false,
              publisher: exactData.namespace || ns,
              categories: ["Direct Match"],
              updatedAt: exactData.last_updated,
            });
          }
        }
      } catch {
        // Continue to general search
      }
    }

    // C) Also query general Docker Hub search API to get related matching repositories
    try {
      const searchUrl = `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(cleanQuery)}&page_size=25`;
      const searchRes = await fetch(searchUrl, {
        headers: { Accept: "application/json" },
        next: { revalidate: 120 },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        for (const item of searchData.results || []) {
          if (!seenRepos.has(item.repo_name)) {
            seenRepos.add(item.repo_name);
            combinedResults.push({
              repoName: item.repo_name,
              shortDescription: item.short_description || "Container image on Docker Hub",
              starCount: item.star_count || 0,
              pullCount: item.pull_count || 0,
              isOfficial: Boolean(item.is_official),
              isAutomated: Boolean(item.is_automated),
              publisher: item.is_official ? "Docker Official" : item.repo_owner || "Community",
              categories: item.is_official ? ["Official Image"] : ["Community"],
            });
          }
        }
      }
    } catch {
      // Fall through
    }

    if (combinedResults.length > 0) {
      let filtered = combinedResults;
      // Only apply strict official/community filter if the user isn't searching for a specific user/repo
      if (filter === "official" && !cleanQuery.includes("/") && combinedResults.some((r) => r.isOfficial)) {
        filtered = filtered.filter((r) => r.isOfficial);
      } else if (filter === "community") {
        filtered = filtered.filter((r) => !r.isOfficial);
      }

      if (category && category !== "all" && category !== "Official Images") {
        const catLower = category.toLowerCase();
        filtered = filtered.filter((r) => r.categories?.some((c) => c.toLowerCase().includes(catLower)));
      }

      return NextResponse.json({
        results: filtered.length > 0 ? filtered : combinedResults,
        total: combinedResults.length,
        source: "docker-hub",
        matchedNamespace: !cleanQuery.includes(" ") ? cleanQuery : undefined,
      });
    }
  }

  // 3. Curated Fallback & Default Browse View
  let curated = CURATED_DOCKER_IMAGES;
  if (cleanQuery) {
    const qLower = cleanQuery.toLowerCase();
    curated = curated.filter(
      (item) => item.repoName.toLowerCase().includes(qLower) || item.shortDescription.toLowerCase().includes(qLower),
    );
  }

  if (category && category !== "all") {
    curated = curated.filter((item) => item.categories?.some((cat) => cat.toLowerCase() === category.toLowerCase()));
  }

  if (filter === "official") {
    curated = curated.filter((item) => item.isOfficial);
  } else if (filter === "community") {
    curated = curated.filter((item) => !item.isOfficial);
  }

  return NextResponse.json({ results: curated, total: curated.length, source: "curated" });
}
