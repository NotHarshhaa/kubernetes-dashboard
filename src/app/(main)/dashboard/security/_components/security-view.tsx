"use client";

import { useCallback, useEffect, useState } from "react";

import { FileCode2, Network, RefreshCw, Search, ShieldCheck, ShieldQuestion, UserCheck, Wrench } from "lucide-react";
import { toast } from "sonner";

import { YamlViewerDialog } from "@/app/(main)/dashboard/_components/yaml-viewer-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, type SecurityFinding, type SecurityReport } from "@/lib/api-client";

const severityClass = (severity: SecurityFinding["severity"]) => {
  switch (severity) {
    case "CRITICAL":
      return "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400";
    case "HIGH":
      return "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "MEDIUM":
      return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:
      return "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400";
  }
};

const categoryIcon = (category: SecurityFinding["category"]) => {
  switch (category) {
    case "Workload":
      return ShieldCheck;
    case "Network":
      return Network;
    case "RBAC":
      return UserCheck;
    default:
      return Wrench;
  }
};

export function SecurityView() {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [yamlDialog, setYamlDialog] = useState<{ open: boolean; kind: string; name: string; namespace: string }>({
    open: false,
    kind: "",
    name: "",
    namespace: "",
  });

  const fetchReport = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await apiClient.getSecurityReport();
      setReport(data);
    } catch (err) {
      toast.error(`Failed to fetch security report: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const findings = (report?.findings ?? []).filter((f) => {
    const matchesSearch =
      !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.resourceName.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === "all" || f.severity === severityFilter;
    const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const categoryCards = report
    ? [
        {
          label: "Workload",
          score: report.categoryScores.workload,
          icon: ShieldCheck,
          iconClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Network",
          score: report.categoryScores.network,
          icon: Network,
          iconClass: "border-violet-500/20 bg-violet-500/10 text-violet-500",
        },
        {
          label: "RBAC",
          score: report.categoryScores.rbac,
          icon: UserCheck,
          iconClass: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        },
        {
          label: "Configuration",
          score: report.categoryScores.config,
          icon: Wrench,
          iconClass: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="from-card via-card/90 to-muted/30 flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-r p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-14 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {report?.grade ?? "-"}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Security & CIS Benchmarks</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Overall score {report?.overallScore ?? "-"} / 100 • {report?.scannedResources ?? 0} resources scanned •{" "}
              {report?.passedChecks ?? 0} passed, {report?.failedChecks ?? 0} failed
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReport} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Re-scan
        </Button>
      </div>

      {/* Category scores */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : categoryCards.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card key={cat.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                      <Icon className={`size-3.5 rounded-md ${cat.iconClass.split(" ").slice(2).join(" ")}`} />
                      {cat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-2xl font-bold tracking-tight">{cat.score}</div>
                    <Progress value={cat.score} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Findings */}
      <Card>
        <CardHeader className="border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldQuestion className="text-primary size-4" />
              Findings ({findings.length})
            </CardTitle>
            <CardDescription>Violations with remediation guidance, sorted by severity</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  placeholder="Search findings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-56 pl-8 text-xs"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger size="sm" className="w-36">
                  <span className="text-muted-foreground">Severity:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger size="sm" className="w-44">
                  <span className="text-muted-foreground">Category:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Workload">Workload</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="RBAC">RBAC</SelectItem>
                  <SelectItem value="Configuration">Configuration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-3 font-normal">Severity</TableHead>
                <TableHead className="py-3 font-normal">Finding</TableHead>
                <TableHead className="hidden py-3 font-normal md:table-cell">Resource</TableHead>
                <TableHead className="hidden py-3 font-normal lg:table-cell">Remediation</TableHead>
                <TableHead className="w-10 py-3 font-normal" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-12 text-xs">
                    Loading security report...
                  </TableCell>
                </TableRow>
              ) : findings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center">
                    <div className="text-muted-foreground flex flex-col items-center gap-1.5 text-xs">
                      <ShieldCheck className="size-5 text-emerald-500 opacity-70" />
                      No findings match the current filters
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                findings.map((finding) => {
                  const Icon = categoryIcon(finding.category);
                  return (
                    <TableRow key={finding.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1 font-mono text-[10px] ${severityClass(finding.severity)}`}
                        >
                          {finding.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{finding.title}</p>
                          <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
                            <Icon className="size-2.5" />
                            {finding.category}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] md:table-cell">
                        <button
                          type="button"
                          onClick={() =>
                            setYamlDialog({
                              open: true,
                              kind: finding.resourceKind,
                              name: finding.resourceName,
                              namespace: finding.namespace,
                            })
                          }
                          className="text-left"
                        >
                          <span className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-mono text-xs transition-colors">
                            <FileCode2 className="size-3" />
                            {finding.resourceKind}/{finding.resourceName}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden max-w-[320px] text-xs lg:table-cell">
                        <span className="line-clamp-2">{finding.remediation}</span>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <YamlViewerDialog
        open={yamlDialog.open}
        onOpenChange={(open) => setYamlDialog((prev) => ({ ...prev, open }))}
        resourceKind={yamlDialog.kind}
        resourceName={yamlDialog.name}
        namespace={yamlDialog.namespace}
      />
    </div>
  );
}
