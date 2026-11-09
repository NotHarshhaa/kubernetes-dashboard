"use client";

import { Container, Database, GitFork, Globe, Network, RefreshCw, Search, Server } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useNamespaces } from "@/app/(main)/dashboard/_components/use-namespaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient, type Deployment, type Ingress, type Node, type Pod, type Service } from "@/lib/api-client";

type TopologyKind = "Ingress" | "Service" | "Deployment" | "Pod" | "Node";
type TopologyStatus = "healthy" | "warning" | "error";

interface TopologyNode {
  id: string;
  kind: TopologyKind;
  name: string;
  namespace: string;
  status: TopologyStatus;
  detail: string;
  targetIds: string[];
}

const kindIcon: Record<TopologyKind, React.ElementType> = {
  Ingress: Globe,
  Service: Network,
  Deployment: Database,
  Pod: Container,
  Node: Server,
};

const statusClass: Record<TopologyStatus, string> = {
  healthy: "border-emerald-500/50 bg-emerald-500/5",
  warning: "border-amber-500/50 bg-amber-500/5",
  error: "border-rose-500/50 bg-rose-500/5",
};

const statusDot: Record<TopologyStatus, string> = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-rose-500",
};

const LAYERS: { kind: TopologyKind; label: string }[] = [
  { kind: "Ingress", label: "Ingress" },
  { kind: "Service", label: "Services" },
  { kind: "Deployment", label: "Workloads" },
  { kind: "Pod", label: "Pods" },
  { kind: "Node", label: "Nodes" },
];

