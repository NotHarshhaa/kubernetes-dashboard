# Kubernetes Dashboard

![GitHub stars](https://img.shields.io/github/stars/NotHarshhaa/kubernetes-dashboard?style=social)
![GitHub forks](https://img.shields.io/github/forks/NotHarshhaa/kubernetes-dashboard?style=social)
![Docker Pulls](https://img.shields.io/docker/pulls/harshhaareddy/kubernetes-dashboard)
![Docker Stars](https://img.shields.io/docker/stars/harshhaareddy/kubernetes-dashboard)
![License](https://img.shields.io/badge/license-MIT-blue)

A modern, responsive Kubernetes dashboard built with Next.js and shadcn/ui. Monitor and manage your Kubernetes clusters with a beautiful, intuitive interface.

## 🐳 Docker Hub

[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-harshhaareddy%2Fkubernetes--dashboard-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/harshhaareddy/kubernetes-dashboard)

### Quick Start
```bash
# Pull and run the dashboard
docker run -p 3000:3000 harshhaareddy/kubernetes-dashboard:latest

# Access at http://localhost:3000
```

## 🚀 Usage

### Option 1: Docker (Recommended)
```bash
# Pull and run with Docker Hub image
docker run -p 3000:3000 harshhaareddy/kubernetes-dashboard:latest

# Or with Docker Compose
docker-compose up -d
```

### Option 2: Kubernetes
```bash
# Deploy to Kubernetes cluster
kubectl apply -f k8s/

# Access via NodePort: http://<node-ip>:30007
```

### Option 3: Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

## 🌟 Features

- **Cluster Overview**: Real-time cluster metrics and health status
- **Pod Management**: View and monitor pods across all namespaces
- **Service Management**: Monitor services and configurations
- **Node Monitoring**: Track node health and resource utilization
- **Deployment Management**: Monitor deployment status and replicas
- **Real-time Monitoring**: CPU, memory, and network usage charts
- **Modern UI**: Beautiful animations with Framer Motion
- **Responsive Design**: Works on desktop and mobile devices

## 📸 Gallery

Check out our [**Dashboard Gallery**](./GALLERY.md) to see screenshots of all dashboard sections including monitoring, nodes, deployments, services, and more!

## 📄 Pages

- **/** - Cluster overview with key metrics
- **/pods** - Pod management and monitoring
- **/services** - Service configuration and status
- **/nodes** - Node health and resource usage
- **/deployments** - Deployment status and management
- **/monitoring** - Real-time metrics and charts

## � Prerequisites

- Node.js 18+ (for local development)
- Docker (for container deployment)
- Access to a Kubernetes cluster
- kubectl configured (for cluster connection)

## 🐳 Docker Image

**Image:** `harshhaareddy/kubernetes-dashboard:latest`

**Docker Hub:** [harshhaareddy/kubernetes-dashboard](https://hub.docker.com/r/harshhaareddy/kubernetes-dashboard)

**Commands:**
```bash
# Pull image
docker pull harshhaareddy/kubernetes-dashboard:latest

# Run container
docker run -p 3000:3000 harshhaareddy/kubernetes-dashboard:latest
```

## 🔒 Security

- The dashboard connects to your Kubernetes cluster using your kubectl configuration
- Ensure your kubeconfig has appropriate read-only permissions
- For production, consider using service accounts with limited permissions
- Enable RBAC to restrict access to sensitive cluster resources

## 🐛 Troubleshooting

### Common Issues

**"Connection refused" error**
- Check if Kubernetes cluster is running
- Verify kubectl configuration
- Ensure cluster is accessible from your network

**"Permission denied" error**
- Check RBAC permissions
- Verify service account has necessary roles

**Docker build fails**
- Ensure Docker is running
- Check available disk space

### Debug Commands
```bash
# Check cluster status
kubectl cluster-info

# Check dashboard pods
kubectl get pods -l app=kubernetes-dashboard

# View pod logs
kubectl logs -l app=kubernetes-dashboard

# Port forward for debugging
kubectl port-forward service/kubernetes-dashboard-service 3000:80
```

## 📚 Tech Stack

- **Frontend**: Next.js 16 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Kubernetes**: @kubernetes/client-node

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run type-check`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
