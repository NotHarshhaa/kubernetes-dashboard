"use client";

import { Check, Copy, Download, HardDrive, Rocket, Shield, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { type DockerHubRepository, formatPullCount } from "@/lib/docker-registry";

interface ImageCardProps {
  image: DockerHubRepository;
  onDeploy: (image: DockerHubRepository) => void;
}

export function ImageCard({ image, onDeploy }: ImageCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`docker pull ${image.repoName}:latest`);
    setCopied(true);
    toast.success(`Copied "docker pull ${image.repoName}"`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs group">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <HardDrive className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm truncate font-mono text-foreground" title={image.repoName}>
                  {image.repoName}
                </span>
                {image.isOfficial && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 py-0 h-4"
                  >
                    <Shield className="h-2.5 w-2.5 mr-0.5 inline" /> Official
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{image.publisher || "Docker Community"}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            title="Copy docker pull command"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 pb-3 text-xs text-muted-foreground">
        <p className="line-clamp-2 leading-relaxed min-h-[36px]" title={image.shortDescription}>
          {image.shortDescription}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5 text-sky-500" />
            <span>{formatPullCount(image.pullCount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
            <span>{image.starCount.toLocaleString()}</span>
          </div>
          {image.categories && image.categories.length > 0 && (
            <div className="ml-auto">
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                {image.categories[0]}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => onDeploy(image)}
          size="sm"
          className="w-full text-xs gap-1.5 font-medium group-hover:shadow-xs"
        >
          <Rocket className="h-3.5 w-3.5" /> Deploy to Cluster
        </Button>
      </CardFooter>
    </Card>
  );
}
