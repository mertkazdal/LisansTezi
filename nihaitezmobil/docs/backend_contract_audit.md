# M007-R Backend Contract Audit

Bu dokuman mobil uygulamanin backend/data kontratini web uygulamasindaki kanonik `client/src/services/api.js` ve `api-gateway` controller/DTO yapisi ile esler. Web bu adim icin referans degil, kanondur.

## Header ve Oturum Davranisi

- Auth token varsa mobil `Authorization: Bearer <token>` gonderir.
- Mobil her istekte `X-MoodLens-Language` ve `Accept-Language` headerlarini gonderir.
- Mobil her istekte stabil `X-Guest-Session-Id` headerini gonderir.
- Guest session storage keyleri web ile ayni kanonik isimlere cekildi: `moodlens_guest_session_id` ve `moodlens_guest_remaining`.
- Auth storage keyleri web ile uyumlu tutuldu: `access_token` ve `tezfinal_user`.
- Login/register sonrasi webdeki `resetGuestSessionState` karsiligi olarak guest session ve quota temizlenir.
- Logout sonrasi webdeki `resetGuestQuotaState` karsiligi olarak token/user temizlenir ve guest quota resetlenir.
- 401 durumunda `skipAuthClear` yoksa token/user temizlenir.
- `GUEST_QUOTA_EXCEEDED` hata kodunda local guest remaining degeri 0 yapilir.
- Backend hata payloadlari `message`, `detail`, `error.message`, `code` ve `status` kaynaklarindan `ApiException` icine normalize edilir.

## Endpoint Matrisi

