#!/usr/bin/env bash
# Build Community Hero Android APK (Capacitor remote URL → Cloud Run).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
ANDROID="$FRONTEND/android"
OUT_DIR="$ROOT/dist-mobile"

# Java 21+ required by current Capacitor Android.
if [[ -z "${JAVA_HOME:-}" ]]; then
  for candidate in \
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" \
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"; do
    if [[ -d "$candidate" ]]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi

if [[ -z "${ANDROID_HOME:-}" ]]; then
  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  elif [[ -d "/opt/homebrew/share/android-commandlinetools" ]]; then
    export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
  fi
fi

if [[ -z "${JAVA_HOME:-}" ]] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -q 'version "2[1-9]'; then
  echo "ERROR: Java 21+ required. Install: brew install openjdk@21" >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}" ]] || [[ ! -d "$ANDROID_HOME" ]]; then
  echo "ERROR: ANDROID_HOME not set. Install Android SDK or Android Studio." >&2
  exit 1
fi

export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "==> Sync Capacitor (remote URL: Cloud Run)"
cd "$FRONTEND"
npm run build
npx cap sync android

if [[ ! -f "$ANDROID/local.properties" ]]; then
  echo "sdk.dir=$ANDROID_HOME" > "$ANDROID/local.properties"
fi

echo "==> Gradle assembleDebug"
cd "$ANDROID"
chmod +x gradlew
./gradlew assembleDebug

mkdir -p "$OUT_DIR"
APK_SRC="$ANDROID/app/build/outputs/apk/debug/app-debug.apk"
APK_DST="$OUT_DIR/community-hero-debug.apk"
cp "$APK_SRC" "$APK_DST"

echo ""
echo "APK ready: $APK_DST"
echo "Install on a connected phone: adb install -r \"$APK_DST\""
echo "Or copy the file to your phone and open it (enable Install unknown apps)."
