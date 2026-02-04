# 🚀 **Kubernetes Dashboard – Modern Container Orchestration Management**

![kubedash](https://imgur.com/xF4zrEI.png)

**A comprehensive, modern Kubernetes Dashboard with real-time monitoring, interactive visualizations, enhanced UI/UX, and security scanning.**

Empower your DevOps workflow with **advanced cluster insights, modern glassmorphic UI, and security vulnerability detection** for Kubernetes resource management.

---

## 🌟 **Overview**  

The **Modern Kubernetes Dashboard** provides a **beautiful, feature-rich interface** for **monitoring, managing, and securing your Kubernetes clusters**.

---

## ✨ **Features**  

### 🎨 **Modern UI/UX Design**
- **🌈 Glassmorphic Design** – Modern frosted glass effects with gradient backgrounds
- **🎭 Enhanced Themes** – Improved dark/light mode with smooth transitions
- **📱 Responsive Layout** – Perfect adaptation to all screen sizes (1400px to 480px)
- **⚡ Smooth Animations** – Micro-interactions, hover effects, and loading states
- **🎯 Better Typography** – Clear visual hierarchy and improved readability
- **♿ Accessibility Features** – ARIA labels, keyboard navigation, screen reader support

### 📊 **Monitoring & Visualization**
- **📈 Real-time Charts** – CPU, memory, and storage metrics with Chart.js
- **📋 Historical Data** – Performance trends and metrics history
- **🔄 Auto-refresh** – Configurable automatic data updates
- **🎨 Interactive Visualizations** – Pod status charts and health indicators

### ☸️ **Kubernetes Integration**
- **🏛️ Resource Management** – Deployments, pods, services monitoring
- **📂 Namespace Support** – Multi-namespace resource filtering
- **🏥 Health Monitoring** – Component-level health checks
- **📝 Log Viewer** – Real-time pod logs with filtering
- **🔍 Node Information** – Cluster node details and status

### 🔒 **Security Features**
- **🛡️ Trivy Integration** – Container vulnerability scanning
- **📊 Severity Classification** – Critical, High, Medium, Low vulnerability counts
- **📤 Export Functionality** – JSON/CSV export for compliance
- **🔍 Detailed Reports** – CVE information and remediation suggestions

---

## 🛠 **Prerequisites**  

Before installing the Kubernetes Dashboard, ensure you have the following dependencies installed:  

🔹 **Python 3.8+** – Required for Flask backend.  
🔹 **pip** – Python package manager.  
🔹 **Docker & Kubernetes Cluster** – To monitor cluster resources.  
🔹 **kubectl** – Kubernetes command-line tool.  
🔹 **Trivy** – For container image vulnerability scanning.  

Install **kubectl** and **Trivy** if not already installed:  

```bash
# Install kubectl (for Kubernetes resource monitoring)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Trivy (for security scanning)
brew install aquasecurity/trivy/trivy  # For macOS
sudo apt install trivy  # For Ubuntu/Debian
```

---

## ⚙️ **Installation & Setup**  

### 1️⃣ **Clone the Repository**  

```bash
git clone https://github.com/NotHarshhaa/kubernetes-dashboard.git
cd kubernetes-dashboard
```

### 2️⃣ **Install Python Dependencies**  

```bash
pip install -r requirements.txt
```

### 3️⃣ **Start the Flask Application**  

```bash
# New modular version (recommended)
python app.py

# Or use the original monolithic version
python systeminfo.py.backup
```

🚀 The dashboard is now accessible at **[http://localhost:5000](http://localhost:5000)**.  

---

## 🔍 **Usage Instructions**  

### � **System Monitoring**  

1. **View Real-time Metrics** – The dashboard automatically displays CPU, memory, and storage usage
2. **Historical Data** – Charts show performance trends over time
3. **Auto-refresh** – Enable auto-refresh for continuous monitoring (adjustable interval)

### ☸️ **Kubernetes Resource Management**  

1. **Select Namespace** – Use the dropdown to filter resources by namespace
2. **View Resources** – Monitor deployments, pods, and services in the selected namespace
3. **Pod Status** – Visual indicators show running, pending, and failed pods
4. **Health Checks** – Monitor cluster component health (API server, scheduler, controller manager)

### 🛡 **Security Scanning**  

1. **Enter Image Name** – Type a Docker image name (e.g., `nginx:latest`, `ubuntu:20.04`)
2. **Run Scan** – Click the Scan button to start vulnerability analysis
3. **View Results** – See vulnerability counts by severity (Critical, High, Medium, Low)
4. **Export Reports** – Download scan results in JSON or CSV format for documentation

---

## 📜 **License**  

This project is licensed under the **MIT License** – free for personal and commercial use.  

---

## 🌟 **Support & Contributions**

### 🤝 **Contributing**  

Contributions are welcome! If you'd like to improve this project, feel free to submit a pull request.  

---

### **Hit the Star!** ⭐

**If you find this repository helpful and plan to use it for learning, please give it a star. Your support is appreciated!**

---

### 🛠️ **Author & Community**  

This project is crafted by **[Harshhaa](https://github.com/NotHarshhaa)** 💡.  
I'd love to hear your feedback! Feel free to share your thoughts.  

---

### 📧 **Connect with me:**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/harshhaa-vardhan-reddy) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/NotHarshhaa)  [![Telegram](https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/prodevopsguy) [![Dev.to](https://img.shields.io/badge/Dev.to-0A0A0A?style=for-the-badge&logo=dev.to&logoColor=white)](https://dev.to/notharshhaa) [![Hashnode](https://img.shields.io/badge/Hashnode-2962FF?style=for-the-badge&logo=hashnode&logoColor=white)](https://hashnode.com/@prodevopsguy)  

---

### 📢 **Stay Connected**  

![Follow Me](https://imgur.com/2j7GSPs.png)