export function TopologyView() {
  const namespaces = useNamespaces();
  const [nodes, setNodes] = useState<TopologyNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState("all");

  const fetchTopologyData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const ns = selectedNamespace === "all" ? undefined : selectedNamespace;
      const [ingresses, services, deployments, pods, clusterNodes] = await Promise.all([
        apiClient.getIngresses(ns),
        apiClient.getServices(ns),
        apiClient.getDeployments(ns),
        apiClient.getPods(ns),
        apiClient.getNodes(),
      ]);

      const topologyNodes = buildTopology(ingresses, services, deployments, pods, clusterNodes);
      setNodes(topologyNodes);
      setSelectedNode((prev) =>
        prev && topologyNodes.some((n) => n.id === prev.id) ? prev : (topologyNodes[0] ?? null),
      );
    } catch (err) {
      toast.error(`Failed to build topology: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedNamespace]);

  useEffect(() => {
    void fetchTopologyData();
  }, [fetchTopologyData]);

  const matches = useCallback(
    (node: TopologyNode) => !searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase()),
    [searchTerm],
  );

  const connections = useMemo(() => {
    if (!selectedNode) return { incoming: [], outgoing: [] };
    return {
      incoming: nodes.filter((n) => n.targetIds.includes(selectedNode.id)),
      outgoing: selectedNode.targetIds
        .map((id) => nodes.find((n) => n.id === id))
        .filter((n): n is TopologyNode => !!n),
    };
  }, [selectedNode, nodes]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="from-card via-card/90 to-muted/30 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="border-primary/20 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl border">
            <GitFork className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Architecture Topology Map</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Live dependency graph from ingress gateways down to compute nodes
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Filter resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-52 pl-8 text-xs"
            />
          </div>
          <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
            <SelectTrigger size="sm" className="w-44">
              <span className="text-muted-foreground">Namespace:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">All namespaces</SelectItem>
              {namespaces.map((ns) => (
                <SelectItem key={ns} value={ns} className="font-mono text-xs">
                  {ns}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchTopologyData} disabled={isRefreshing}>
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Layer columns */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {LAYERS.map((layer) => {
          const layerNodes = nodes.filter((n) => n.kind === layer.kind && matches(n));
          const Icon = kindIcon[layer.kind];
          return (
            <Card key={layer.kind} className="min-h-48">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                  <Icon className="text-primary size-3.5" />
                  {layer.label}
                  <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                    {layerNodes.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                {loading ? (
                  <div className="text-muted-foreground py-6 text-center text-[11px]">Building graph...</div>
                ) : layerNodes.length === 0 ? (
                  <div className="text-muted-foreground py-6 text-center text-[11px]">No resources</div>
                ) : (
                  layerNodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNode(node)}
                      className={`flex items-start gap-2 rounded-lg border p-2 text-left transition-all hover:shadow-xs ${statusClass[node.status]} ${
                        selectedNode?.id === node.id ? "ring-primary/50 ring-2" : ""
                      }`}
                    >
                      <span className={`mt-1 size-1.5 shrink-0 rounded-full ${statusDot[node.status]}`} />
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground block truncate font-mono text-[11px] font-semibold">
                          {node.name}
                        </span>
                        {node.kind !== "Node" && (
                          <span className="text-muted-foreground block truncate text-[10px]">{node.namespace}</span>
                        )}
                      </span>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              {(() => {
                const Icon = kindIcon[selectedNode.kind];
                return (
                  <div className="border-primary/20 bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg border">
                    <Icon className="size-4" />
                  </div>
                );
              })()}
              <div>
                <CardTitle className="font-mono text-sm">{selectedNode.name}</CardTitle>
                <CardDescription className="text-xs">
                  {selectedNode.kind} {selectedNode.kind !== "Node" && `• ${selectedNode.namespace}`}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={`ml-auto gap-1 text-[10px] capitalize ${statusClass[selectedNode.status]}`}
              >
                <span className={`size-1.5 rounded-full ${statusDot[selectedNode.status]}`} />
                {selectedNode.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-xs md:grid-cols-3">
            <div className="bg-muted/20 rounded-lg border p-3">
              <span className="text-muted-foreground mb-1 block text-[10px] font-semibold tracking-wider uppercase">
                Details
              </span>
              <p className="text-foreground/90 leading-snug">{selectedNode.detail}</p>
            </div>
            <div className="bg-muted/20 rounded-lg border p-3">
              <span className="text-muted-foreground mb-1.5 block text-[10px] font-semibold tracking-wider uppercase">
                Traffic From ({connections.incoming.length})
              </span>
              <div className="flex flex-col gap-1">
                {connections.incoming.length === 0 ? (
                  <span className="text-muted-foreground text-[11px]">No upstream connections</span>
                ) : (
                  connections.incoming.map((n) => (
                    <span key={n.id} className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className={`size-1.5 rounded-full ${statusDot[n.status]}`} />
                      {n.kind}/{n.name}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-3">
              <span className="text-muted-foreground mb-1.5 block text-[10px] font-semibold tracking-wider uppercase">
                Routes To ({connections.outgoing.length})
              </span>
              <div className="flex flex-col gap-1">
                {connections.outgoing.length === 0 ? (
                  <span className="text-muted-foreground text-[11px]">No downstream connections</span>
                ) : (
                  connections.outgoing.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setSelectedNode(n)}
                      className="hover:text-primary flex items-center gap-1.5 text-left font-mono text-[11px] transition-colors"
                    >
                      <span className={`size-1.5 rounded-full ${statusDot[n.status]}`} />
                      {n.kind}/{n.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function buildTopology(
  ingresses: Ingress[],
  services: Service[],
  deployments: Deployment[],
  pods: Pod[],
  clusterNodes: Node[],
): TopologyNode[] {
  const topologyNodes: TopologyNode[] = [];

  // 1. Ingresses
  ingresses.forEach((ing) => {
    const targetServices = ing.paths.map((p) => `svc-${ing.namespace}-${p.backend}`);
    topologyNodes.push({
      id: `ing-${ing.namespace}-${ing.name}`,
      kind: "Ingress",
      name: ing.name,
      namespace: ing.namespace,
      status: "healthy",
      detail: `Hosts: ${ing.hosts.join(", ")}`,
      targetIds: targetServices,
    });
  });

  // 2. Services
  services.forEach((svc) => {
    const targetDeps = deployments
      .filter((d) => d.namespace === svc.namespace && (d.name === svc.name || svc.name.startsWith(d.name)))
      .map((d) => `dep-${d.namespace}-${d.name}`);

    topologyNodes.push({
      id: `svc-${svc.namespace}-${svc.name}`,
      kind: "Service",
      name: svc.name,
      namespace: svc.namespace,
      status: "healthy",
      detail: `Type: ${svc.type} • Ports: ${svc.ports}`,
      targetIds: targetDeps,
    });
  });

  // 3. Deployments
  deployments.forEach((dep) => {
    const targetPods = pods
      .filter((p) => p.namespace === dep.namespace && p.name.startsWith(dep.name))
      .map((p) => `pod-${p.namespace}-${p.name}`);

    const isHealthy = dep.readyReplicas === dep.replicas;

    topologyNodes.push({
      id: `dep-${dep.namespace}-${dep.name}`,
      kind: "Deployment",
      name: dep.name,
      namespace: dep.namespace,
      status: isHealthy ? "healthy" : "warning",
      detail: `Replicas: ${dep.readyReplicas}/${dep.replicas} • Image: ${dep.images[0] ?? "-"}`,
      targetIds: targetPods,
    });
  });

  // 4. Pods
  pods.forEach((pod) => {
    const targetNode = clusterNodes.find((n) => n.name === pod.node);
    const targetIds = targetNode ? [`node-${targetNode.name}`] : [];

    topologyNodes.push({
      id: `pod-${pod.namespace}-${pod.name}`,
      kind: "Pod",
      name: pod.name,
      namespace: pod.namespace,
      status: pod.status === "Running" ? "healthy" : "error",
      detail: `Status: ${pod.status} • Node: ${pod.node} • IP: ${pod.ip}`,
      targetIds,
    });
  });

  // 5. Nodes
  clusterNodes.forEach((node) => {
    topologyNodes.push({
      id: `node-${node.name}`,
      kind: "Node",
      name: node.name,
      namespace: "infrastructure",
      status: node.status === "Ready" ? "healthy" : "error",
      detail: `CPU: ${node.cpuCapacity}c • Memory: ${node.memoryCapacity} • OS: ${node.osImage}`,
      targetIds: [],
    });
  });

  return topologyNodes;
}
