# 部署指南 (Deployment Guide)

## 完全自動化部署流程

本項目使用 **GitHub Actions** 實現完全自動化的 CI/CD 流程：

1. **推送代碼到 GitHub** → 自動觸發構建
2. **GitHub Actions 構建 Docker image** → 推送到 GitHub Container Registry
3. **自動部署到 EC2** → 拉取最新 image 並啟動服務

## 前置需求

- GitHub 倉庫
- EC2 實例已設置
- Docker 和 Docker Compose 已安裝在 EC2 上
- EC2 Security Group 允許端口 3002 的入站流量

## 設置步驟

### 1. 配置 GitHub Secrets

為了實現自動部署，需要在 GitHub 倉庫設置以下 Secrets：

- `EC2_SSH_KEY`: EC2 的 SSH 私鑰（用於 SSH 連接到 EC2）
- `EC2_HOST`: EC2 的 IP 地址或域名
- `EC2_USER`: EC2 的用戶名（通常是 `ubuntu` 或 `ec2-user`）

**設置方法：**

1. 進入 GitHub 倉庫
2. 點擊 Settings → Secrets and variables → Actions
3. 點擊 New repository secret
4. 添加上述三個 Secrets

**獲取 EC2 SSH 私鑰：**

```bash
# 如果你使用 AWS EC2，私鑰通常在本地
# 例如：~/.ssh/my-ec2-key.pem
cat ~/.ssh/my-ec2-key.pem
# 複製整個內容（包括 -----BEGIN RSA PRIVATE KEY----- 和 -----END RSA PRIVATE KEY-----）
```

### 2. 在 EC2 上準備部署環境

在 EC2 實例上執行以下操作：

```bash
# 1. 安裝 Docker 和 Docker Compose（如果還沒安裝）
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Amazon Linux:
sudo yum install -y docker docker-compose

# 2. 啟動 Docker 服務
sudo systemctl start docker
sudo systemctl enable docker

# 3. 將當前用戶添加到 docker 組（避免使用 sudo）
sudo usermod -aG docker $USER
# 需要重新登入才能生效

# 4. 克隆倉庫（如果還沒有的話）
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 3. 推送代碼觸發自動部署

當你推送代碼到 `main` 或 `master` 分支時，GitHub Actions 會自動：

1. **構建階段** (`build-and-push-latex.yml`):
   - 檢測到代碼變更（`Dockerfile.latex` 或 `latex-service/**`）
   - 構建 Docker image
   - 推送到 `ghcr.io/your-username/repo-name/latex-service:latest`

2. **部署階段** (`deploy-to-ec2.yml`):
   - 構建完成後自動觸發
   - 通過 SSH 連接到 EC2
   - 執行 `ec2-deploy.sh` 腳本
   - 拉取最新 image 並啟動服務
   - 驗證服務健康狀態

### 4. 手動觸發部署（可選）

如果需要手動觸發部署或指定特定版本的 image：

1. 進入 GitHub 倉庫
2. 點擊 Actions 標籤
3. 選擇 "Deploy LaTeX Service to EC2" workflow
4. 點擊 "Run workflow"
5. 可選：指定 image tag（預設為 `latest`）

## Image 名稱格式

GitHub Container Registry 的 image 名稱格式：

```
ghcr.io/OWNER/REPOSITORY/IMAGE_NAME:TAG
```

例如：

```
ghcr.io/your-username/resume-advisor-next/latex-service:latest
```

## 部署流程詳解

### build-and-push-latex.yml

**觸發條件：**

- 推送代碼到 `main` 或 `master` 分支
- 修改了 `Dockerfile.latex`、`latex-service/**` 或 workflow 文件
- 手動觸發 (`workflow_dispatch`)

**執行內容：**

- 構建 Docker image
- 推送到 GitHub Container Registry
- 自動標記為 `latest`（在 main/master 分支）

### deploy-to-ec2.yml

**觸發條件：**

- `build-and-push-latex.yml` 成功完成後自動觸發
- 手動觸發 (`workflow_dispatch`)

**執行內容：**

1. 通過 SSH 連接到 EC2
2. 進入項目目錄
3. 拉取最新代碼（更新 `docker-compose.latex.yml` 等文件）
4. 登入 GitHub Container Registry
5. 執行 `ec2-deploy.sh` 腳本：
   - 停止現有服務
   - 拉取最新 Docker image
   - 啟動服務
   - 等待健康檢查通過
6. 驗證部署成功

## 監控和日誌

### 查看 GitHub Actions 日誌

1. 進入 GitHub 倉庫
2. 點擊 Actions 標籤
3. 選擇對應的 workflow run
4. 查看各步驟的執行日誌

### 在 EC2 上查看服務狀態

```bash
# 查看服務日誌
docker compose -f docker-compose.latex.yml logs -f

# 查看服務狀態
docker compose -f docker-compose.latex.yml ps

# 檢查健康狀態
curl http://localhost:3002/health
```

## 故障排除

### 部署失敗

1. **檢查 GitHub Secrets 是否正確配置**
   - 確認 `EC2_SSH_KEY`、`EC2_HOST`、`EC2_USER` 都已設置

2. **檢查 SSH 連接**
   - 確認 EC2 Security Group 允許來自 GitHub Actions 的 SSH 連接
   - 確認 SSH 私鑰格式正確（包含完整的 BEGIN/END 標記）

3. **檢查 EC2 上的 Docker**
   - 確認 Docker 和 Docker Compose 已安裝
   - 確認當前用戶有執行 Docker 的權限

4. **檢查 GitHub Container Registry 權限**
   - 如果 image 是私有的，確認 EC2 可以訪問
   - 在 `ec2-deploy.sh` 中會自動使用 GitHub Token 登入

### 服務無法啟動

1. **檢查端口是否被佔用**

   ```bash
   sudo netstat -tulpn | grep 3002
   ```

2. **檢查 Docker image 是否存在**

   ```bash
   docker images | grep latex-service
   ```

3. **查看詳細日誌**
   ```bash
   docker compose -f docker-compose.latex.yml logs --tail=100
   ```

## 優點

1. **完全自動化**: 推送代碼即自動部署，無需手動操作
2. **版本控制**: 每次部署都有對應的 Git commit，易於追蹤
3. **快速部署**: EC2 上只需拉取 image，無需構建
4. **免費**: GitHub Actions 和 GitHub Container Registry 都免費使用
5. **可重用性**: 同一個 image 可以在多個環境使用
6. **安全性**: 使用 GitHub Secrets 安全存儲敏感信息

## 注意事項

- 確保 EC2 Security Group 允許端口 3002 的入站流量
- 確保 EC2 Security Group 允許來自 GitHub Actions 的 SSH 連接（或使用 VPN/專用網絡）
- 如果 image 是私有的，GitHub Actions 會自動使用 `GITHUB_TOKEN` 進行認證
- 建議在生產環境中使用特定的 image tag 而不是 `latest`，以確保版本一致性
