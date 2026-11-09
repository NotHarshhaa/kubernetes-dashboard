import {
  Activity,
  Anchor,
  Boxes,
  BrainCircuit,
  CircleDollarSign,
  Container,
  Database,
  FolderKey,
  GitFork,
  GitPullRequest,
  HardDrive,
  HardDriveDownload,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Network,
  Package,
  Scale,
  Server,
  Settings,
  ShieldCheck,
  SquareTerminal,
  Waypoints,
} from "lucide-react";

export type NavBadge = "new" | "updated" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Cluster Resources",
    items: [
      {
        id: "overview",
        title: "Overview",
        url: "/dashboard/overview",
        icon: LayoutDashboard,
      },
      {
        id: "workloads",
        title: "Workloads",
        url: "/dashboard/workloads",
        icon: Boxes,
      },
      {
        id: "pods",
        title: "Pods",
        url: "/dashboard/pods",
        icon: Container,
      },
      {
        id: "deployments",
        title: "Deployments",
        url: "/dashboard/deployments",
        icon: Database,
      },
      {
        id: "services",
        title: "Services & Ingress",
        url: "/dashboard/services",
        icon: Network,
      },
      {
        id: "gateways",
        title: "Gateway API",
        url: "/dashboard/gateways",
        icon: GitFork,
      },
      {
        id: "crds",
        title: "Custom Resources",
        url: "/dashboard/crds",
        icon: Package,
      },
      {
        id: "config",
        title: "Config & Secrets",
        url: "/dashboard/config",
        icon: FolderKey,
      },
      {
        id: "storage",
        title: "Storage & PVs",
        url: "/dashboard/storage",
        icon: HardDrive,
      },
      {
        id: "helm",
        title: "Helm Hub",
        url: "/dashboard/helm",
        icon: Anchor,
      },
      {
        id: "gitops",
        title: "GitOps Hub",
        url: "/dashboard/gitops",
        icon: GitPullRequest,
        badge: "new",
      },
      {
        id: "registry",
        title: "Image Registry",
        url: "/dashboard/registry",
        icon: HardDriveDownload,
        badge: "new",
      },
    ],
  },
  {
    id: 2,
    label: "Operations & Telemetry",
    items: [
      {
        id: "nodes",
        title: "Nodes",
        url: "/dashboard/nodes",
        icon: Server,
      },
      {
        id: "namespaces",
        title: "Namespaces",
        url: "/dashboard/namespaces",
        icon: Layers,
      },
      {
        id: "ai-workloads",
        title: "AI & GPU Workloads",
        url: "/dashboard/ai-workloads",
        icon: BrainCircuit,
        badge: "new",
      },
      {
        id: "autoscaling",
        title: "Autoscaling (HPA)",
        url: "/dashboard/autoscaling",
        icon: Scale,
      },
      {
        id: "security",
        title: "Security & CIS",
        url: "/dashboard/security",
        icon: ShieldCheck,
      },
      {
        id: "topology",
        title: "Topology Map",
        url: "/dashboard/topology",
        icon: Waypoints,
      },
      {
        id: "terminal",
        title: "Web Terminal",
        url: "/dashboard/terminal",
        icon: SquareTerminal,
      },
      {
        id: "monitoring",
        title: "Monitoring",
        url: "/dashboard/monitoring",
        icon: Activity,
      },
      {
        id: "finops",
        title: "FinOps & Cost",
        url: "/dashboard/finops",
        icon: CircleDollarSign,
        badge: "new",
      },
    ],
  },
  {
    id: 3,
    label: "System",
    items: [
      {
        id: "settings",
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];
