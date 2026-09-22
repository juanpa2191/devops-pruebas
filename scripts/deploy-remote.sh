#!/usr/bin/env bash
# Se ejecuta en el VPS via `ssh ... bash -s < deploy-remote.sh`.
# Requiere las variables de entorno ARTIFACT_NAME y DEPLOY_PATH ya exportadas
# (el paquete ya fue copiado antes a /tmp/$ARTIFACT_NAME.tar.gz).
set -euo pipefail

RELEASE_DIR="$DEPLOY_PATH/releases/$ARTIFACT_NAME"
mkdir -p "$RELEASE_DIR"
tar -xzf "/tmp/$ARTIFACT_NAME.tar.gz" -C "$RELEASE_DIR"
rm -f "/tmp/$ARTIFACT_NAME.tar.gz"

ln -sfn "$RELEASE_DIR" "$DEPLOY_PATH/current"
cd "$DEPLOY_PATH/current"

pm2 reload ecosystem.config.js --env production \
  || pm2 start ecosystem.config.js --env production
pm2 save

# conserva solo los ultimos 5 releases
cd "$DEPLOY_PATH/releases"
ls -1dt */ | tail -n +6 | xargs -r rm -rf
