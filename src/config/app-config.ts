import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Kubernetes Dashboard",
  url: "https://github.com/NotHarshhaa/kubernetes-dashboard",
  repository: "https://github.com/NotHarshhaa/kubernetes-dashboard",
  version: packageJson.version,
  copyright: `© ${currentYear}, Kubernetes Dashboard.`,
  meta: {
    title: "Kubernetes Dashboard: Cluster Management & Monitoring",
    description:
      "Modern Kubernetes cluster management and monitoring dashboard with real-time workloads, nodes, storage, Helm, security, and terminal support.",
  },
};
