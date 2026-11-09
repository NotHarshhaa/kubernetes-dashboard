"use client";

import { Boxes, Check, Container, Copy, Loader2, Plus, Rocket, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useNamespaces } from "@/app/(main)/dashboard/_components/use-namespaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import {
  type DeployImageRequest,
  type DockerAccount,
  type DockerHubRepository,
  type DockerImageTag,
  formatBytes,
  getDefaultPortForImage,
} from "@/lib/docker-registry";

interface DeployImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: DockerHubRepository | null;
  dockerAccount: DockerAccount | null;
  onDeployed?: () => void;
}

export function DeployImageDialog({ open, onOpenChange, image, dockerAccount, onDeployed }: DeployImageDialogProps) {
  const namespaces = useNamespaces();
  const [tags, setTags] = useState<DockerImageTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [selectedTag, setSelectedTag] = useState("latest");
  const [customTag, setCustomTag] = useState("");

  const [workloadType, setWorkloadType] = useState<"deployment" | "pod">("deployment");
  const [workloadName, setWorkloadName] = useState("");
  const [targetNamespace, setTargetNamespace] = useState("default");
  const [replicas, setReplicas] = useState(1);
  const [port, setPort] = useState<number | string>("");
  const [envVars, setEnvVars] = useState<{ name: string; value: string }[]>([]);
  const [usePullSecret, setUsePullSecret] = useState(false);
  const [secretName, setSecretName] = useState("docker-registry-secret");
  const [deploying, setDeploying] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    if (image && open) {
      const cleanName = image.repoName.split("/").pop() || "app";
      setWorkloadName(`${cleanName}-app`);
      setPort(getDefaultPortForImage(image.repoName));
      setSelectedTag("latest");
      setCustomTag("");
      setEnvVars([]);
      setUsePullSecret(Boolean(dockerAccount?.isConnected));

      setLoadingTags(true);
      apiClient
        .getRegistryTags(image.repoName)
        .then((res) => {
          setTags(res.tags);
          if (res.tags.length > 0 && !res.tags.some((t) => t.name === "latest")) {
            setSelectedTag(res.tags[0].name);
          }
        })
        .catch(() => {
          setTags([]);
        })
        .finally(() => {
          setLoadingTags(false);
        });
    }
  }, [image, open, dockerAccount]);

  if (!image) return null;

  const effectiveTag = customTag.trim() || selectedTag;
  const fullImageString = `${image.repoName}:${effectiveTag}`;

  const cliDeployCmd =
    workloadType === "deployment"
      ? `kubectl create deployment ${workloadName} --image=${fullImageString} --replicas=${replicas} -n ${targetNamespace}`
      : `kubectl run ${workloadName} --image=${fullImageString} -n ${targetNamespace}`;

  const dockerPullCmd = `docker pull ${fullImageString}`;

  const handleAddEnv = () => {
    setEnvVars([...envVars, { name: "", value: "" }]);
  };

  const handleRemoveEnv = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleEnvChange = (index: number, field: "name" | "value", value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const handleCopyCli = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    toast.success("Command copied to clipboard");
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workloadName.trim()) {
      toast.error("Please specify a workload name");
      return;
    }

    setDeploying(true);
    try {
      const req: DeployImageRequest = {
        image: image.repoName,
        tag: effectiveTag,
        name: workloadName.trim(),
        namespace: targetNamespace,
        workloadType,
        replicas: workloadType === "deployment" ? Number(replicas) || 1 : undefined,
        port: port ? Number(port) : undefined,
        env: envVars.filter((ev) => ev.name.trim().length > 0),
        useImagePullSecret: usePullSecret,
        secretName: usePullSecret ? secretName : undefined,
      };

      const res = await apiClient.deployRegistryImage(req);
      if (res.success) {
        toast.success(res.message);
        onOpenChange(false);
        if (onDeployed) onDeployed();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to deploy image");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Container className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Deploy <span className="font-mono text-primary">{image.repoName}</span>
                {image.isOfficial && (
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                    Official
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="line-clamp-1">{image.shortDescription}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="configure" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Deployment Configuration</TabsTrigger>
            <TabsTrigger value="cli">CLI & Manifest Helper</TabsTrigger>
          </TabsList>

          <TabsContent value="configure">
            <form onSubmit={handleDeploy} className="space-y-4 py-2">
              {/* Tag Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Image Tag</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Target: <code className="font-mono text-primary font-bold">{fullImageString}</code>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={selectedTag} onValueChange={setSelectedTag} disabled={loadingTags}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder={loadingTags ? "Loading tags..." : "Select tag"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingTags ? (
                        <SelectItem value="loading" disabled>
                          Fetching tags from Docker Hub...
                        </SelectItem>
                      ) : tags.length > 0 ? (
                        tags.map((t) => (
                          <SelectItem key={t.name} value={t.name} className="text-xs">
                            <span className="font-mono">{t.name}</span>
                            {t.size > 0 && (
                              <span className="ml-2 text-muted-foreground text-[10px]">({formatBytes(t.size)})</span>
                            )}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="latest">latest</SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Or type custom tag (e.g. 1.25-alpine)"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Workload Type & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Workload Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={workloadType === "deployment" ? "default" : "outline"}
                      className="flex-1 text-xs gap-1.5"
                      onClick={() => setWorkloadType("deployment")}
                    >
                      <Boxes className="h-3.5 w-3.5" /> Deployment
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={workloadType === "pod" ? "default" : "outline"}
                      className="flex-1 text-xs gap-1.5"
                      onClick={() => setWorkloadType("pod")}
                    >
                      <Container className="h-3.5 w-3.5" /> Standalone Pod
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workload-name" className="text-xs font-semibold">
                    Workload Name
                  </Label>
                  <Input
                    id="workload-name"
                    value={workloadName}
                    onChange={(e) => setWorkloadName(e.target.value)}
                    placeholder="e.g. nginx-web"
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Namespace & Replicas / Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Target Namespace</Label>
                  <Select value={targetNamespace} onValueChange={setTargetNamespace}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Namespace" />
                    </SelectTrigger>
                    <SelectContent>
                      {namespaces.map((ns) => (
                        <SelectItem key={ns} value={ns} className="text-xs">
                          {ns}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {workloadType === "deployment" ? (
                  <div className="space-y-2">
                    <Label htmlFor="replicas" className="text-xs font-semibold">
                      Replicas
                    </Label>
                    <Input
                      id="replicas"
                      type="number"
                      min={1}
                      max={20}
                      value={replicas}
                      onChange={(e) => setReplicas(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Restart Policy</Label>
                    <Input value="Always" disabled className="text-xs bg-muted text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="container-port" className="text-xs font-semibold">
                    Container Port
                  </Label>
                  <Input
                    id="container-port"
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="e.g. 80"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Environment Variables */}
              <div className="space-y-2 pt-1 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Environment Variables</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddEnv} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Add Var
                  </Button>
                </div>
                {envVars.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No environment variables specified.</p>
                ) : (
                  <div className="space-y-2">
                    {envVars.map((ev, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          placeholder="KEY"
                          value={ev.name}
                          onChange={(e) => handleEnvChange(idx, "name", e.target.value)}
                          className="text-xs font-mono flex-1"
                        />
                        <Input
                          placeholder="VALUE"
                          value={ev.value}
                          onChange={(e) => handleEnvChange(idx, "value", e.target.value)}
                          className="text-xs flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEnv(idx)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Pull Secret */}
              <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pull-secret-switch" className="text-xs font-semibold">
                      Use Docker ImagePullSecret
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Enable to pull private images using your connected Docker credentials.
                    </p>
                  </div>
                  <Switch id="pull-secret-switch" checked={usePullSecret} onCheckedChange={setUsePullSecret} />
                </div>
                {usePullSecret && (
                  <div className="pt-2">
                    <Input
                      value={secretName}
                      onChange={(e) => setSecretName(e.target.value)}
                      placeholder="Secret name (e.g. docker-registry-secret)"
                      className="text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={deploying} className="gap-2">
                  {deploying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Deploying to Cluster...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" /> Deploy to Cluster
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="cli" className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Kubectl Deploy Command</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyCli(cliDeployCmd)}
                  className="h-7 text-xs gap-1"
                >
                  {copiedCmd ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />} Copy
                </Button>
              </div>
              <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all">
                {cliDeployCmd}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Docker Local Pull Command</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyCli(dockerPullCmd)}
                  className="h-7 text-xs gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all">
                {dockerPullCmd}
              </pre>
            </div>

            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">💡 Pro-tip:</p>
              <p>
                When you deploy using this dialog, our dashboard executes the native Kubernetes API call directly on
                your local Docker Desktop cluster or configured cloud cluster!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
