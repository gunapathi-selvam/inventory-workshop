# Build an installable Android APK (local, with Android Studio)

This builds the Workshop mobile app into a **standalone `.apk`** you install on an
emulator or a real phone — **no Metro, no Expo Go, no tunnel** at runtime. You run
every command **on your own machine** (the one with Android Studio).

Commands below are **Windows / PowerShell**. Run them from the repo root unless a
step says otherwise.

---

## 0. Prerequisites (one-time)

- **Android Studio** installed, and via its SDK Manager: *Android SDK Platform*,
  *Android SDK Build-Tools*, *Platform-Tools* (gives you `adb`).
- **JDK 17** — bundled with Android Studio (no separate install needed).
- **Node 20+** and **pnpm** (`corepack enable`).
- Tell the shell where the SDK/JDK are (adjust the username/version):

  ```powershell
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
  $env:JAVA_HOME    = "C:\Program Files\Android\Android Studio\jbr"
  $env:Path        += ";$env:ANDROID_HOME\platform-tools"
  ```

  (To make these permanent, set them in *System Properties → Environment
  Variables* instead of per-session.)

- Install JS dependencies once:

  ```powershell
  pnpm install
  ```

---

## 1. Decide the API URL (important — it gets baked into the APK)

A standalone APK has no Metro, so it can't use `localhost` (that's the phone
itself). The app reads `EXPO_PUBLIC_API_URL` **at build time** and bakes it in.
Pick the value for how you'll test:

| Testing on… | Use this `EXPO_PUBLIC_API_URL` | Notes |
|---|---|---|
| **Android emulator** | `http://10.0.2.2:3000` | `10.0.2.2` is the emulator's alias for your PC. |
| **Physical phone (same Wi-Fi)** | `http://<YOUR-PC-LAN-IP>:3000` | e.g. `http://192.168.1.6:3000` — the `Network` URL `pnpm dev` prints. Allow port 3000 through Windows Firewall. |
| **Physical phone (USB cable)** | `http://localhost:3000` | Also run `adb reverse tcp:3000 tcp:3000` (see step 4) so the phone's `localhost` maps to your PC. |

Cleartext `http://` is already enabled for the app (via `expo-build-properties`
in `app.json`), so a plain-HTTP LAN/dev API works.

---

## 2. Generate the native Android project + build the APK

From `apps/mobile`, in **one** PowerShell session (the env var must be set before
both commands):

```powershell
cd "apps\mobile"

# Set the API URL from the table above (example: emulator)
$env:EXPO_PUBLIC_API_URL = "http://10.0.2.2:3000"

# 2a. Generate the android/ project (applies the cleartext setting, icons, etc.)
npx expo prebuild --platform android --clean

# 2b. Build the release APK (JS is bundled into the app)
cd android
.\gradlew assembleRelease
```

The APK is written to:

```
apps\mobile\android\app\build\outputs\apk\release\app-release.apk
```

> The Expo/React-Native template signs the **release** build with the bundled
> **debug keystore** by default, so this APK installs fine for testing — you do
> **not** need to create a keystore. (For a Play Store upload you'd configure a
> real signing key, but that's out of scope for local testing.)

---

## 3. Run the backend (so the app has an API)

In a **separate** terminal, from the repo root:

```powershell
pnpm dev      # web app + API on http://localhost:3000
```

Keep this running while you use the app. Demo login: `admin@workshop.local` /
`admin123`.

---

## 4. Install the APK

**Emulator** (start one from Android Studio → Device Manager first) or a
**USB-connected phone** (enable *USB debugging*):

```powershell
adb install -r "android\app\build\outputs\apk\release\app-release.apk"
```

For a **USB phone using `http://localhost:3000`**, also map the port so the phone
can reach your PC over the cable (no Wi-Fi/firewall needed):

```powershell
adb reverse tcp:3000 tcp:3000
```

**Physical phone without a cable:** copy `app-release.apk` to the phone (Drive,
email, USB transfer), tap it, and allow *Install unknown apps*.

Open the **Workshop** app → you should land on the **Login** screen.

---

## 5. Quicker alternative (dev build, needs Metro running)

If you just want it on an emulator fast and don't need a standalone file:

```powershell
cd "apps\mobile"
$env:EXPO_PUBLIC_API_URL = "http://10.0.2.2:3000"
npx expo run:android        # builds a dev build, installs it, starts Metro
```

This keeps a Metro connection (like a local, reliable version of Expo Go) and
hot-reloads. It needs the emulator/device connected and Metro running.

---

## Troubleshooting

- **Gradle build fails on SDK/licenses** → open Android Studio once to finish SDK
  setup, then accept licenses: `& "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" --licenses`.
- **`JAVA_HOME` / `adb` not found** → re-check step 0 paths for your machine.
- **App opens but login fails / network error** → the baked `EXPO_PUBLIC_API_URL`
  is wrong for your test target (see step 1), the backend isn't running, or the
  firewall is blocking port 3000. Fix the URL and **rebuild** (step 2) — the URL
  is baked in, so changing it needs a new APK.
- **Red error screen with a message** → that's the app's ErrorBoundary (good — it
  replaced the old blank white screen). Send me that message and I'll fix it.
- **Changed the API URL** → re-run step 2 to produce a new APK.
