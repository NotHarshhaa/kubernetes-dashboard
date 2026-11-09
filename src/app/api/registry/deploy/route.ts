import * as k8s from "@kubernetes/client-node";
import { type NextRequest, NextResponse } from "next/server";

import type { DeployImageRequest } from "@/lib/docker-registry";
import { getKubeConfig } from "@/lib/k8s-client";
import { k8sStore } from "@/lib/k8s-store";

export async function POST(request: NextRequest) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  try {
    const body: DeployImageRequest = await request.json();
    const {
      image,
      tag = "latest",
      name,
      namespace = "default",
      workloadType = "deployment",
      replicas = 1,
      port,
      env = [],
      useImagePullSecret = false,
      secretName,
    } = body;

    if (!image || !name) {
      return NextResponse.json({ success: false, message: "Image and workload name are required" }, { status: 400 });
    }

    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-+|-+$/g, "");
    const fullImage = tag ? `${image}:${tag}` : image;

    const { kc, isAvailable } = getKubeConfig(request);

    // If demo mode or no cluster available, record in mock store
    if (isDemoMode || !isAvailable) {
      if (workloadType === "deployment") {
        k8sStore.addDeployment({
          name: sanitizedName,
          namespace,
          replicas: Number(replicas) || 1,
          readyReplicas: Number(replicas) || 1,
          availableReplicas: Number(replicas) || 1,
          unavailableReplicas: 0,
          age: "Just now",
          images: [fullImage],
          labels: { app: sanitizedName, "app.kubernetes.io/managed-by": "kubernetes-dashboard" },
        });
      } else {
        k8sStore.addPod({
          name: sanitizedName,
          namespace,
          status: "Running",
          phase: "Running",
          node: "docker-desktop",
          ip: "10.244.0.50",
          createdAt: new Date().toISOString(),
          restarts: 0,
          ready: "1/1",
          containers: [{ name: sanitizedName, image: fullImage, ready: true, restartCount: 0 }],
        });
      }

      return NextResponse.json({
        success: true,
        message: `[Simulated] Successfully deployed ${workloadType} "${sanitizedName}" with image ${fullImage} in namespace "${namespace}"`,
        workloadType,
        name: sanitizedName,
        namespace,
      });
    }

    // Live Kubernetes cluster deployment
    const coreApi = kc.makeApiClient(k8s.CoreV1Api);
    const appsApi = kc.makeApiClient(k8s.AppsV1Api);

    // Optional ImagePullSecret
    const pullSecrets = useImagePullSecret && secretName ? [{ name: secretName }] : undefined;

    const containerPorts = port && Number(port) > 0 ? [{ containerPort: Number(port) }] : undefined;
    const containerEnv =
      env && env.length > 0
        ? env.filter((e) => e.name?.trim()).map((e) => ({ name: e.name.trim(), value: e.value || "" }))
        : undefined;

    if (workloadType === "deployment") {
      const deploymentBody: k8s.V1Deployment = {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: sanitizedName,
          namespace,
          labels: {
            app: sanitizedName,
            "app.kubernetes.io/managed-by": "kubernetes-dashboard",
          },
        },
        spec: {
          replicas: Number(replicas) || 1,
          selector: {
            matchLabels: { app: sanitizedName },
          },
          template: {
            metadata: {
              labels: { app: sanitizedName },
            },
            spec: {
              containers: [
                {
                  name: sanitizedName,
                  image: fullImage,
                  ports: containerPorts,
                  env: containerEnv,
                },
              ],
              imagePullSecrets: pullSecrets,
            },
          },
        },
      };

      await appsApi.createNamespacedDeployment({
        namespace,
        body: deploymentBody,
      });

      return NextResponse.json({
        success: true,
        message: `Deployment "${sanitizedName}" created in namespace "${namespace}" pulling ${fullImage}.`,
        workloadType: "deployment",
        name: sanitizedName,
        namespace,
      });
    }

    // Workload type: Standalone Pod
    const podBody: k8s.V1Pod = {
      apiVersion: "v1",
      kind: "Pod",
      metadata: {
        name: sanitizedName,
        namespace,
        labels: {
          app: sanitizedName,
          "app.kubernetes.io/managed-by": "kubernetes-dashboard",
        },
      },
      spec: {
        containers: [
          {
            name: sanitizedName,
            image: fullImage,
            ports: containerPorts,
            env: containerEnv,
          },
        ],
        imagePullSecrets: pullSecrets,
        restartPolicy: "Always",
      },
    };

    await coreApi.createNamespacedPod({
      namespace,
      body: podBody,
    });

    return NextResponse.json({
      success: true,
      message: `Pod "${sanitizedName}" launched in namespace "${namespace}" pulling ${fullImage}.`,
      workloadType: "pod",
      name: sanitizedName,
      namespace,
    });
  } catch (error: unknown) {
    const err = error as { response?: { body?: { message?: string } }; body?: { message?: string }; message?: string };
    const errorMsg =
      err?.response?.body?.message || err?.body?.message || err?.message || "Failed to deploy image to cluster";
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
