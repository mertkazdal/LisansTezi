# MoodLens Mobile Demo Checklist

Last M009-R verification: `2026-05-10 17:01 +03:00`

This checklist prepares the Flutter mobile app for a thesis demo with the local MoodLens backend and the web app as the canonical product reference.

## 1. Backend Startup

```powershell
cd ..
docker compose up -d --build
docker compose ps
docker ps --filter "name=tezfinal"
```

Expected local endpoints:

- API Gateway: `http://localhost:5000`
- AI service: `http://localhost:8000`
- Web frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

Health checks:

```powershell
Invoke-WebRequest http://localhost:5000/health -UseBasicParsing
Invoke-WebRequest http://localhost:8000/health -UseBasicParsing
Invoke-WebRequest http://localhost:3000 -UseBasicParsing
```

M009-R note: `docker compose ps` can be empty if the same fixed-name `tezfinal-*` containers were created by an older local stack. In that case, verify `docker ps --filter "name=tezfinal"` and use the healthy running containers instead of deleting them.

Verified M009-R backend state:

- `tezfinal-api`: up on `0.0.0.0:5000`
- `tezfinal-ai`: up and healthy on `0.0.0.0:8000`
- `tezfinal-client`: up on `0.0.0.0:3000`
- `tezfinal-db`: up and healthy on `0.0.0.0:5432`

## 2. Mobile Environment

```powershell
cd nihaitezmobil
flutter doctor -v
flutter devices
flutter emulators
flutter pub get
flutter analyze
```

M009-R verified environment:

- Flutter `3.41.9`, Dart `3.11.5`
- Android SDK `36.0.0`
- Android emulator: `MoodLensDemo`
- Active device during smoke test: `emulator-5554`, Android 16 API 36
- `flutter analyze`: `No issues found!`

Current local preview note:

- Flutter `3.38.5`, Dart `3.10.4`
- Available targets: `Windows`, `Chrome`, `Edge`
- Android SDK is installed at `C:\Users\halim\AppData\Local\Android\Sdk`.
- Android emulator `MoodLensDemo` is available and can be launched as `emulator-5554`.
- Browser preview can still be served with port `3100` when a quick non-emulator view is enough.

Known doctor notes:

- Android licenses are not fully accepted. Run `flutter doctor --android-licenses` if the local machine needs a fully clean doctor.
- Visual Studio C++ workload is missing, but Android APK build is not blocked by this.

## 3. Run Commands

Android emulator:

```powershell
flutter emulators --launch MoodLensDemo
flutter run -d emulator-5554
```

Android emulator backend URL:

- The mobile app resolves Android emulator backend to `http://10.0.2.2:5000`.
- This was confirmed from the Settings screen during M009-R.

Browser preview:

```powershell
flutter run -d web-server --web-hostname=127.0.0.1 --web-port=3100 --dart-define=API_BASE_URL=http://127.0.0.1:5000
```

Physical Android phone:

```powershell
ipconfig
flutter run -d <device-id> --dart-define=API_BASE_URL=http://<PC_LAN_IP>:5000
```

Physical device requirements:

- USB debugging enabled.
- Phone and PC on the same network.
- Windows firewall allows access to backend port `5000`.

## 4. APK Build

Debug APK:

```powershell
flutter build apk --debug
```

Release APK:

```powershell
flutter build apk --release
```

M009-R verified outputs:

- Debug APK: `nihaitezmobil\build\app\outputs\flutter-apk\app-debug.apk`
- Debug size: about `219 MB`
- Release APK: `nihaitezmobil\build\app\outputs\flutter-apk\app-release.apk`
- Release size: about `63 MB`

Release signing note:

- The current Android release build signs with the debug signing config for local thesis demo convenience.
- Use a real release/upload keystore before publishing outside the local demo environment.

Release build warning observed:

- Flutter printed a non-fatal `CupertinoIcons` font expectation warning, but no direct `CupertinoIcons` usage exists in `lib/`, and the release APK was built successfully.

## 5. Demo Flow

Recommended thesis demo order:

1. Splash/session restore.
2. Login screen trust copy.
3. Continue as guest.
4. Home dashboard.
5. Quick Analyze.
6. Text-only analysis.
7. Result emotion, confidence, explanation, metadata.
8. Recommendations: music, movies, books, advice.
9. Share result as a native image card; if the platform cannot create the PNG, use the text summary fallback.
10. Save one music/movie/book/advice recommendation.
11. Open Profile and verify saved recommendation count, category filters, source result link, external link, remove, and clear-all confirmation.
12. Camera/gallery permission path.
13. Guest profile and history login CTA states.
14. Settings theme/language/backend info.
15. Register/login with a local test account.
16. Authenticated profile.
17. Authenticated history.
18. Feedback submit and read-back.
19. Metrics non-admin permission state.
20. Admin metrics only if `ADMIN_EMAILS` or `ADMIN_USERNAMES` is configured.

