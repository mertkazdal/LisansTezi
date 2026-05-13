## Sana verecegim prompt

---

### MASTER PROMPT — ADIM 1: Flutter Proje Kurulumu & Temel Altyapı

Sen bir senior Flutter geliştiricisin. "MoodLens" (Yapay Zeka Destekli Yaşam Koçu) projesinin mobil uygulamasını sıfırdan inşa ediyorsun. Bu adımda projenin tüm temel iskeletini, altyapısını ve tasarım sistemini kuracaksın. Bu adım diğer tüm adımların üzerine inşa edileceği temel olduğu için HİÇBİR DETAY atlanmamalı, her yapı taşı eksiksiz ve production-ready olmalı.

---

#### 1. PROJE OLUŞTURMA

`c:\Users\erayu\Desktop\nihaitezmobil` dizininde Flutter projesi oluştur:
- Proje adı: `moodlens_mobile`
- Org: `com.moodlens`
- Platforms: android, ios
- `flutter create` komutuyla oluştur

---

#### 2. PAKET KURULUMU (pubspec.yaml)

Aşağıdaki paketleri `pubspec.yaml`'a ekle ve `flutter pub get` çalıştır:

**State Management & Architecture:**
- `flutter_riverpod: ^2.6.1`
- `riverpod_annotation: ^2.6.1`

**Routing:**
- `go_router: ^14.8.1`

**HTTP & Networking:**
- `dio: ^5.7.0`

**Animasyon & Premium UI:**
- `flutter_animate: ^4.5.2`
- `lottie: ^3.3.1`
- `rive: ^0.13.20`
- `animated_text_kit: ^4.2.3`
- `shimmer: ^3.0.0`
- `flutter_staggered_animations: ^1.1.1`
- `confetti_widget: ^0.4.0`
- `animate_do: ^3.3.4`

**Storage & Security:**
- `flutter_secure_storage: ^9.2.4`

**Image & Camera:**
- `image_picker: ^1.1.2`
- `camera: ^0.11.0+2`
- `cached_network_image: ^3.4.1`

**Charts:**
- `fl_chart: ^0.70.2`

**Utilities:**
- `url_launcher: ^6.3.1`
- `intl: ^0.19.0`
- `google_fonts: ^6.2.1`
- `uuid: ^4.5.1`
- `path_provider: ^2.1.5`
- `connectivity_plus: ^6.1.3`

**Dev Dependencies:**
- `riverpod_generator: ^2.6.3`
- `build_runner: ^2.4.14`
- `json_serializable: ^6.9.3`
- `json_annotation: ^4.9.0`
- `freezed: ^2.5.8`
- `freezed_annotation: ^2.4.4`

`flutter` bölümüne `assets` yolları ekle:
```yaml
flutter:
  assets:
    - assets/images/
    - assets/animations/
    - assets/lottie/
    - assets/rive/
    - assets/icons/
```

---

#### 3. KLASÖR YAPISI (Clean Architecture — Feature-First)

