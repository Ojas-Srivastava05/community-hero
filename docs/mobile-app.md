# Community Hero — Android app (Capacitor)

The Android APK is a **native shell** that opens the live Cloud Run deployment. Your web URL, API, and embed links stay unchanged.

| Setting | Value |
|---------|-------|
| App name | Community Hero |
| Package ID | `com.vibe2ship.communityhero` |
| Remote URL | `https://community-hero-987477089222.asia-south1.run.app` |
| Config | `frontend/capacitor.config.ts` |

Deploying new commits to Cloud Run updates the app on next open — **no APK rebuild** unless you change the shell (icon, package ID, or Cloud Run URL).

## Prerequisites (one-time)

1. **Java 21+** — `brew install openjdk@21`
2. **Android SDK** — Android Studio, or `brew install --cask android-commandlinetools` then:
   ```bash
   export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
   yes | sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
   ```

## Build APK

From repo root:

```bash
bash scripts/build-android-apk.sh
```

Or from `frontend/`:

```bash
npm run cap:apk
```

Output: `dist-mobile/community-hero-debug.apk`

## Install on your phone

### Option A — USB (ADB)

```bash
adb install -r dist-mobile/community-hero-debug.apk
```

### Option B — Sideload file

1. Copy `dist-mobile/community-hero-debug.apk` to your phone (AirDrop, Drive, cable).
2. Open the file on Android.
3. Allow **Install unknown apps** for your file manager if prompted.
4. Install and open **Community Hero**.

## Open in Android Studio (optional)

```bash
cd frontend && npm run cap:open
```

Useful for emulator testing or swapping the launcher icon.

## Firebase Auth note

Google sign-in uses the **web** Firebase app inside the WebView. If login fails on device, add your app's package name in [Firebase Console](https://console.firebase.google.com) → Project settings → Your apps → Add Android app (`com.vibe2ship.communityhero`). The remote-URL setup often works without this; add it if auth breaks on the APK.

## Rebuild APK only when

- Cloud Run **URL** changes (edit `frontend/capacitor.config.ts`)
- App icon, name, or native permissions change
- Publishing to Play Store (use `assembleRelease` + signing key)