## 5.1 M010-R Share and Saved Recommendations Demo

Result share/export:

- On a result detail page, tap `Share as image card`.
- Android should open the native share sheet with a generated MoodLens PNG card.
- If PNG capture fails on an emulator or platform surface, the app opens the native share sheet with a text summary fallback instead of crashing.
- Physical devices usually give the most reliable share-sheet validation because emulator images can lack target share apps.

Saved recommendations:

- Save at least one recommendation from Result.
- Profile shows saved recommendation count and category filters: all, music, movies, books, advice.
- External URLs open with the system browser when available.
- Source history opens `/result/:historyId` when available.
- Clear all asks for confirmation before removing local saved recommendations.

## 6. M009-R Smoke Test Notes

Emulator UI smoke:

- App launched on `emulator-5554` with real backend.
- Login route opened for unauthenticated restored state.
- Continue as guest opened Home.
- Home displayed guest quota and bottom nav.
- Analyze opened from bottom nav.
- Empty analyze input kept CTA disabled.
- Text-only analysis reached backend and opened Result.
- Result displayed emotion, confidence, explanation, metadata, and recommendations.
- Camera action opened Android/Google camera permission flow and did not crash.
- Guest Profile displayed login CTA.
- Guest History displayed login CTA.
- Settings displayed theme/language controls and `http://10.0.2.2:5000` backend URL.
- No Flutter crash or fatal Android log was observed after smoke navigation.

Backend API probe:

- Register returned token.
- Authenticated text analysis returned `historyId`, `emotion`, `confidence`, and recommendations.
- Feedback POST and GET worked for the created history item.
- Authenticated history returned paginated data.
- Authenticated profile returned username.
- Non-admin metrics returned `403`, which the mobile metrics screen maps to permission state.
- Guest quota sequence returned remaining `2`, `1`, `0`, then `GUEST_QUOTA_EXCEEDED`.
- Image-only analysis accepted `imageBase64` and `mimeType`.
- Multimodal analysis returned `modalityUsed=multimodal` and recommendation keys.

Admin metrics note:

- Local `.env` has empty `ADMIN_EMAILS` and `ADMIN_USERNAMES`.
- Full admin dashboard smoke needs one demo username/email added to those env variables and the API service restarted.
- Do not commit passwords or real admin credentials.

## 7. Test/Admin Account Notes

- Do not write passwords into the repository.
- Admin access is controlled by backend environment variables:
  - `ADMIN_EMAILS`
  - `ADMIN_USERNAMES`
- Demo mode is controlled by:
  - `TEZFINAL_DEMO_MODE=true`
- If metrics are empty, run a few analyses and submit feedback first.

## 8. Platform Settings

Android:

- App label: `MoodLens`
- Internet permission: present
- Camera permission: present
- Photo/media permissions: present
- Local HTTP cleartext: enabled for demo

iOS:

- Display name: `MoodLens`
- Camera usage description: present
- Photo library usage description: present

Production note:

- Local HTTP is demo-only. Use HTTPS and a production signing key for distribution.

## 9. Known Local Limits

- Android emulator uses `10.0.2.2`, not `localhost`.
- Physical phones need the PC LAN IP and firewall access to port `5000`.
- CSV export is intentionally disabled/noted on mobile without adding export/share packages.
- Native result share card/export uses a generated PNG first and falls back to text share if the platform cannot capture or share the image.
- Camera behavior depends on emulator image and host camera support.
- Full admin metrics require admin env configuration.

## 10. Quick Troubleshooting

Backend closed:

```powershell
cd ..
docker ps --filter "name=tezfinal"
docker compose up -d --build
```

Wrong API URL:

```powershell
flutter run -d <device-id> --dart-define=API_BASE_URL=http://<host>:5000
```

Docker name conflict:

- Check whether `tezfinal-*` containers are already running and healthy.
- Verify health endpoints before removing or recreating containers.

Camera/gallery issue:

- Revoke and grant permissions again from Android app settings.
- On emulator, the camera app may open a Google Lens surface; this still validates permission handoff if the app does not crash.

Metrics unauthorized:

- Login with a user included in backend `ADMIN_EMAILS` or `ADMIN_USERNAMES`.

Secure storage/session reset:

- Uninstall the app from the emulator or clear app storage from Android settings, then relaunch.
