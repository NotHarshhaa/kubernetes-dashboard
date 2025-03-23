# 🚀 **Kubernetes Dashboard – Advanced Kubernetes Monitoring & Security**  

![kubedash](https://imgur.com/xF4zrEI.png)

**A feature-rich Kubernetes Dashboard with live system monitoring, health checks, and container security scanning using Trivy.**  
Empower your DevOps workflow with **real-time cluster insights, security vulnerability detection, and an intuitive UI** for Kubernetes resource management.  

![Kubernetes Dashboard](https://imgur.com/yCAVAsK.png)

---

## 📌 **Table of Contents**  

- [🌟 Overview](#-overview)  
- [✨ Features](#-features)  
- [🛠 Prerequisites](#-prerequisites)  
- [⚙️ Installation & Setup](#️-installation--setup)  
- [🔍 How It Works](#-how-it-works)  
- [🛡 Security & Vulnerability Scanning](#-security--vulnerability-scanning)  
- [⚙️ Technology Stack](#️-technology-stack)  
- [🚀 Deployment Options](#-deployment-options)  
- [📜 License](#-license)  
- [🌟 Support & Contributions](#-support--contributions)  

---

## 🌟 **Overview**  

The **Kubernetes Dashboard Web Application** is designed to simplify **Kubernetes cluster monitoring, pod health checks, and container security scanning**.  

🔹 **Real-time insights** – Track CPU, memory, and storage usage.  
🔹 **Namespace-based monitoring** – Select a namespace to view Kubernetes resources.  
🔹 **Security scanning with Trivy** – Detect vulnerabilities in container images.  
🔹 **Modern & responsive UI** – Built with **HTML, CSS, JavaScript, and Flask**.  
🔹 **Fast & lightweight** – Optimized for performance and scalability.  

This dashboard enables **DevOps engineers, SREs, and developers** to efficiently manage their **Kubernetes clusters** while ensuring security best practices.  

---

## ✨ **Features**  

✅ **Live System Metrics** – View real-time **CPU, memory, and storage** consumption.  
✅ **Kubernetes Resource Status** – Track **Deployments, Services, and Pods** by namespace.  
✅ **Container Image Security Scanning** – Scan Docker images using **Trivy** for vulnerabilities.  
✅ **Pod Health Checks** – Monitor pod status, restarts, and logs.  
✅ **User-friendly Dashboard** – Simple, responsive, and easy-to-use UI.  
✅ **Lightweight & Efficient** – Built for **high performance** and minimal resource usage.  

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
python app.py
```

🚀 The dashboard is now accessible at **[http://localhost:5000](http://localhost:5000)**.  

---

## 🔍 **How It Works**  

### 📊 **Monitoring Kubernetes System Metrics**  

- The **top section** of the dashboard displays live **CPU, memory, and storage** metrics.  
- These values provide **real-time cluster performance monitoring**.  

### 🔄 **Kubernetes Namespace Selection**  

- Choose a **Kubernetes namespace** from the dropdown.  
- The dashboard fetches **Deployments, Services, and Pods** specific to the selected namespace.  

### 🛡 **Image Security Scanning with Trivy**  

- Enter a **Docker image ID** (e.g., `nginx:latest`).  
- Click **Scan** to initiate a **security vulnerability assessment**.  
- The scan report provides details of any **critical, high, medium, or low-risk vulnerabilities**.  

---

## 🛡 **Security & Vulnerability Scanning**

This dashboard integrates **Trivy** to perform real-time security assessments of **Docker images**.  

### 🔥 **Why Use Trivy?**  

✅ Detects **OS vulnerabilities** in container images.  
✅ Identifies **known exploits and security risks**.  
✅ Provides **CVE (Common Vulnerabilities and Exposures) reports**.  

### 🔍 **Running a Manual Scan**  

```bash
trivy image nginx:latest
```

Output Example:  

```plaintext
nginx:latest (debian 11)
=========================
Total: 10 vulnerabilities
Critical: 2 | High: 3 | Medium: 5 | Low: 0
```

---

## ⚙️ **Technology Stack**  

| **Component**        | **Technology**             |
|----------------------|---------------------------|
| **Frontend**        | HTML, CSS, JavaScript      |
| **Backend**         | Python Flask               |
| **Kubernetes API**  | Python Kubernetes Client   |
| **Security Scanning** | Trivy                      |
| **Deployment**      | Docker, Kubernetes         |

---

## 🚀 **Deployment Options**  

You can deploy the Kubernetes Dashboard using **Docker, Kubernetes, or a cloud platform**.  

### 🔹 **Run with Docker**  

```bash
docker build -t kubernetes-dashboard .
docker run -p 5000:5000 kubernetes-dashboard
```

### 🔹 **Deploy on Kubernetes**  

```bash
kubectl apply -f k8s-manifest.yaml
```

### 🔹 **Deploy on Cloud (AWS/GCP/Azure)**  

You can deploy the dashboard on a **Kubernetes cluster** running on AWS EKS, GCP GKE, or Azure AKS.  

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
I’d love to hear your feedback! Feel free to share your thoughts.  

---

### 📧 **Connect with me:**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/harshhaa-vardhan-reddy) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/NotHarshhaa)  [![Telegram](https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/prodevopsguy) [![Dev.to](https://img.shields.io/badge/Dev.to-0A0A0A?style=for-the-badge&logo=dev.to&logoColor=white)](https://dev.to/notharshhaa) [![Hashnode](https://img.shields.io/badge/Hashnode-2962FF?style=for-the-badge&logo=hashnode&logoColor=white)](https://hashnode.com/@prodevopsguy)  

---

### 📢 **Stay Connected**  

![Follow Me](https://imgur.com/2j7GSPs.png)
