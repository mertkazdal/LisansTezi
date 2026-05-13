# MoodLens Mobile

Flutter mobile client for the MoodLens thesis project. The app uses the same backend contracts as the web/backend stack: auth, analysis, history, feedback, profile, recommendations, and admin metrics.

## Requirements

- Flutter 3.38+ / Dart 3.10+; tested locally with Flutter 3.38.5 and Dart 3.10.4
- Docker Desktop for the backend stack
- Android Studio + an AVD, or a physical Android/iOS device

## Backend

Start the web/backend stack first:

```powershell
cd ..\
docker compose up -d --build
```

Default local services:

- API Gateway: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- AI service: `http://localhost:8000`

## Mobile Run

```powershell
cd nihaitezmobil
flutter pub get
flutter devices
flutter run -d <device-id>
```

Quick browser preview, useful when no Android emulator is available:

```powershell
flutter run -d web-server --web-hostname=127.0.0.1 --web-port=3100 --dart-define=API_BASE_URL=http://127.0.0.1:5000
```

Then open `http://127.0.0.1:3100`.

Default API URL behavior:

- Android emulator: `http://10.0.2.2:5000`
- iOS simulator, web, desktop: `http://localhost:5000`
- Physical phone: pass the PC LAN IP with `--dart-define`

Local Android preview used in this workspace:

```powershell
flutter emulators --launch MoodLensDemo
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

Example for a physical device:

```powershell
flutter run -d <device-id> --dart-define=API_BASE_URL=http://192.168.1.20:5000
```

## Demo Notes

- Android app label is `MoodLens`.
- iOS display name is `MoodLens`.
- Android has `INTERNET`, `CAMERA`, `READ_MEDIA_IMAGES`, and legacy gallery permission for API 32 and below.
- iOS has camera and photo library usage descriptions.
- Android cleartext HTTP is enabled for local thesis demo. Use HTTPS and remove cleartext for production.

## QA Checklist

Run before a thesis demo:

```powershell
flutter pub get
flutter analyze
flutter devices
```

If an Android emulator/device is available:

- Launch backend with Docker.
- Run the app on the device.
- Register or login.
- Submit text-only analysis.
- Submit gallery/camera image analysis.
- Open result and send feedback.
- Open history and revisit a result.
- Open profile, settings, logout.
- Login with an admin account and open metrics.

If no emulator exists, create one from Android Studio > Device Manager > Create Virtual Device, then rerun `flutter devices`.

More detailed demo and troubleshooting notes are in `docs/mobile_demo_checklist.md`.
