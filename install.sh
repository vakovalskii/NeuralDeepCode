#!/bin/sh
# NeuralDeepCode (ndcode) installer — one-liner:
#   curl -fsSL https://raw.githubusercontent.com/vakovalskii/NeuralDeepCode/main/install.sh | sh
#
# Downloads the prebuilt single binary from GitHub releases and installs it to
# ~/.local/bin (override with BIN_DIR=...). No Bun/Node required at runtime.
set -eu

REPO="vakovalskii/NeuralDeepCode"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"

red()  { printf '\033[0;31m%s\033[0m\n' "$*" >&2; }
grn()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
die()  { red "$*"; exit 1; }

# --- detect os/arch ---
os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m)
case "$arch" in
  x86_64|amd64) arch=x64 ;;
  aarch64|arm64) arch=arm64 ;;
  *) die "unsupported arch: $arch" ;;
esac
case "$os" in
  darwin) os=darwin ;;
  linux)  os=linux ;;
  *) die "unsupported os: $os (Windows: download manually from releases)" ;;
esac

command -v curl >/dev/null 2>&1 || die "curl is required"
asset="ndcode-${os}-${arch}"

# --- resolve latest release tag ---
grn "→ resolving latest ndcode release…"
tag=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
  | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)
[ -n "${tag:-}" ] || die "could not find a release. Build from source: bun run --cwd packages/ndcode build --single --skip-embed-web-ui"

url="https://github.com/${REPO}/releases/download/${tag}/${asset}"
grn "→ downloading ${asset} (${tag})…"
mkdir -p "$BIN_DIR"
tmp=$(mktemp)
curl -fsSL "$url" -o "$tmp" || die "download failed: $url"
chmod +x "$tmp"
mv "$tmp" "$BIN_DIR/ndcode"

# macOS (arm64): a moved/copied single binary can lose its code signature and get
# "killed: 9" by the kernel. Re-sign ad-hoc and strip quarantine so it just runs.
if [ "$os" = "darwin" ]; then
  codesign --force --sign - "$BIN_DIR/ndcode" >/dev/null 2>&1 || true
  xattr -c "$BIN_DIR/ndcode" >/dev/null 2>&1 || true
fi

grn ""
grn "✓ installed: $BIN_DIR/ndcode"
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) printf '\033[0;33m%s\033[0m\n' "  add to PATH:  export PATH=\"$BIN_DIR:\$PATH\"" ;;
esac
grn "next:"
grn "  ndcode            # launch the TUI"
grn "  /login            # browser SSO into the NeuralDeep hub"
grn "  /status           # tier / budget / models"
