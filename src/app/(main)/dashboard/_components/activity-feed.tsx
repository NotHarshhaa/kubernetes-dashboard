"use client";

import { Activity, AlertTriangle, Clock, Container, Database, Network, RefreshCw, Server } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  type: "pod" | "service" | "deployment" | "node" | "alert";
  action: "created" | "updated" | "deleted" | "scaled" | "error" | "success";
  resource: string;
  namespace: string;
  timestamp: Date | string;
  message: string;
  severity?: "low" | "medium" | "high";
}

const getIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "pod":
      return Container;
    case "service":
      return Network;
    case "deployment":
      return Database;
    case "node":
      return Server;
    case "alert":
      return AlertTriangle;
    default:
      return Activity;
  }
};

const getActionBadge = (action: ActivityItem["action"]) => {
  switch (action) {
    case "created":
    case "success":
      return (
        <Badge variant="outline" className="h-4.5 border-emerald-500/30 bg-emerald-500/5 px-1.5 text-[10px] capitalize">
          {action}
        </Badge>
      );
    case "deleted":
    case "error":
      return (
        <Badge variant="destructive" className="h-4.5 px-1.5 text-[10px] capitalize">
          {action}
        </Badge>
      );
    case "scaled":
    case "updated":
      return (
        <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px] capitalize">
          {action}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="h-4.5 px-1.5 text-[10px] capitalize">
          {action}
        </Badge>
      );
  }
};

const formatTimeAgo = (timestamp: Date | string) => {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch("/api/activities");
      if (response.ok) {
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error("Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshActivities = async () => {
    setIsRefreshing(true);
    await fetchActivities();
    setIsRefreshing(false);
  };

  useEffect(() => {
    void fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4 text-emerald-500" />
          Activity Stream
        </CardTitle>
        <CardDescription>Real-time cluster audit log and lifecycle events</CardDescription>
        <CardAction>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshActivities}
            disabled={isRefreshing}
            className="size-8 shrink-0"
            aria-label="Refresh activity stream"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
              Loading activity stream...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-muted-foreground flex h-32 flex-col items-center justify-center gap-1.5 text-xs">
              <Activity className="size-5 opacity-50" />
              No recent cluster activity
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className="bg-muted/20 hover:bg-muted/50 flex items-start gap-3 rounded-xl border p-3 transition-colors"
                >
                  <div className="bg-muted text-foreground mt-0.5 shrink-0 rounded-lg border p-2">
                    <Icon className="size-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                      {getActionBadge(activity.action)}
                      <Badge variant="outline" className="text-muted-foreground h-4.5 px-1.5 font-mono text-[10px]">
                        {activity.namespace}
                      </Badge>
                    </div>
                    <p className="text-foreground truncate font-mono text-xs font-semibold">{activity.resource}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">{activity.message}</p>
                  </div>

                  <div className="text-muted-foreground flex shrink-0 items-center gap-1 font-mono text-[10px]">
                    <Clock className="size-3" />
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
