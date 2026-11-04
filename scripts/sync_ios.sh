# Remote macOS development environment
export MAC_HOST="ashley@ashleys-macbook-pro"
export MAC_DIR="Developer/flixer-web"

echo "==> Syncing project to Mac..."

rsync -az --delete \
  --exclude=".git/" \
  --exclude="node_modules/" \
  --exclude="ios/Pods/" \
  --exclude="ios/build/" \
  --exclude="ios/DerivedData/" \
  --exclude="dist/" \
  ./ "$MAC_HOST:$MAC_DIR/"