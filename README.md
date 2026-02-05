# Kubernetes Dashboard

A modern, responsive Kubernetes dashboard built with Next.js and shadcn/ui. This application provides a comprehensive interface for monitoring and managing Kubernetes clusters.

## Features

- **Cluster Overview**: Real-time cluster metrics and health status
- **Pod Management**: View, monitor, and manage pods across all namespaces
- **Service Management**: Monitor services and their configurations
- **Node Monitoring**: Track node health and resource utilization
- **Deployment Management**: Monitor deployment status and replica counts
- **Real-time Monitoring**: CPU, memory, and network usage charts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Kubernetes Integration**: @kubernetes/client-node

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Access to a Kubernetes cluster
- kubectl configured with cluster access

## Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Run the development server**:
```bash
npm run dev
```

3. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## Kubernetes Setup

The dashboard uses your local kubectl configuration to connect to your Kubernetes cluster. Make sure:

1. Your kubectl is properly configured
2. You have the necessary permissions to view cluster resources
3. The cluster is accessible from your development environment

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── pods/              # Pods management page
│   ├── services/          # Services management page
│   ├── nodes/             # Node monitoring page
│   ├── deployments/       # Deployment management page
│   ├── monitoring/        # Real-time monitoring page
│   └── page.tsx          # Dashboard overview
├── components/
│   ├── ui/                # shadcn/ui components
│   └── dashboard-layout.tsx  # Main layout component
└── lib/
    ├── utils.ts           # Utility functions
    └── kubernetes.ts      # Kubernetes API service
```

## Available Pages

- **/** - Cluster overview with key metrics
- **/pods** - Pod management and monitoring
- **/services** - Service configuration and status
- **/nodes** - Node health and resource usage
- **/deployments** - Deployment status and management
- **/monitoring** - Real-time metrics and charts

## Development

### Adding New Features

1. Create new pages in the `src/app/` directory
2. Add Kubernetes API methods in `src/lib/kubernetes.ts`
3. Use shadcn/ui components for consistent UI
4. Follow the existing code patterns and TypeScript conventions

### Kubernetes API Integration

The application uses the official Kubernetes JavaScript client. All API interactions are handled through the `kubernetesService` in `src/lib/kubernetes.ts`.

## Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Deployment Options

- **Vercel**: Deploy directly to Vercel for serverless hosting
- **Docker**: Containerize the application for Kubernetes deployment
- **Static Export**: Generate static files for CDN hosting

## Security Considerations

- The dashboard runs in the browser and connects directly to your Kubernetes cluster
- Ensure your kubeconfig has appropriate read-only permissions
- Consider using a service account with limited permissions for production deployments
- Enable RBAC to restrict access to sensitive cluster resources

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
