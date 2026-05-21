#!/usr/bin/env bash
# Provision Azure Container Apps environment + LaTeX service.
# Prerequisites: az login, subscription set, GHCR image already pushed.
#
# Usage:
#   GITHUB_OWNER=your-github-username ./infra/azure/setup-latex-container-app.sh
#   GITHUB_OWNER=your-github-username GHCR_TOKEN=ghp_xxx ./infra/azure/setup-latex-container-app.sh

set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-resume-advisor}"
LOCATION="${LOCATION:-eastus}"
ENV_NAME="${ENV_NAME:-cae-resume-advisor}"
APP_NAME="${APP_NAME:-ca-latex-service}"
LOG_ANALYTICS="${LOG_ANALYTICS:-}"
GITHUB_OWNER="${GITHUB_OWNER:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/${GITHUB_OWNER}/resume-advisor-latex:${IMAGE_TAG}}"

CPU="${CPU:-1.0}"
MEMORY="${MEMORY:-2.0Gi}"
MIN_REPLICAS="${MIN_REPLICAS:-1}"
MAX_REPLICAS="${MAX_REPLICAS:-2}"
# Align with MAX_CONCURRENT_COMPILES(2) + MAX_COMPILE_QUEUE(5) per replica
HTTP_CONCURRENT_REQUESTS="${HTTP_CONCURRENT_REQUESTS:-7}"

if [[ -z "$GITHUB_OWNER" ]]; then
  echo "ERROR: Set GITHUB_OWNER to your GitHub username or org."
  exit 1
fi

echo "==> Resource group: $RESOURCE_GROUP ($LOCATION)"
az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1 || \
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" >/dev/null

echo "==> Container Apps environment: $ENV_NAME"
if ! az containerapp env show --name "$ENV_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  ENV_CREATE_ARGS=(
    --name "$ENV_NAME"
    --resource-group "$RESOURCE_GROUP"
    --location "$LOCATION"
  )
  if [[ -n "$LOG_ANALYTICS" ]]; then
    ENV_CREATE_ARGS+=(
      --logs-workspace-id "$(az monitor log-analytics workspace show \
        --resource-group "$RESOURCE_GROUP" \
        --workspace-name "$LOG_ANALYTICS" \
        --query customerId -o tsv)"
      --logs-workspace-key "$(az monitor log-analytics workspace get-shared-keys \
        --resource-group "$RESOURCE_GROUP" \
        --workspace-name "$LOG_ANALYTICS" \
        --query primarySharedKey -o tsv)"
    )
  fi
  az containerapp env create "${ENV_CREATE_ARGS[@]}"
fi

REGISTRY_ARGS=()
if [[ -n "${GHCR_TOKEN:-}" ]]; then
  REGISTRY_ARGS+=(--registry-server ghcr.io --registry-username "$GITHUB_OWNER" --registry-password "$GHCR_TOKEN")
fi

ENV_ID="$(az containerapp env show \
  --name "$ENV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv)"

echo "==> Container app: $APP_NAME"
if az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az containerapp update \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$IMAGE_NAME" \
    --cpu "$CPU" \
    --memory "$MEMORY" \
    --min-replicas "$MIN_REPLICAS" \
    --max-replicas "$MAX_REPLICAS" \
    --set-env-vars \
      "NODE_ENV=production" \
      "PORT=80" \
      "MAX_CONCURRENT_COMPILES=2" \
      "MAX_COMPILE_QUEUE=5" \
      "COMPILE_QUEUE_WAIT_MS=120000"
else
  az containerapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENV_NAME" \
    --image "$IMAGE_NAME" \
    --target-port 80 \
    --ingress external \
    --transport auto \
    --cpu "$CPU" \
    --memory "$MEMORY" \
    --min-replicas "$MIN_REPLICAS" \
    --max-replicas "$MAX_REPLICAS" \
    "${REGISTRY_ARGS[@]}" \
    --env-vars \
      "NODE_ENV=production" \
      "PORT=80" \
      "MAX_CONCURRENT_COMPILES=2" \
      "MAX_COMPILE_QUEUE=5" \
      "COMPILE_QUEUE_WAIT_MS=120000" \
    --system-assigned
fi

if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "==> Configuring GHCR registry credentials"
  az containerapp registry set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --server ghcr.io \
    --username "${GITHUB_OWNER}" \
    --password "$GHCR_TOKEN"
fi

echo "==> Health probe + HTTP scaling rules"
az containerapp update \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --probe-liveness-type http \
  --probe-liveness-path /health \
  --probe-liveness-interval 30 \
  --probe-liveness-timeout 10 \
  --probe-liveness-failure-threshold 3 \
  --probe-readiness-type http \
  --probe-readiness-path /health/ready \
  --probe-readiness-interval 15 \
  --probe-readiness-timeout 10 \
  --probe-readiness-failure-threshold 3 \
  --scale-rule-name http-concurrent \
  --scale-rule-type http \
  --scale-rule-http-concurrency "$HTTP_CONCURRENT_REQUESTS" \
  --scale-rule-auth false) || {
    echo "WARN: Could not apply probe/scaling via CLI flags. Configure in Azure Portal if needed." >&2
  }

FQDN="$(az containerapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.configuration.ingress.fqdn -o tsv)"

echo ""
echo "Done."
echo "FQDN: https://${FQDN}"
echo "Health (liveness): https://${FQDN}/health"
echo "Readiness: https://${FQDN}/health/ready"
echo ""
echo "Test availability:"
echo "  LATEX_SERVICE_URL=https://${FQDN} npm run latex:availability"
echo ""
echo "Set in production Next.js env:"
echo "  LATEX_SERVICE_URL=https://${FQDN}"
