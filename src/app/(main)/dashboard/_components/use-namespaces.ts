"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";

export function useNamespaces() {
  const [namespaces, setNamespaces] = useState<string[]>([]);

  useEffect(() => {
    apiClient
      .getNamespaces()
      .then((ns) => setNamespaces(ns.map((n) => n.name)))
      .catch(() => setNamespaces([]));
  }, []);

  return namespaces;
}