`lib/` altında aşağıdaki yapıyı oluştur. Her klasör için boş `.gitkeep` veya placeholder dosya bırak:

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── constants/
│   │   ├── api_constants.dart         ← Base URL, endpoint paths
│   │   ├── app_constants.dart         ← App-wide sabitler
│   │   └── emotion_constants.dart     ← 12 duygu tanımı, renkler, emoji
│   ├── theme/
│   │   ├── app_theme.dart             ← ThemeData (dark & light)
│   │   ├── app_colors.dart            ← Tüm renk tanımları
│   │   ├── app_typography.dart        ← TextStyle tanımları (Google Fonts Inter)
│   │   └── app_decorations.dart       ← Glassmorphism, gradient, shadow presets
│   ├── network/
│   │   ├── dio_client.dart            ← Dio instance, interceptors, timeout
│   │   ├── api_interceptor.dart       ← JWT token ekleme, language header, error handling
│   │   └── api_exception.dart         ← Custom exception sınıfları
│   ├── storage/
│   │   ├── secure_storage_service.dart ← FlutterSecureStorage wrapper
│   │   └── preferences_service.dart    ← SharedPreferences wrapper (tema, dil, onboarding)
│   ├── router/
│   │   └── app_router.dart            ← GoRouter konfigürasyonu, tüm route tanımları
│   ├── utils/
│   │   ├── extensions.dart            ← String, BuildContext, DateTime extension'lar
│   │   └── validators.dart            ← Email, password, username validasyonları
│   ├── widgets/
│   │   ├── animated_gradient_background.dart  ← Mesh gradient animasyonlu arka plan
│   │   ├── glassmorphism_card.dart             ← Reusable glassmorphism kart
│   │   ├── premium_button.dart                 ← Glow, ripple efektli buton
│   │   ├── animated_loading.dart               ← Lottie/shimmer loading widget
│   │   ├── particle_background.dart            ← Floating parçacık animasyonu
│   │   ├── emotion_badge.dart                  ← Duygu renkli badge widget
│   │   └── network_status_banner.dart          ← Connectivity durumu
│   └── i18n/
│       ├── app_localizations.dart     ← Lokalizasyon delegate
│       ├── tr.dart                    ← Türkçe çeviriler
│       └── en.dart                    ← İngilizce çeviriler
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── auth_repository.dart
│   │   │   └── auth_remote_source.dart
│   │   ├── domain/
│   │   │   ├── auth_state.dart
│   │   │   └── user_model.dart
│   │   └── presentation/
│   │       ├── login_screen.dart
│   │       ├── register_screen.dart
│   │       └── providers/
│   │           └── auth_provider.dart
│   ├── splash/
│   │   └── presentation/
│   │       └── splash_screen.dart
│   ├── onboarding/
│   │   └── presentation/
│   │       └── onboarding_screen.dart
│   ├── analyze/
│   │   ├── data/
│   │   │   ├── analyze_repository.dart
│   │   │   └── analyze_remote_source.dart
│   │   ├── domain/
│   │   │   ├── analyze_state.dart
│   │   │   └── analyze_result_model.dart
│   │   └── presentation/
│   │       ├── analyze_screen.dart
│   │       └── providers/
│   │           └── analyze_provider.dart
│   ├── result/
│   │   ├── data/
│   │   │   └── result_repository.dart
│   │   ├── domain/
│   │   │   ├── recommendation_model.dart
│   │   │   └── feedback_model.dart
│   │   └── presentation/
│   │       ├── result_screen.dart
│   │       └── providers/
│   │           └── result_provider.dart
│   ├── history/
│   │   ├── data/
│   │   │   └── history_repository.dart
│   │   ├── domain/
│   │   │   └── history_item_model.dart
│   │   └── presentation/
│   │       ├── history_screen.dart
│   │       └── providers/
│   │           └── history_provider.dart
│   ├── profile/
│   │   ├── data/
│   │   │   └── profile_repository.dart
│   │   ├── domain/
│   │   │   └── profile_model.dart
│   │   └── presentation/
│   │       ├── profile_screen.dart
│   │       └── providers/
│   │           └── profile_provider.dart
│   ├── settings/
│   │   └── presentation/
│   │       ├── settings_screen.dart
│   │       └── providers/
│   │           └── settings_provider.dart
│   └── metrics/
│       ├── data/
│       │   └── metrics_repository.dart
│       ├── domain/
│       │   └── metrics_model.dart
│       └── presentation/
│           ├── metrics_screen.dart
│           └── providers/
│               └── metrics_provider.dart
└── shared/
    ├── models/
    │   └── api_response.dart          ← Generic API response wrapper
    └── providers/
        ├── dio_provider.dart          ← Dio instance provider
        ├── storage_provider.dart      ← Storage service providers
        ├── connectivity_provider.dart ← Network connectivity provider
        └── locale_provider.dart       ← Dil seçimi provider
```

---

#### 4. TEMA SİSTEMİ (DETAYLI)

**`app_colors.dart`**: Aşağıdaki renkleri tanımla:
```dart
// Koyu tema (Ana tema)
static const background = Color(0xFF0A0E1A);
static const surface = Color(0xFF111827);
static const card = Color(0xFF1E293B);
static const primary = Color(0xFF06B6D4);     // cyan
static const secondary = Color(0xFF8B5CF6);    // mor
static const accent = Color(0xFFF472B6);       // pembe
static const success = Color(0xFF10B981);
static const error = Color(0xFFEF4444);
static const warning = Color(0xFFF59E0B);
static const textPrimary = Color(0xFFF1F5F9);
static const textSecondary = Color(0xFF94A3B8);
static const border = Color(0xFF334155);
static const shimmerBase = Color(0xFF1E293B);
static const shimmerHighlight = Color(0xFF334155);