| Endpoint | Web api.js | Backend action | Mobil remote source | Auth | Guest | Payload | Response | Mobil durumu |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /api/auth/register` | `authAPI.register` | `AuthController.Register` | `AuthRemoteSource.register` | Hayir | Evet | `username`, `email`, `password`, `guestSessionId` | `token`, `userId`, `username`, `email`, `role`, `isAdmin`, `guestDataMerged`, `migratedGuestAnalysesCount` | Uyumlu; guest merge alanlari state'e tasinir. |
| `POST /api/auth/login` | `authAPI.login` | `AuthController.Login` | `AuthRemoteSource.login` | Hayir | Evet | `email`, `password`, `guestSessionId` | Auth response alanlari | Uyumlu; `skipAuthClear` korunur. |
| `POST /api/analyze` | `emotionAPI.analyze` | `AnalyzeController.Analyze` | `AnalyzeRemoteSource.analyze` | Opsiyonel | Evet | `text`, `imageBase64`, `mimeType`, `guestSessionId` | `historyId`, `emotion`, `confidence`, `explanation`, `needsReason`, `reasonProvided`, `followUpQuestion`, `warning`, `modalityUsed`, `modelUsed`, `responseTimeMs`, `faceDetected`, `guestRemainingAnalyses`, `recommendations`, `feedback` | Uyumlu; null/empty payload alanlari temizlenir ve quota local state'e yazilir. |
| `GET /api/recommendations/{historyId}` | `emotionAPI.getRecommendations` | `RecommendationsController.GetRecommendations` | `RecommendationRemoteSource.getResultDetail` | Opsiyonel | Evet | Query `guestSessionId` | Result detail + `music`, `movies`, `books`, `lifeAdvice`, `feedback` | Tamamlandi; mobil artik sadece bundle degil result detail de parse eder. |
| `GET /api/history?page=&limit=` | `historyAPI.getHistory` | `HistoryController.GetHistory` | `HistoryRemoteSource.getHistory` | Evet | Hayir | Query `page`, `limit` | `items`, `total`, `page`, `limit`, `totalPages` | Uyumlu; manuel pagination state var. |
| `GET /api/history/{id}` | `historyAPI.getHistoryItem` | `HistoryController.GetHistoryItem` | `HistoryRemoteSource.getHistoryItem` | Evet | Hayir | Path `id` | History item | Uyumlu; auth-only fallback olarak kullanilir. |
| `POST /api/feedback/{historyId}` | `feedbackAPI.submit` | `FeedbackController.SubmitFeedback` | `FeedbackRemoteSource.submitFeedback` | Opsiyonel | Evet | `overallRating`, `analysisAccuracyRating`, `recommendationQualityRating`, `helpful`, `wouldReuse`, `comment` | `{ message, feedback }` | Uyumlu; mevcut feedback varsa yeniden submit engellenir. |
| `GET /api/feedback/{historyId}` | `feedbackAPI.get` | `FeedbackController.GetFeedback` | `FeedbackRemoteSource.getFeedback` | Opsiyonel | Evet | Query `guestSessionId` | Feedback DTO veya 404 | Uyumlu; 404 `null` olarak ele alinir. |
| `GET /api/user/profile` | `userAPI.getProfile` | `UserController.GetProfile` | `ProfileRemoteSource.getProfile` | Evet | Hayir | Yok | `id`, `username`, `email`, `avatarUrl`, `createdAt`, `totalAnalyses`, `mostFrequentEmotion`, `role`, `isAdmin`, `canDeleteAccount`, `deleteConfirmationText` | Uyumlu; ekstra `feedbackCount` gelirse kayipsiz parse edilir. |
| `DELETE /api/user/account` | `userAPI.deleteAccount` | `UserController.DeleteAccount` | `ProfileRemoteSource.deleteAccount` | Evet | Hayir | `confirmationText` | `message`, `deletedAnalyses`, `deletedRecommendations` | Uyumlu; basarida auth storage temizlenir. |
| `GET /api/metrics/dashboard` | `metricsAPI.getDashboard` | `MetricsController.GetDashboard` | `MetricsRemoteSource.getDashboard` | Admin | Hayir | Yok | `message`, `summary`, `topEmotions`, `modelDistribution`, `modalityDistribution`, `ratingDistribution`, `feedbackByEmotion`, `dailyActivity`, `recentAnalyses` | Uyumlu; dashboard summary guvenli parse edilir, raw korunur. |
| `GET /api/metrics/research` | `metricsAPI.getResearch` | `MetricsController.GetResearchMetrics` | `MetricsRemoteSource.getResearch` | Admin | Hayir | Yok | Research metrics raw map | Uyumlu; raw-safe parse. |
| `GET /api/metrics/comparison` | `metricsAPI.getComparison` | `MetricsController.GetComparison` | `MetricsRemoteSource.getComparison` | Admin | Hayir | Yok | Comparison raw map | Uyumlu; raw-safe parse. |
| `GET /api/metrics/response-times` | `metricsAPI.getResponseTimes` | `MetricsController.GetResponseTimes` | `MetricsRemoteSource.getResponseTimes` | Admin | Hayir | Yok | `average`, `min`, `max`, `samples` | Uyumlu; samples map tipleri guvenli parse edilir. |
| `GET /api/metrics/emotion-distribution` | `metricsAPI.getEmotionDistribution` | `MetricsController.GetEmotionDistribution` | `MetricsRemoteSource.getEmotionDistribution` | Admin | Hayir | Yok | `total`, `emotion_counts` | Uyumlu; map ve liste sekilleri desteklenir. |
| `GET /api/admin/overview` | `adminAPI.getOverview` | `AdminController.GetOverview` | `MetricsRemoteSource.getAdminOverview` | Admin | Hayir | Yok | Admin overview raw map | Uyumlu; metrics bundle icinde raw-safe tutulur. |
| `GET /api/admin/export/csv` | `adminAPI.downloadExportCsv` | `AdminController.ExportCsv` | `ApiConstants.adminExportCsv` | Admin | Hayir | Yok | CSV blob | Bilincli kapsam disi: mobilde indirme/paylasma paketi eklenmedi; endpoint constant olarak biliniyor, M008/M009'da UI ihtiyacina gore ele alinacak. |

## M007-R Duzeltmeleri

- Recommendation parse web aliaslariyla esitlendi: `music`, `movie/movies`, `book/books`, `advice/lifeAdvice`.
- Recommendation item alanlari kayipsiz tutulacak sekilde genisletildi: `title`, `artist`, `author`, `description`, `reason`, `url`, `imageUrl`, `externalUrl`, `source`, `type`, `category`, `raw`.
- Result fallback artik `GET /api/recommendations/{historyId}` cevabindan duygu, confidence, explanation, metadata, warning, feedback ve recommendations okuyabilir.
- History numeric parse string/number varyasyonlarina dayanacak hale getirildi.
- Feedback provider state'ine `alreadySubmitted` eklendi.
- Profile account deletion response kayipsiz parse edilir.
- Metrics state'leri `unauthorized`, `forbidden`, `empty`, `failure` olarak ayrildi.
- Hata/i18n anahtarlari TR/EN tarafinda tamamlandi.

## Kapsam Disi

- Tam cihaz E2E testi bu promptun kapsami degildir.
- Web sayfa paritesi ve premium mobil UI aktarimi M008 kapsamindadir.
- CSV export mobil indirme/paylasma deneyimi icin yeni paket eklenmedi.