// Her 12 duygu için renk
static const emotionColors = {
  'happy': Color(0xFFFFD700),
  'sad': Color(0xFF6366F1),
  'angry': Color(0xFFEF4444),
  'anxious': Color(0xFFF59E0B),
  'excited': Color(0xFFEC4899),
  'calm': Color(0xFF06B6D4),
  'tired': Color(0xFF8B5CF6),
  'stressed': Color(0xFFF97316),
  'nostalgic': Color(0xFFA78BFA),
  'motivated': Color(0xFF10B981),
  'hopeful': Color(0xFF34D399),
  'overwhelmed': Color(0xFFF43F5E),
};
```

**`app_typography.dart`**: Google Fonts Inter kullanarak `displayLarge` → `bodySmall` tüm text style'ları tanımla. Başlıklar için Outfit fontunu kullan.

**`app_theme.dart`**: `ThemeData` oluştur:
- Dark tema (varsayılan)
- Light tema
- Material 3 tasarım
- Custom `AppBarTheme`, `CardTheme`, `InputDecorationTheme`, `ElevatedButtonTheme`, `BottomNavigationBarTheme` tanımları
- Tüm geçişlerde smooth animasyon (pageTransitionsTheme)

**`app_decorations.dart`**: Reusable dekorasyon preset'leri:
- Glassmorphism efekti (blur + gradient border + opacity)
- Premium shadow (multi-layer shadow)
- Gradient border decoration
- Neon glow efekti

---

#### 5. NETWORK KATMANI (DIO)

**`dio_client.dart`**:
- Base URL: `http://10.0.2.2:5000` (Android emulator) veya ortam değişkeni
- Connect timeout: 15 saniye
- Receive timeout: 120 saniye (analiz uzun sürebilir)
- Content-Type: application/json

**`api_interceptor.dart`**:
- Request interceptor: FlutterSecureStorage'dan JWT token oku, `Authorization: Bearer {token}` header'ı ekle
- Request interceptor: `X-MoodLens-Language` header'ı (TR veya EN) ekle
- Request interceptor: `X-Guest-Session-Id` header'ı ekle (giriş yapılmamışsa)
- Response interceptor: 401 hatası → token sil, login'e yönlendir
- Error interceptor: `ApiException` nesnesi oluştur (code, message, status alanları)

**`api_exception.dart`**:
```dart
class ApiException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;
  final dynamic details;
}
```

---

#### 6. STORAGE KATMANI

**`secure_storage_service.dart`**:
- `saveToken(String token)`
- `getToken() → String?`
- `deleteToken()`
- `saveUser(UserModel user)` (JSON serialize)
- `getUser() → UserModel?`
- `clearAll()`

**`preferences_service.dart`**:
- `getLocale() → String` (varsayılan: cihaz dili veya 'tr')
- `setLocale(String locale)`
- `getThemeMode() → ThemeMode`
- `setThemeMode(ThemeMode mode)`
- `isOnboardingCompleted() → bool`
- `setOnboardingCompleted()`
- `getGuestSessionId() → String` (yoksa UUID oluştur ve kaydet)
- `getGuestRemainingAnalyses() → int`
- `setGuestRemainingAnalyses(int count)`

---

#### 7. ROUTER KONFİGÜRASYONU (GoRouter)

**`app_router.dart`**:
```
/splash               → SplashScreen
/onboarding           → OnboardingScreen
/login                → LoginScreen
/register             → RegisterScreen
/                     → ShellRoute (BottomNav)
  ├── /analyze        → AnalyzeScreen
  ├── /history        → HistoryScreen
  └── /profile        → ProfileScreen
/result/:historyId    → ResultScreen
/settings             → SettingsScreen
/metrics              → MetricsScreen (admin only)
```

- Redirect logic: Token yoksa → /login veya /onboarding
- Auth guard: Giriş yapılmışsa /login'e erişimi engelle
- refreshListenable: Auth state değişikliğini dinle

---

#### 8. EMOTION CONSTANTS

**`emotion_constants.dart`**: Web'deki `emotion_contract.json`'dan 12 duyguyu Dart enum veya class olarak tanımla:
```dart
enum Emotion {
  happy, sad, angry, anxious, excited, calm,
  tired, stressed, nostalgic, motivated, hopeful, overwhelmed
}
```
Her biri için:
- `key` (API değeri)
- `group` (positive / negative / neutral)
- `labelTr` (Türkçe isim)
- `labelEn` (İngilizce isim)
- `color` (Color)
- `emoji` (String emoji karakteri)
- `icon` (IconData)

---

#### 9. SHARED WIDGETS (İLK BATCH)

Bu adımda sadece yapısal widget'ları oluştur (animasyonlar ADIM 2'de gelecek):

**`glassmorphism_card.dart`**: ClipRRect + BackdropFilter + gradient border
**`premium_button.dart`**: AnimatedContainer, ink effect, gradient, optional glow
**`animated_loading.dart`**: CircularProgressIndicator yerine premium shimmer/pulse
**`emotion_badge.dart`**: Duygu renginde chip/badge
**`network_status_banner.dart`**: Connectivity dinleyici, offline banner

---

#### 10. MAIN.DART & APP.DART

**`main.dart`**:
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Secure storage init
  // Preferences init
  runApp(const ProviderScope(child: MoodLensApp()));
}
```

**`app.dart`**:
- `ConsumerWidget` olarak
- Riverpod ile tema, locale dinleme
- GoRouter.routerDelegate + routeInformationParser
- MaterialApp.router kullanımı
- Google Fonts tema entegrasyonu

---

#### 11. DOĞRULAMA

Tüm adımlar tamamlandıktan sonra:
1. `flutter pub get` — hata yok
2. `flutter analyze` — 0 hata, 0 uyarı (mümkün olduğunca)
3. Uygulama çalıştırılabilir durumda (boş bir ana ekran gösterir)

---

#### ÖNEMLİ KURALLAR

- Her dosya başında dosyanın ne yaptığını açıklayan `///` yorum bloğu olsun
- Tüm importlar düzenli olsun (dart: → package: → relative: sırasıyla)
- Riverpod provider'lar `@riverpod` annotation kullanmasın, manuel `Provider` / `StateNotifierProvider` / `FutureProvider` kullansın (code gen karmaşıklığından kaçın)
- Türkçe ve İngilizce string'ler i18n dosyalarında olsun, widget'lar içinde hardcoded olmasın
- `const` constructor kullan mümkün olan her yerde

---

## Amac

Flutter projesinin tüm temel altyapısını kurmak: klasör yapısı, tema sistemi, network katmanı, storage, routing, i18n, shared widget'lar ve Riverpod provider yapısı. Bu adım tamamlandığında proje derlenebilir durumda olacak ve sonraki tüm adımlar bu iskelet üzerine inşa edilecek.

## Kapsam

- `c:\Users\erayu\Desktop\nihaitezmobil\` dizininde Flutter projesi oluşturma
- `pubspec.yaml` — tüm paketler
- `lib/core/` — theme, network, storage, router, constants, utils, widgets, i18n
- `lib/features/` — boş feature klasör yapıları
- `lib/shared/` — providers ve modeller
- `lib/main.dart` ve `lib/app.dart`
- `assets/` dizinleri

## Kabul kriterleri

1. ✅ `flutter pub get` hatasız tamamlanıyor
2. ✅ `flutter analyze` kritik hata yok
3. ✅ Proje çalıştırıldığında boş bir ekran (placeholder) gösteriyor
4. ✅ Tüm klasör yapısı oluşturulmuş ve dosyalar mevcut
5. ✅ Tema sistemi (koyu/açık) tanımlı ve çalışıyor
6. ✅ Dio client konfigüre edilmiş (base URL, interceptors)
7. ✅ GoRouter route'ları tanımlı (placeholder ekranlarla)
8. ✅ 12 duygu tanımı (renk, isim, emoji) mevcut
9. ✅ i18n altyapısı (en az 10 temel string TR/EN) mevcut
10. ✅ Shared widget'lar (glassmorphism card, premium button, vb.) oluşturulmuş
