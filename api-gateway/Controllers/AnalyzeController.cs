using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;
using MoodLens.ApiGateway.Services;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/analyze")]
public class AnalyzeController : ControllerBase
{
    private const int GuestAnalysisLimit = 3;
    private const int DefaultAnalysisCooldownSeconds = 60;
    private const int FinalAnalysisKeyAttemptIndex = 2;
    private const string GuestSessionCookieName = "moodlens_guest_session";
    private const int MinAnalysisAge = 13;
    private const int MaxAnalysisAge = 120;

    private readonly AppDbContext _db;
    private readonly AiServiceClient _aiClient;
    private readonly AnalysisCooldownService _analysisCooldowns;
    private readonly GuestAnalysisStore _guestAnalysisStore;
    private readonly GuestIdentityService _guestIdentityService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IServiceScopeFactory _scopeFactory;

    public AnalyzeController(
        AppDbContext db,
        AiServiceClient aiClient,
        AnalysisCooldownService analysisCooldowns,
        GuestAnalysisStore guestAnalysisStore,
        GuestIdentityService guestIdentityService,
        IHttpClientFactory httpClientFactory,
        IServiceScopeFactory scopeFactory
    )
    {
        _db = db;
        _aiClient = aiClient;
        _analysisCooldowns = analysisCooldowns;
        _guestAnalysisStore = guestAnalysisStore;
        _guestIdentityService = guestIdentityService;
        _httpClientFactory = httpClientFactory;
        _scopeFactory = scopeFactory;
    }

    [HttpPost]
    public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest request)
    {
        var userId = GetUserId();

        var language = GetPreferredLanguage();
        var guestSession = userId == null ? ResolveGuestSessionState(request.GuestSessionId) : null;
        var guestSessionId = guestSession?.SessionId;
        var actorKey = userId == null
            ? $"guest:{guestSessionId}"
            : ResolveActorKey(userId, null)!;
        var guestUsageCount = 0;
        var hasImage = !string.IsNullOrWhiteSpace(request.ImageBase64);
        var hasText = !string.IsNullOrWhiteSpace(request.Text);
        var normalizedText = request.Text?.Trim() ?? string.Empty;
        var normalizedMimeType = "image/jpeg";
        User? currentUser = null;
        NormalizedRecommendationSurvey? guestSurvey = null;
        string? personalityJson = null;
        string? profileAgeGroup = null;
        string? guestAgeGroup = null;

        if (userId is { } authenticatedUserId)
        {
            currentUser = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Id == authenticatedUserId);

            if (currentUser == null)
            {
                return Unauthorized(new
                {
                    message = "Please sign in again before starting an analysis.",
                    code = "AUTHENTICATION_REQUIRED"
                });
            }

            if (!RecommendationSurveyService.HasCompletedSurvey(currentUser))
            {
                return SurveyRequired(language);
            }

            var personalityProfile = await _db.UserPersonalityProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(profile => profile.UserId == authenticatedUserId);

            if (personalityProfile != null)
            {
                personalityJson = NormalizePersonalityJson(personalityProfile.BigFiveJson);
                profileAgeGroup = NormalizeAgeGroupOrNull(personalityProfile.AgeGroup);

                if (await ShouldTriggerPersonalityRefreshAsync(authenticatedUserId))
                {
                    TriggerPersonalityRefreshInBackground(authenticatedUserId, language);
                }
            }
        }
        else if (guestSession?.SurveyCompleted != true && request.RecommendationSurvey == null)
        {
            return SurveyRequired(language);
        }
        else
        {
            personalityJson = NormalizePersonalityJson(guestSession?.PersonalityJson);
            guestAgeGroup = NormalizeAgeGroupOrNull(guestSession?.AgeGroup);
        }

        if (userId == null)
        {
            guestUsageCount = guestSession?.CompletedAnalyses ?? 0;
            if (guestUsageCount >= GuestAnalysisLimit)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = BuildGuestQuotaMessage(language),
                    code = "GUEST_QUOTA_EXCEEDED",
                    guestRemainingAnalyses = 0
                });
            }
        }

        var analysisAttemptIndex = _analysisCooldowns.GetCurrentAttemptIndex(actorKey);

        if (!hasImage && !hasText)
        {
            return BadRequest(new
            {
                message = BuildInputRequiredMessage(language),
                code = "ANALYSIS_INPUT_REQUIRED"
            });
        }

        var requestAgeGroup = NormalizeAgeGroupOrNull(request.AgeGroup);
        var existingAgeGroup = requestAgeGroup ?? profileAgeGroup ?? guestAgeGroup;
        if (!TryNormalizeAnalysisAge(
                request.Age,
                existingAgeGroup,
                language,
                out var analysisAge,
                out var ageCode,
                out var ageMessage))
        {
            return BadRequest(new
            {
                message = ageMessage,
                code = ageCode
            });
        }
        var recommendationAgeGroup = existingAgeGroup ?? AgeToGroup(analysisAge);

        if (hasImage && IsUnsupportedHeicMimeType(request.MimeType))
        {
            return BadRequest(new
            {
                error = "UNSUPPORTED_IMAGE_TYPE",
                message = BuildUnsupportedImageTypeMessage(language),
                code = "UNSUPPORTED_IMAGE_TYPE"
            });
        }

        if (hasImage && !TryNormalizeMimeType(request.MimeType, out normalizedMimeType))
        {
            return BadRequest(new
            {
                message = BuildUnsupportedImageTypeMessage(language),
                code = "UNSUPPORTED_IMAGE_TYPE"
            });
        }

        if (hasText && normalizedText.Length is < 10 or > 1000)
        {
            return BadRequest(new
            {
                message = BuildInvalidTextLengthMessage(language),
                code = "INVALID_TEXT_LENGTH"
            });
        }

        if (hasImage)
        {
            try
            {
                await _aiClient.ValidateImageAsync(request.ImageBase64!, normalizedMimeType, language);
            }
            catch (AiServiceException ex)
            {
                var statusCode = ex.StatusCode is >= 400 and < 600 ? ex.StatusCode : 400;
                return StatusCode(statusCode, new
                {
                    message = ex.Message,
                    code = ex.ErrorCode ?? "IMAGE_VALIDATION_FAILED"
                });
            }
        }

        if (_analysisCooldowns.TryGetRemainingSeconds(actorKey, out var cooldownRemainingSeconds, out var cooldownReason))
        {
            var isTextValidationCooldown = string.Equals(cooldownReason, "text_validation", StringComparison.Ordinal);
            return StatusCode(StatusCodes.Status429TooManyRequests, new
            {
                message = isTextValidationCooldown
                    ? BuildTextValidationCooldownMessage(language, cooldownRemainingSeconds)
                    : BuildCooldownMessage(language, cooldownRemainingSeconds),
                code = isTextValidationCooldown
                    ? "ANALYSIS_TEXT_VALIDATION_COOLDOWN"
                    : "ANALYSIS_COOLDOWN_ACTIVE",
                retryAfterSeconds = cooldownRemainingSeconds
            });
        }

        if (userId == null &&
            request.RecommendationSurvey != null &&
            !RecommendationSurveyService.TryNormalize(
                request.RecommendationSurvey,
                out guestSurvey,
                out var surveyCode,
                out var surveyMessage))
        {
            return BadRequest(new
            {
                message = surveyMessage,
                code = surveyCode
            });
        }

        if (userId == null && guestSession is not null && request.RecommendationSurvey != null)
        {
            guestSession = MarkGuestSurveyCompleted(guestSession);
        }

        try
        {
            var analysisKeyEnv = ResolveAnalysisKeyEnv(hasImage, hasText, analysisAttemptIndex);
            var stopwatch = Stopwatch.StartNew();
            var aiResult = await _aiClient.AnalyzeEmotionAsync(
                hasImage ? request.ImageBase64 : null,
                hasText ? normalizedText : null,
                hasImage ? normalizedMimeType : null,
                language,
                analysisKeyEnv,
                userId,
                personalityJson
            );
            stopwatch.Stop();

            var emotion = aiResult.GetProperty("emotion").GetString() ?? "calm";
            var confidence = aiResult.GetProperty("confidence").GetDouble();
            var explanation = aiResult.GetProperty("explanation").GetString() ?? string.Empty;
            var analysisWarning = GetOptionalString(aiResult, "warning");
            var contradictionDetected = GetOptionalBool(aiResult, "contradictionDetected")
                ?? GetOptionalBool(aiResult, "contradiction_detected")
                ?? false;
            var clarificationMessage = GetOptionalString(aiResult, "clarificationMessage")
                ?? GetOptionalString(aiResult, "clarification_message");
            var imageFallbackUsed = GetOptionalBool(aiResult, "imageFallbackUsed") ?? false;
            var faceDetected = HasValue(aiResult, "faceEmotion") || HasValue(aiResult, "face_emotion");
            var modalityUsed = imageFallbackUsed ? "text" : ResolveModalityUsed(hasImage, hasText);
            var faceEmotion = GetOptionalString(aiResult, "faceEmotion") ?? GetOptionalString(aiResult, "face_emotion");
            var faceConfidence = GetOptionalDouble(aiResult, "faceConfidence") ?? GetOptionalDouble(aiResult, "face_confidence");
            var textEmotion = GetOptionalString(aiResult, "textEmotion") ?? GetOptionalString(aiResult, "text_emotion");
            var textConfidence = GetOptionalDouble(aiResult, "textConfidence") ?? GetOptionalDouble(aiResult, "text_confidence");
            var textValidationFailed = GetOptionalBool(aiResult, "textValidationFailed")
                ?? GetOptionalBool(aiResult, "text_validation_failed")
                ?? false;
            var textValidationReason = GetOptionalString(aiResult, "textValidationReason")
                ?? GetOptionalString(aiResult, "text_validation_reason");
            var textValidationCode = GetOptionalString(aiResult, "textValidationCode")
                ?? GetOptionalString(aiResult, "text_validation_code");
            var textQualityScore = GetOptionalDouble(aiResult, "textQualityScore")
                ?? GetOptionalDouble(aiResult, "text_quality_score");
            var aiModelUsed = GetOptionalString(aiResult, "modelUsed")
                ?? GetOptionalString(aiResult, "model_used");
            var aiImageModelUsed = GetOptionalString(aiResult, "imageModelUsed")
                ?? GetOptionalString(aiResult, "image_model_used");
            var aiImageProvider = GetOptionalString(aiResult, "imageProvider")
                ?? GetOptionalString(aiResult, "image_provider");
            var resolvedModelUsed = imageFallbackUsed
                ? "gemini-text"
                : hasImage && hasText && !string.IsNullOrWhiteSpace(aiImageModelUsed)
                    ? $"{aiImageModelUsed} + gemini-text"
                    : aiModelUsed ?? aiImageModelUsed ?? ResolveModelUsed(hasImage, hasText);

            if (hasText && textValidationFailed)
            {
                if (analysisAttemptIndex >= FinalAnalysisKeyAttemptIndex)
                {
                    _analysisCooldowns.StartCooldown(actorKey, DefaultAnalysisCooldownSeconds, "text_validation");
                    return StatusCode(StatusCodes.Status429TooManyRequests, new
                    {
                        message = BuildTextValidationCooldownMessage(language, DefaultAnalysisCooldownSeconds),
                        code = "ANALYSIS_TEXT_VALIDATION_COOLDOWN",
                        retryAfterSeconds = DefaultAnalysisCooldownSeconds,
                        textValidationReason,
                        textValidationCode,
                        textQualityScore
                    });
                }

                _analysisCooldowns.AdvanceRetryAttempt(actorKey);
                var textAlert = BuildTextValidationAlert(language, analysisAttemptIndex, clarificationMessage ?? analysisWarning);
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    message = textAlert.Message,
                    code = "ANALYSIS_TEXT_VALIDATION_WARNING",
                    alertTitle = textAlert.Title,
                    alertHint = textAlert.Hint,
                    nextAttempt = analysisAttemptIndex + 2,
                    textValidationReason,
                    textValidationCode,
                    textQualityScore
                });
            }

            if (hasImage && hasText && contradictionDetected)
            {
                if (analysisAttemptIndex >= FinalAnalysisKeyAttemptIndex)
                {
                    _analysisCooldowns.StartCooldown(actorKey, DefaultAnalysisCooldownSeconds, "contradiction");
                    return StatusCode(StatusCodes.Status429TooManyRequests, new
                    {
                        message = BuildCooldownMessage(language, DefaultAnalysisCooldownSeconds),
                        code = "ANALYSIS_RETRY_COOLDOWN",
                        retryAfterSeconds = DefaultAnalysisCooldownSeconds
                    });
                }

                _analysisCooldowns.AdvanceContradictionAttempt(actorKey);
                var alert = BuildContradictionAlert(language, analysisAttemptIndex, clarificationMessage);
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    message = alert.Message,
                    code = "ANALYSIS_CONTRADICTION_WARNING",
                    alertTitle = alert.Title,
                    alertHint = alert.Hint,
                    nextAttempt = analysisAttemptIndex + 2
                });
            }

            _analysisCooldowns.ResetProgress(actorKey);
            var analysisContext = BuildAnalysisContext(
                normalizedText,
                modalityUsed,
                language,
                faceEmotion,
                textEmotion
            );
            var recommendationBaseContext = BuildAgeAwareRecommendationContext(analysisContext, analysisAge, language);

            if (userId == null)
            {
                var guestHistoryId = Guid.NewGuid();
                JsonElement? guestRecommendations = null;
                string? guestWarning = analysisWarning;
                var guestPipelineStatus = "complete";
                string? guestPartialError = null;
                var guestMissingRecommendations = new List<string>();
                var guestRecommendationContext = RecommendationSurveyService.BuildRecommendationContext(recommendationBaseContext, guestSurvey);

                try
                {
                    guestRecommendations = await _aiClient.GetRecommendationsAsync(
                        emotion,
                        guestRecommendationContext,
                        language,
                        true,
                        null,
                        recommendationAgeGroup,
                        confidence,
                        normalizedText,
                        null,
                        guestSurvey?.MovieGenres
                    );
                    if (guestRecommendations.Value.TryGetProperty("coachComment", out var coachCommentProperty) &&
                        coachCommentProperty.ValueKind == JsonValueKind.String)
                    {
                        var coachComment = coachCommentProperty.GetString()?.Trim();
                        if (!string.IsNullOrWhiteSpace(coachComment))
                        {
                            explanation = coachComment;
                        }
                    }
                    var recommendationStatus = ReadRecommendationStatus(guestRecommendations);
                    guestPipelineStatus = recommendationStatus.Status;
                    guestPartialError = recommendationStatus.PartialError;
                    guestMissingRecommendations = recommendationStatus.MissingRecommendations;
                    if (!string.IsNullOrWhiteSpace(guestPartialError))
                    {
                        guestWarning = AppendWarning(guestWarning, guestPartialError);
                    }
                }
                catch (AiServiceException ex)
                {
                    guestPipelineStatus = "partial";
                    guestPartialError = $"Recommendations are partially unavailable: {ex.Message}";
                    guestMissingRecommendations = new List<string> { "music", "films", "books" };
                    guestWarning = AppendWarning(guestWarning, guestPartialError);
                    guestRecommendations = BuildFallbackRecommendationsElement(emotion, explanation, language, guestPartialError, guestMissingRecommendations);
                }
                catch (HttpRequestException ex)
                {
                    guestPipelineStatus = "partial";
                    guestPartialError = $"Recommendations are partially unavailable: {ex.Message}";
                    guestMissingRecommendations = new List<string> { "music", "films", "books" };
                    guestWarning = AppendWarning(guestWarning, guestPartialError);
                    guestRecommendations = BuildFallbackRecommendationsElement(emotion, explanation, language, guestPartialError, guestMissingRecommendations);
                }

                var completedGuestUsageCount = RegisterGuestCompletedAnalysis(guestSession);
                var guestRecommendationBundle = GuestRecommendationBundle.FromJsonElement(guestRecommendations);
                _guestAnalysisStore.Save(_guestAnalysisStore.CreateRecord(
                    guestHistoryId,
                    actorKey,
                    guestSessionId,
                    emotion,
                    confidence,
                    explanation,
                    guestWarning,
                    modalityUsed,
                    resolvedModelUsed,
                    (int)stopwatch.ElapsedMilliseconds,
                    faceDetected,
                    guestRecommendationBundle
                ));

                return Ok(new
                {
                    historyId = guestHistoryId,
                    emotion,
                    confidence,
                    explanation,
                    warning = guestWarning,
                    modalityUsed,
                    modelUsed = resolvedModelUsed,
                    imageModelUsed = aiImageModelUsed,
                    imageProvider = aiImageProvider,
                    responseTimeMs = (int)stopwatch.ElapsedMilliseconds,
                    faceDetected,
                    needsReason = false,
                    reasonProvided = true,
                    status = guestPipelineStatus,
                    partial_error = guestPartialError,
                    partialError = guestPartialError,
                    missing_recommendations = guestMissingRecommendations,
                    missingRecommendations = guestMissingRecommendations,
                    ask_avatar_refresh = false,
                    askAvatarRefresh = false,
                    coach_advice = explanation,
                    ask_media_log = true,
                    guestRemainingAnalyses = Math.Max(0, GuestAnalysisLimit - completedGuestUsageCount),
                    recommendations = new
                    {
                        music = guestRecommendationBundle.Music,
                        movies = guestRecommendationBundle.Movies,
                        books = guestRecommendationBundle.Books,
                        lifeAdvice = guestRecommendationBundle.LifeAdvice,
                        activities = guestRecommendationBundle.LifeAdvice
                    },
                    data_sources = GetRecommendationDataSources(guestRecommendations),
                    dataSources = GetRecommendationDataSources(guestRecommendations)
                });
            }

            var resolvedUserId = userId ?? throw new InvalidOperationException("Authenticated user id missing.");
            var history = new EmotionHistory
            {
                UserId = resolvedUserId,
                GuestSessionId = null,
                DetectedEmotion = emotion,
                Confidence = confidence,
                Explanation = explanation,
                UserText = analysisContext,
                ImagePath = hasImage
                    ? $"analysis_{DateTime.UtcNow:yyyyMMddHHmmss}{GetImageExtension(normalizedMimeType)}"
                    : null,
                ModalityUsed = modalityUsed,
                ModelUsed = resolvedModelUsed,
                ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds,
                FaceDetected = faceDetected
            };

            JsonElement? recommendations = null;
            string? warning = analysisWarning;
            var pipelineStatus = "complete";
            string? partialError = null;
            var missingRecommendations = new List<string>();
            var recommendationContext = RecommendationSurveyService.BuildRecommendationContext(recommendationBaseContext, currentUser);
            var excludedMovieIds = await GetRecentlyRecommendedMovieIdsAsync(resolvedUserId);
            var surveyMovieGenres = RecommendationSurveyService.ToResponse(currentUser)?.MovieGenres ?? new List<string>();

            try
            {
                recommendations = await _aiClient.GetRecommendationsAsync(
                    emotion,
                    recommendationContext,
                    language,
                    true,
                    personalityJson,
                    recommendationAgeGroup,
                    confidence,
                    normalizedText,
                    resolvedUserId,
                    surveyMovieGenres,
                    excludedMovieIds
                );
                if (recommendations.Value.TryGetProperty("coachComment", out var coachCommentProperty) &&
                    coachCommentProperty.ValueKind == JsonValueKind.String)
                {
                    var coachComment = coachCommentProperty.GetString()?.Trim();
                    if (!string.IsNullOrWhiteSpace(coachComment))
                    {
                        explanation = coachComment;
                        history.Explanation = coachComment;
                    }
                }
                var recommendationStatus = ReadRecommendationStatus(recommendations);
                pipelineStatus = recommendationStatus.Status;
                partialError = recommendationStatus.PartialError;
                missingRecommendations = recommendationStatus.MissingRecommendations;
                if (!string.IsNullOrWhiteSpace(partialError))
                {
                    warning = AppendWarning(warning, partialError);
                }
            }
            catch (AiServiceException ex)
            {
                pipelineStatus = "partial";
                partialError = $"Recommendations are partially unavailable: {ex.Message}";
                missingRecommendations = new List<string> { "music", "films", "books" };
                warning = AppendWarning(warning, partialError);
                recommendations = BuildFallbackRecommendationsElement(emotion, explanation, language, partialError, missingRecommendations);
            }
            catch (HttpRequestException ex)
            {
                pipelineStatus = "partial";
                partialError = $"Recommendations are partially unavailable: {ex.Message}";
                missingRecommendations = new List<string> { "music", "films", "books" };
                warning = AppendWarning(warning, partialError);
                recommendations = BuildFallbackRecommendationsElement(emotion, explanation, language, partialError, missingRecommendations);
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();
            _db.EmotionHistories.Add(history);
            if (recommendations is { } recommendationValue)
            {
                SaveRecommendations(history.Id, recommendationValue);
            }

            await SaveAnalysisRecordAsync(
                history.Id,
                resolvedUserId,
                hasImage,
                hasText,
                emotion,
                confidence,
                faceEmotion,
                faceConfidence,
                textEmotion,
                textConfidence,
                contradictionDetected,
                language,
                recommendations,
                pipelineStatus
            );
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            var askAvatarRefresh = await ShouldAskAvatarRefreshAsync(resolvedUserId);

            return Ok(new
            {
                historyId = history.Id,
                emotion,
                confidence,
                explanation,
                warning,
                modalityUsed = history.ModalityUsed,
                modelUsed = history.ModelUsed,
                imageModelUsed = aiImageModelUsed,
                imageProvider = aiImageProvider,
                responseTimeMs = history.ResponseTimeMs,
                faceDetected = history.FaceDetected,
                needsReason = false,
                reasonProvided = true,
                status = pipelineStatus,
                partial_error = partialError,
                partialError,
                missing_recommendations = missingRecommendations,
                missingRecommendations,
                ask_avatar_refresh = askAvatarRefresh,
                askAvatarRefresh,
                coach_advice = explanation,
                ask_media_log = true,
                guestRemainingAnalyses = userId == null
                    ? (int?)Math.Max(0, GuestAnalysisLimit - guestUsageCount - 1)
                    : null,
                recommendations = new
                {
                    music = GetRecommendationCategory(recommendations, "music"),
                    movies = GetRecommendationCategory(recommendations, "movies"),
                    books = GetRecommendationCategory(recommendations, "books"),
                    lifeAdvice = GetRecommendationCategory(recommendations, "lifeAdvice"),
                    activities = GetRecommendationCategory(recommendations, "activities")
                },
                data_sources = GetRecommendationDataSources(recommendations),
                dataSources = GetRecommendationDataSources(recommendations)
            });
        }
        catch (AiServiceException ex)
        {
            if (IsImageContractErrorCode(ex.ErrorCode))
            {
                var statusCode = ex.StatusCode is >= 400 and < 600
                    ? ex.StatusCode
                    : StatusCodes.Status400BadRequest;
                return StatusCode(statusCode, new
                {
                    message = ex.Message,
                    code = ex.ErrorCode
                });
            }

            if (hasImage &&
                hasText &&
                analysisAttemptIndex >= FinalAnalysisKeyAttemptIndex &&
                ex.ErrorCode == "AI_QUOTA_EXCEEDED")
            {
                _analysisCooldowns.StartCooldown(actorKey, DefaultAnalysisCooldownSeconds, "contradiction");
                return StatusCode(StatusCodes.Status429TooManyRequests, new
                {
                    message = BuildCooldownMessage(language, DefaultAnalysisCooldownSeconds),
                    code = "ANALYSIS_RETRY_COOLDOWN",
                    retryAfterSeconds = DefaultAnalysisCooldownSeconds
                });
            }

            if (ex.ErrorCode == "ANALYSIS_RETRY_COOLDOWN")
            {
                var retryAfterSeconds = Math.Max(1, ex.RetryAfterSeconds ?? DefaultAnalysisCooldownSeconds);
                _analysisCooldowns.StartCooldown(actorKey, retryAfterSeconds, "contradiction");
                return StatusCode(StatusCodes.Status429TooManyRequests, new
                {
                    message = ex.Message,
                    code = ex.ErrorCode,
                    retryAfterSeconds
                });
            }

            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "Analysis failed before an emotion result could be produced.",
                detail = ex.Message,
                code = ex.ErrorCode ?? "ANALYSIS_FAILED_BEFORE_EMOTION",
                retryAfterSeconds = ex.RetryAfterSeconds
            });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(503, new
            {
                message = BuildAiUnavailableMessage(language),
                detail = ex.Message,
                code = "AI_SERVICE_UNAVAILABLE"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = BuildUnexpectedAnalysisErrorMessage(language),
                detail = ex.Message,
                code = "ANALYSIS_UNEXPECTED_ERROR"
            });
        }
    }

    private void SaveRecommendations(Guid historyId, JsonElement recommendations)
    {
        var categories = new[]
        {
            (ApiCategory: "music", DbCategory: "music"),
            (ApiCategory: "movies", DbCategory: "movie"),
            (ApiCategory: "books", DbCategory: "book"),
            (ApiCategory: "lifeAdvice", DbCategory: "advice")
        };

        foreach (var (apiCategory, dbCategory) in categories)
        {
            if (!recommendations.TryGetProperty(apiCategory, out var categoryData) ||
                categoryData.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                continue;
            }

            _db.Recommendations.Add(new Recommendation
            {
                HistoryId = historyId,
                Category = dbCategory,
                Content = categoryData.GetRawText()
            });
        }
    }

    private IActionResult SurveyRequired(string language)
    {
        return StatusCode(StatusCodes.Status403Forbidden, new
        {
            error = "survey_required",
            message = language == "tr"
                ? "Analize başlamadan önce kısa bir anket doldurman gerekiyor."
                : "Please complete the short survey before starting the analysis.",
            code = "survey_required"
        });
    }

    private static bool TryNormalizeAnalysisAge(
        int? age,
        string? existingAgeGroup,
        string language,
        out int normalizedAge,
        out string code,
        out string message
    )
    {
        normalizedAge = 0;
        code = "AGE_REQUIRED";
        message = language == "tr"
            ? "Analize başlamadan önce yaş aralığını seçmen gerekiyor."
            : "Please select your age range before starting the analysis.";

        if (age == null)
        {
            if (!string.IsNullOrWhiteSpace(existingAgeGroup))
            {
                normalizedAge = RepresentativeAgeForGroup(existingAgeGroup);
                return true;
            }

            return false;
        }

        if (age is < MinAnalysisAge or > MaxAnalysisAge)
        {
            code = "INVALID_AGE";
            message = language == "tr"
                ? $"Yaş {MinAnalysisAge} ile {MaxAnalysisAge} arasında olmalı."
                : $"Age must be between {MinAnalysisAge} and {MaxAnalysisAge}.";
            return false;
        }

        normalizedAge = age.Value;
        return true;
    }

    private static int RepresentativeAgeForGroup(string ageGroup)
    {
        return ageGroup switch
        {
            "teen" => 16,
            "young_adult" => 21,
            "adult" => 30,
            "mature" => 45,
            _ => 30
        };
    }

    private static string AgeToGroup(int age)
    {
        return age switch
        {
            < 18 => "teen",
            < 25 => "young_adult",
            < 40 => "adult",
            _ => "mature"
        };
    }

    private static string? NormalizeAgeGroupOrNull(string? ageGroup)
    {
        var normalized = (ageGroup ?? string.Empty).Trim().ToLowerInvariant();
        return normalized is "teen" or "young_adult" or "adult" or "mature" ? normalized : null;
    }

    private static string BuildAgeAwareRecommendationContext(string analysisContext, int age, string language)
    {
        var ageGroup = age switch
        {
            < 18 => "minor / teen",
            < 25 => "young adult",
            < 40 => "adult",
            < 60 => "middle adult",
            _ => "older adult"
        };
        var ageContext = $"Age-aware recommendation criterion: user is {age} years old ({ageGroup}). Use age as a recommendation criterion for music, film, book, and life advice; keep all suggestions age-appropriate and life-stage suitable.";

        if (string.IsNullOrWhiteSpace(analysisContext))
        {
            return ageContext;
        }

        return $"{analysisContext}\n{ageContext}";
    }

    private async Task<bool> ShouldTriggerPersonalityRefreshAsync(Guid userId)
    {
        var lastUpdate = await _db.PersonalityUpdateLogs
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.UpdatedAt)
            .Select(item => (DateTime?)item.UpdatedAt)
            .FirstOrDefaultAsync();

        return lastUpdate == null || DateTime.UtcNow - lastUpdate.Value > TimeSpan.FromDays(3);
    }

    private void TriggerPersonalityRefreshInBackground(Guid userId, string language)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var worker = ActivatorUtilities.CreateInstance<AnalyzeController>(scope.ServiceProvider);
                await worker.MaybeLogPersonalityRefreshAsync(userId, language);
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.SaveChangesAsync();
            }
            catch
            {
                // Background profile refresh must never block or fail analysis.
            }
        });
    }

    private async Task SaveAnalysisRecordAsync(
        Guid emotionHistoryId,
        Guid userId,
        bool hasImage,
        bool hasText,
        string emotion,
        double confidence,
        string? imageEmotion,
        double? imageConfidence,
        string? textEmotion,
        double? textConfidence,
        bool conflictDetected,
        string language,
        JsonElement? recommendations,
        string status
    )
    {
        var personalitySnapshot = await BuildPersonalitySnapshotAsync(userId);

        _db.AnalysisRecords.Add(new AnalysisRecord
        {
            EmotionHistoryId = emotionHistoryId,
            UserId = userId,
            InputType = ResolveInputType(hasImage, hasText),
            EmotionResult = emotion,
            EmotionConfidence = confidence,
            ImageEmotion = imageEmotion,
            ImageConfidence = imageConfidence,
            TextEmotion = textEmotion,
            TextConfidence = textConfidence,
            ConflictDetected = conflictDetected,
            PersonalitySnapshot = personalitySnapshot,
            RecommendationsJson = recommendations?.GetRawText() ?? "{}",
            Language = language,
            Status = status is "partial" or "failed" ? status : "complete"
        });

    }

    private async Task<List<int>> GetRecentlyRecommendedMovieIdsAsync(Guid userId)
    {
        var since = DateTime.UtcNow.AddDays(-30);
        var recommendationPayloads = await _db.AnalysisRecords
            .AsNoTracking()
            .Where(item => item.UserId == userId && item.CreatedAt >= since)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => item.RecommendationsJson)
            .ToListAsync();

        var ids = new HashSet<int>();
        foreach (var payload in recommendationPayloads)
        {
            if (string.IsNullOrWhiteSpace(payload))
            {
                continue;
            }

            try
            {
                using var document = JsonDocument.Parse(payload);
                if (document.RootElement.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                CollectMovieIds(document.RootElement, "movies", ids);
                CollectMovieIds(document.RootElement, "films", ids);
            }
            catch (JsonException)
            {
                // Ignore malformed historical recommendation payloads.
            }
        }

        return ids.ToList();
    }

    private static void CollectMovieIds(JsonElement root, string propertyName, ISet<int> ids)
    {
        if (!root.TryGetProperty(propertyName, out var movies) || movies.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        foreach (var movie in movies.EnumerateArray())
        {
            var movieId = ExtractMovieId(movie);
            if (movieId is > 0)
            {
                ids.Add(movieId.Value);
            }
        }
    }

    private static int? ExtractMovieId(JsonElement movie)
    {
        if (movie.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        foreach (var propertyName in new[] { "tmdb_id", "tmdbId", "id" })
        {
            if (movie.TryGetProperty(propertyName, out var idProperty) &&
                idProperty.ValueKind == JsonValueKind.Number &&
                idProperty.TryGetInt32(out var id))
            {
                return id;
            }
        }

        if (movie.TryGetProperty("tmdb_url", out var urlProperty) &&
            urlProperty.ValueKind == JsonValueKind.String)
        {
            var url = urlProperty.GetString() ?? string.Empty;
            var lastSegment = url.TrimEnd('/').Split('/').LastOrDefault();
            if (int.TryParse(lastSegment, out var parsedId))
            {
                return parsedId;
            }
        }

        return null;
    }

    private static (string Status, string? PartialError, List<string> MissingRecommendations) ReadRecommendationStatus(
        JsonElement? recommendations
    )
    {
        if (recommendations is not { } value)
        {
            return ("partial", "Recommendations are unavailable.", new List<string> { "music", "films", "books" });
        }

        var status = GetOptionalString(value, "status") == "partial" ? "partial" : "complete";
        var partialError = GetOptionalString(value, "partial_error") ?? GetOptionalString(value, "partialError");
        var missing = GetOptionalStringArray(value, "missing_recommendations");
        if (missing.Count == 0)
        {
            missing = GetOptionalStringArray(value, "missingRecommendations");
        }

        if (missing.Count > 0 || !string.IsNullOrWhiteSpace(partialError))
        {
            status = "partial";
        }

        return (status, partialError, missing);
    }

    private static JsonElement BuildFallbackRecommendationsElement(
        string emotion,
        string coachAdvice,
        string language,
        string partialError,
        List<string> missingRecommendations
    )
    {
        var normalizedCoachAdvice = string.IsNullOrWhiteSpace(coachAdvice)
            ? BuildFallbackCoachAdvice(emotion, language)
            : coachAdvice;
        var payload = new
        {
            coachComment = normalizedCoachAdvice,
            music = new[]
            {
                new { title = "Mood reset playlist", artist = "MoodLens", reason = "Fallback music suggestion while Spotify is unavailable." }
            },
            movies = new[]
            {
                new { title = "A gentle feel-good film", overview = "Fallback film suggestion while TMDB is unavailable." }
            },
            books = new[]
            {
                new { title = "A short reflective read", authors = new[] { "MoodLens" }, description = "Fallback book suggestion while Google Books is unavailable." }
            },
            lifeAdvice = new[]
            {
                new { title = "Take one small step", description = "Choose one realistic action that supports your current pace.", icon = "AI" }
            },
            activities = new[]
            {
                new { title = "Take one small step", description = "Choose one realistic action that supports your current pace.", icon = "AI" }
            },
            status = "partial",
            partial_error = partialError,
            missing_recommendations = missingRecommendations
        };

        return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(payload));
    }

    private static string BuildFallbackCoachAdvice(string emotion, string language)
    {
        return language == "tr"
            ? $"Baskın duygu {emotion}. Bazı öneri kaynakları şu an ulaşılamıyor, ama sonucu küçük ve uygulanabilir bir adım seçmek için kullanabilirsin."
            : $"The dominant emotion is {emotion}. Some recommendation providers are unavailable right now, but you can still use this result to choose one small practical next step.";
    }

    private async Task<string?> BuildPersonalitySnapshotAsync(Guid userId)
    {
        var profile = await _db.UserPersonalityProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserId == userId);

        if (profile == null)
        {
            return null;
        }

        var snapshot = new Dictionary<string, object?>
        {
            ["big_five"] = DeserializeJsonOrNull(profile.BigFiveJson),
            ["mbti_type"] = profile.MbtiType,
            ["spotify_top_tracks"] = DeserializeJsonOrNull(profile.SpotifyTopTracksJson),
            ["last_updated"] = profile.LastUpdated
        };

        return JsonSerializer.Serialize(snapshot);
    }

    private async Task<bool> ShouldAskAvatarRefreshAsync(Guid userId)
    {
        var profile = await _db.UserPersonalityProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserId == userId);

        if (profile == null)
        {
            return false;
        }

        return profile.AvatarGeneratedAt == null ||
            DateTime.UtcNow - profile.AvatarGeneratedAt.Value >= TimeSpan.FromDays(7);
    }

    private async Task MaybeLogPersonalityRefreshAsync(Guid userId, string language)
    {
        var profile = await _db.UserPersonalityProfiles.FirstOrDefaultAsync(item => item.UserId == userId);
        if (profile == null)
        {
            return;
        }

        var lastUpdate = await _db.PersonalityUpdateLogs
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.UpdatedAt)
            .Select(item => (DateTime?)item.UpdatedAt)
            .FirstOrDefaultAsync();

        if (lastUpdate != null && DateTime.UtcNow - lastUpdate.Value <= TimeSpan.FromDays(3))
        {
            return;
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId);
        if (user == null)
        {
            return;
        }

        var spotifySummary = await ResolveSpotifySummaryAsync(user, profile);
        var recentContent = await BuildRecentMediaContentAsync(userId);
        if (spotifySummary == null && !HasRecentMediaContent(recentContent))
        {
            return;
        }

        try
        {
            var update = await _aiClient.UpdatePersonalityAsync(
                DeserializeJsonOrNull(profile.BigFiveJson),
                profile.LastUpdated.ToString("O"),
                spotifySummary,
                recentContent,
                language
            );

            if (GetOptionalBool(update, "updated") == false)
            {
                return;
            }

            if (update.TryGetProperty("personality", out var personality) &&
                personality.ValueKind == JsonValueKind.Object)
            {
                profile.BigFiveJson = personality.GetRawText();
                profile.MbtiType = GetOptionalString(personality, "mbti") ?? profile.MbtiType;
            }
        }
        catch (AiServiceException)
        {
            // Keep the existing profile if the scheduled behavioral refresh cannot reach Gemini.
            return;
        }
        catch (HttpRequestException)
        {
            // Recommendation analysis should not fail just because the background profile refresh is unavailable.
            return;
        }

        profile.LastUpdated = DateTime.UtcNow;
        _db.PersonalityUpdateLogs.Add(new PersonalityUpdateLog
        {
            UserId = userId,
            UpdatedAt = profile.LastUpdated,
            TriggerSource = "analysis_auto_check"
        });
    }

    private async Task<object?> ResolveSpotifySummaryAsync(User user, UserPersonalityProfile profile)
    {
        if (string.IsNullOrWhiteSpace(user.SpotifyAccessToken) ||
            user.SpotifyTokenExpiry is null ||
            user.SpotifyTokenExpiry <= DateTime.UtcNow)
        {
            return null;
        }

        var freshSummary = await FetchSpotifyTopTracksSummaryAsync(user.SpotifyAccessToken);
        if (freshSummary != null)
        {
            profile.SpotifyTopTracksJson = JsonSerializer.Serialize(freshSummary);
            return freshSummary;
        }

        return DeserializeJsonOrNull(profile.SpotifyTopTracksJson);
    }

    private async Task<object?> FetchSpotifyTopTracksSummaryAsync(string accessToken)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10"
            );
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var items = document.RootElement.TryGetProperty("items", out var itemsProperty) &&
                        itemsProperty.ValueKind == JsonValueKind.Array
                ? itemsProperty.EnumerateArray().ToList()
                : new List<JsonElement>();

            var artistIds = items
                .SelectMany(item => item.TryGetProperty("artists", out var artists) && artists.ValueKind == JsonValueKind.Array
                    ? artists.EnumerateArray()
                    : Enumerable.Empty<JsonElement>())
                .Select(artist => GetOptionalString(artist, "id"))
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .Distinct()
                .Take(50)
                .ToList();
            var trackIds = items
                .Select(item => GetOptionalString(item, "id"))
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .ToList();

            var genres = await FetchSpotifyArtistGenresAsync(accessToken, artistIds);
            var audioFeatures = await FetchSpotifyAudioFeaturesAsync(accessToken, trackIds);
            var tracks = items.Select(item => new
            {
                id = GetOptionalString(item, "id"),
                title = GetOptionalString(item, "name"),
                popularity = GetOptionalDouble(item, "popularity"),
                artists = item.TryGetProperty("artists", out var artists) && artists.ValueKind == JsonValueKind.Array
                    ? artists.EnumerateArray().Select(artist => GetOptionalString(artist, "name")).Where(name => !string.IsNullOrWhiteSpace(name)).ToList()
                    : new List<string?>()
            }).ToList();

            return new
            {
                connected = true,
                fetchedAt = DateTime.UtcNow,
                tracks,
                genres,
                audioFeatures
            };
        }
        catch
        {
            return null;
        }
    }

    private async Task<List<string>> FetchSpotifyArtistGenresAsync(string accessToken, List<string> artistIds)
    {
        if (artistIds.Count == 0)
        {
            return new List<string>();
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"https://api.spotify.com/v1/artists?ids={Uri.EscapeDataString(string.Join(",", artistIds))}"
            );
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return new List<string>();
            }

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            return document.RootElement.TryGetProperty("artists", out var artists) &&
                   artists.ValueKind == JsonValueKind.Array
                ? artists.EnumerateArray()
                    .SelectMany(artist => artist.TryGetProperty("genres", out var genres) && genres.ValueKind == JsonValueKind.Array
                        ? genres.EnumerateArray()
                        : Enumerable.Empty<JsonElement>())
                    .Select(genre => genre.GetString())
                    .Where(genre => !string.IsNullOrWhiteSpace(genre))
                    .Select(genre => genre!)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Take(20)
                    .ToList()
                : new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private async Task<object?> FetchSpotifyAudioFeaturesAsync(string accessToken, List<string> trackIds)
    {
        if (trackIds.Count == 0)
        {
            return null;
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"https://api.spotify.com/v1/audio-features?ids={Uri.EscapeDataString(string.Join(",", trackIds.Take(100)))}"
            );
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var features = document.RootElement.TryGetProperty("audio_features", out var audioFeatures) &&
                           audioFeatures.ValueKind == JsonValueKind.Array
                ? audioFeatures.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.Object).ToList()
                : new List<JsonElement>();
            if (features.Count == 0)
            {
                return null;
            }

            return new
            {
                valence = AverageFeature(features, "valence"),
                energy = AverageFeature(features, "energy"),
                tempo = AverageFeature(features, "tempo")
            };
        }
        catch
        {
            return null;
        }
    }

    private async Task<Dictionary<string, object?>> BuildRecentMediaContentAsync(Guid userId)
    {
        var latestLogs = await _db.UserMediaLogs
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.LoggedAt)
            .Take(20)
            .ToListAsync();
        var latestFilm = latestLogs.FirstOrDefault(item => item.Type == "film");
        var latestBook = latestLogs.FirstOrDefault(item => item.Type == "book");

        return new Dictionary<string, object?>
        {
            ["film"] = latestFilm == null ? null : new { latestFilm.Title, latestFilm.Note, latestFilm.LoggedAt },
            ["book"] = latestBook == null ? null : new { latestBook.Title, latestBook.Note, latestBook.LoggedAt }
        };
    }

    private static bool HasRecentMediaContent(Dictionary<string, object?> recentContent)
    {
        return recentContent.Values.Any(value => value != null);
    }

    private static double? AverageFeature(List<JsonElement> features, string propertyName)
    {
        var values = features
            .Select(item => GetOptionalDouble(item, propertyName))
            .Where(value => value != null)
            .Select(value => value!.Value)
            .ToList();

        return values.Count == 0 ? null : values.Average();
    }

    private static object? DeserializeJsonOrNull(string? rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(rawJson);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static object GetRecommendationCategory(JsonElement? recommendations, string category)
    {
        if (recommendations is not { } value ||
            !value.TryGetProperty(category, out var categoryData))
        {
            return Array.Empty<object>();
        }

        return JsonSerializer.Deserialize<object>(categoryData.GetRawText()) ?? Array.Empty<object>();
    }

    private static object GetRecommendationDataSources(JsonElement? recommendations)
    {
        if (recommendations is not { } value ||
            !value.TryGetProperty("data_sources", out var dataSources) ||
            dataSources.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            return new
            {
                music = "demo",
                films = "demo",
                books = "demo"
            };
        }

        return JsonSerializer.Deserialize<object>(dataSources.GetRawText()) ?? new
        {
            music = "demo",
            films = "demo",
            books = "demo"
        };
    }

    private static string? NormalizePersonalityJson(string? rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return null;
        }

        var trimmed = rawJson.Trim();
        try
        {
            using var document = JsonDocument.Parse(trimmed);
            return document.RootElement.GetRawText();
        }
        catch (JsonException)
        {
            return trimmed;
        }
    }

    private static bool IsUnsupportedHeicMimeType(string? mimeType)
    {
        var normalized = mimeType?.Trim().ToLowerInvariant();
        return normalized is "image/heic" or "image/heif";
    }

    private static bool TryNormalizeMimeType(string? mimeType, out string normalizedMimeType)
    {
        normalizedMimeType = "image/jpeg";

        if (string.IsNullOrWhiteSpace(mimeType))
        {
            return true;
        }

        normalizedMimeType = mimeType.Trim().ToLowerInvariant() switch
        {
            "image/jpeg" => "image/jpeg",
            "image/jpg" => "image/jpeg",
            "image/png" => "image/png",
            "image/webp" => "image/webp",
            _ => string.Empty
        };

        return !string.IsNullOrEmpty(normalizedMimeType);
    }

    private static string GetImageExtension(string? mimeType)
    {
        return mimeType switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg"
        };
    }

    private string GetPreferredLanguage()
    {
        if (Request.Headers.TryGetValue("X-MoodLens-Language", out var explicitLanguage))
        {
            var normalized = explicitLanguage.ToString().Trim().ToLowerInvariant();
            if (normalized.StartsWith("tr"))
            {
                return "tr";
            }
        }

        if (Request.Headers.TryGetValue("Accept-Language", out var acceptLanguage))
        {
            var normalized = acceptLanguage.ToString().Trim().ToLowerInvariant();
            if (normalized.StartsWith("tr"))
            {
                return "tr";
            }
        }

        return "en";
    }

    private static string ResolveModalityUsed(bool hasImage, bool hasText)
    {
        if (hasImage && hasText)
        {
            return "multimodal";
        }

        if (hasImage)
        {
            return "image";
        }

        return "text";
    }

    private static string ResolveInputType(bool hasImage, bool hasText)
    {
        if (hasImage && hasText)
        {
            return "both";
        }

        return hasImage ? "image" : "text";
    }

    private static string ResolveModelUsed(bool hasImage, bool hasText)
    {
        if (hasImage && hasText)
        {
            return "local-face-model + gemini-text";
        }

        if (hasImage)
        {
            return "local-face-model";
        }

        return "gemini-text";
    }

    private static bool IsImageContractErrorCode(string? code)
    {
        return code is
            "UNSUPPORTED_IMAGE_TYPE" or
            "INVALID_IMAGE" or
            "IMAGE_TOO_LARGE" or
            "NO_FACE_DETECTED" or
            "MULTIPLE_FACES_DETECTED" or
            "FACE_TOO_SMALL" or
            "FACE_MODEL_UNAVAILABLE";
    }

    private static string BuildAnalysisContext(
        string text,
        string modalityUsed,
        string language,
        string? faceEmotion,
        string? textEmotion
    )
    {
        if (modalityUsed == "text")
        {
            return text;
        }

        if (modalityUsed == "image")
        {
            if (language == "tr")
            {
                return $"Görsel odaklı analiz. Yerel yüz modeli tarafından tespit edilen duygu: {faceEmotion ?? "calm"}.";
            }

            return $"Image-first analysis. Local face model emotion: {faceEmotion ?? "calm"}.";
        }

        var normalizedText = string.IsNullOrWhiteSpace(text) ? (language == "tr" ? "Metin girilmedi." : "No text provided.") : text;
        if (language == "tr")
        {
            return $"{normalizedText}\nYerel yüz sinyali: {faceEmotion ?? "calm"}\nMetin sinyali: {textEmotion ?? "calm"}";
        }

        return $"{normalizedText}\nLocal facial signal: {faceEmotion ?? "calm"}\nText signal: {textEmotion ?? "calm"}";
    }

    private static bool HasValue(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) &&
               property.ValueKind == JsonValueKind.String &&
               !string.IsNullOrWhiteSpace(property.GetString());
    }

    private static string? GetOptionalString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) &&
               property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static double? GetOptionalDouble(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) &&
               property.ValueKind == JsonValueKind.Number &&
               property.TryGetDouble(out var value)
            ? value
            : null;
    }

    private static List<string> GetOptionalStringArray(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var property) ||
            property.ValueKind != JsonValueKind.Array)
        {
            return new List<string>();
        }

        return property.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => item.GetString())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool? GetOptionalBool(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property) &&
               (property.ValueKind == JsonValueKind.True || property.ValueKind == JsonValueKind.False)
            ? property.GetBoolean()
            : null;
    }

    private static string AppendWarning(string? currentWarning, string nextWarning)
    {
        if (string.IsNullOrWhiteSpace(currentWarning))
        {
            return nextWarning;
        }

        return $"{currentWarning} {nextWarning}";
    }


    private static string? ResolveActorKey(Guid? userId, string? guestSessionId)
    {
        if (userId is { } authenticatedUserId)
        {
            return $"user:{authenticatedUserId}";
        }

        if (!string.IsNullOrWhiteSpace(guestSessionId))
        {
            return $"guest:{guestSessionId}";
        }

        return null;
    }

    private static string BuildCooldownMessage(string language, int retryAfterSeconds)
    {
        var normalizedSeconds = Math.Max(1, retryAfterSeconds);
        if (language == "tr")
        {
            return $"Çakışan selfie ve metin girdisi nedeniyle analiz geçici olarak kilitlendi. Lütfen {normalizedSeconds} saniye sonra tekrar dene.";
        }

        return $"Analysis is temporarily locked because the selfie and text stayed contradictory. Please try again in {normalizedSeconds} seconds.";
    }

    private static string BuildTextValidationCooldownMessage(string language, int retryAfterSeconds)
    {
        var normalizedSeconds = Math.Max(1, retryAfterSeconds);
        if (language == "tr")
        {
            return $"Metin arka arkaya duygu analizi için yeterince anlamlı bulunmadı. Lütfen {normalizedSeconds} saniye sonra ne yaşadığını veya nasıl hissettiğini daha net yazarak tekrar dene.";
        }

        return $"The text was not clear enough for emotion analysis after repeated checks. Please try again in {normalizedSeconds} seconds with a clearer description of what happened or how you feel.";
    }

    private static string BuildGuestQuotaMessage(string language)
    {
        if (language == "tr")
        {
            return "Bu tarayıcı oturumunda 3 ücretsiz analiz hakkını kullandın. Devam etmek için hesap oluşturabilirsin.";
        }

        return "You have used your 3 free analyses for this browser session. Please create an account to continue.";
    }

    private static string BuildInputRequiredMessage(string language)
    {
        if (language == "tr")
        {
            return "Analize başlamak için metin, selfie ya da ikisinden birini ekle.";
        }

        return "At least one input is required. Provide a selfie, text, or both.";
    }

    private static string BuildUnsupportedImageTypeMessage(string language)
    {
        if (language == "tr")
        {
            return "Bu dosya formatı desteklenmiyor. Lütfen JPG, PNG veya WebP formatında bir fotoğraf yükle.";
        }

        return "Unsupported image format. Supported formats are JPEG, JPG, PNG, and WebP.";
    }

    private static string BuildInvalidTextLengthMessage(string language)
    {
        if (language == "tr")
        {
            return "Metin 10 ile 1000 karakter arasında olmalı.";
        }

        return "Text input must be between 10 and 1000 characters.";
    }

    private static string BuildAiUnavailableMessage(string language)
    {
        if (language == "tr")
        {
            return "AI servisine şu an ulaşılamıyor. Lütfen biraz sonra tekrar dene.";
        }

        return "AI service is unavailable. Please try again later.";
    }

    private static string BuildUnexpectedAnalysisErrorMessage(string language)
    {
        if (language == "tr")
        {
            return "Analiz sırasında beklenmeyen bir sorun oluştu. Lütfen tekrar dene.";
        }

        return "An error occurred during analysis.";
    }

    private static string ResolveAnalysisKeyEnv(bool hasImage, bool hasText, int attemptIndex)
    {
        if (!hasText)
        {
            return "GEMINI_KEY_TEXT_EMOTION";
        }

        return attemptIndex switch
        {
            1 => "GEMINI_KEY_CONFLICT_2",
            2 => "GEMINI_KEY_CONFLICT_3",
            _ => "GEMINI_KEY_CONFLICT_1"
        };
    }

    private static (string Title, string Message, string Hint) BuildTextValidationAlert(
        string language,
        int attemptIndex,
        string? validationMessage
    )
    {
        if (language == "tr")
        {
            var message = string.IsNullOrWhiteSpace(validationMessage)
                ? "Metin duygu analizi için yeterince anlamlı görünmüyor. Lütfen ne yaşadığını ya da nasıl hissettiğini birkaç net cümleyle yaz."
                : validationMessage;

            if (attemptIndex >= 1)
            {
                return (
                    "Metin hâlâ net değil",
                    message,
                    "Bir sonraki denemede metni son kez farklı bir analiz anahtarıyla denetleyeceğiz."
                );
            }

            return (
                "Metin net değil",
                message,
                "Metni biraz daha açıklayıp tekrar dene; sistemi farklı bir analiz anahtarıyla yeniden denetleyeceğiz."
            );
        }

        var englishMessage = string.IsNullOrWhiteSpace(validationMessage)
            ? "The text does not look clear enough for emotion analysis. Please write a few meaningful words about what happened or how you feel."
            : validationMessage;

        if (attemptIndex >= 1)
        {
            return (
                "Text is still unclear",
                englishMessage,
                "Your next retry will run the final text validation check with another analysis key."
            );
        }

        return (
            "Text is unclear",
            englishMessage,
            "Add a little more detail and retry; we will re-check it with another analysis key."
        );
    }

    private static (string Title, string Message, string Hint) BuildContradictionAlert(
        string language,
        int attemptIndex,
        string? clarificationMessage
    )
    {
        if (language == "tr")
        {
            if (attemptIndex >= 1)
            {
                return (
                    "Zıt duygu tespiti sürüyor",
                    string.IsNullOrWhiteSpace(clarificationMessage)
                        ? "Selfie ve metin hala birbirine ters görünüyor. Duygu durumundan eminsen bir kez daha dene; son kontrolü farklı bir analiz anahtarıyla yapacağız."
                        : clarificationMessage,
                    "Bir sonraki denemede sistemi son kez farklı bir analiz anahtarıyla yeniden kontrol edeceğiz."
                );
            }

            return (
                "Zıt duygu tespiti",
                string.IsNullOrWhiteSpace(clarificationMessage)
                    ? "Selfie ve metin birbirine zıt görünüyor. Duygu durumundan emin misin?"
                    : clarificationMessage,
                "İstersen tekrar dene; sistemi farklı bir analiz anahtarıyla yeniden kontrol edeceğiz."
            );
        }

        if (attemptIndex >= 1)
        {
            return (
                "Contradictory emotion still detected",
                string.IsNullOrWhiteSpace(clarificationMessage)
                    ? "Your selfie and text still point to opposite emotions. If you are sure, try once more and we will run a final verification with another analysis key."
                    : clarificationMessage,
                "Your next retry will trigger the final contradiction check."
            );
        }

        return (
            "Contradictory emotion detected",
            string.IsNullOrWhiteSpace(clarificationMessage)
                ? "Your selfie and text look emotionally opposite. Are you sure this matches how you feel?"
                : clarificationMessage,
            "If you retry, we will re-check the result with another analysis key."
        );
    }

    private GuestSessionState ResolveGuestSessionState(string? bodyGuestSessionId)
    {
        var cookieState = ReadGuestSessionStateCookie();
        var candidate = bodyGuestSessionId;

        if (string.IsNullOrWhiteSpace(candidate) &&
            Request.Headers.TryGetValue("X-Guest-Session-Id", out var headerGuestSessionId))
        {
            candidate = headerGuestSessionId.ToString();
        }

        if (string.IsNullOrWhiteSpace(candidate))
        {
            candidate = cookieState?.SessionId;
        }

        var sessionId = string.IsNullOrWhiteSpace(candidate)
            ? Guid.NewGuid().ToString("N")
            : candidate.Trim();
        var count = cookieState != null && string.Equals(cookieState.SessionId, sessionId, StringComparison.Ordinal)
            ? Math.Clamp(cookieState.CompletedAnalyses, 0, GuestAnalysisLimit)
            : 0;
        var surveyCompleted = cookieState != null &&
            string.Equals(cookieState.SessionId, sessionId, StringComparison.Ordinal) &&
            cookieState.SurveyCompleted;
        var personalityJson = cookieState != null &&
            string.Equals(cookieState.SessionId, sessionId, StringComparison.Ordinal)
            ? cookieState.PersonalityJson
            : null;
        var ageGroup = cookieState != null &&
            string.Equals(cookieState.SessionId, sessionId, StringComparison.Ordinal)
            ? cookieState.AgeGroup
            : null;
        var state = new GuestSessionState(sessionId, count, surveyCompleted, personalityJson, ageGroup);
        WriteGuestSessionStateCookie(state);
        return state;
    }

    private GuestSessionState MarkGuestSurveyCompleted(GuestSessionState state)
    {
        if (state.SurveyCompleted)
        {
            return state;
        }

        var updated = state with { SurveyCompleted = true };
        WriteGuestSessionStateCookie(updated);
        return updated;
    }

    private int RegisterGuestCompletedAnalysis(GuestSessionState? state)
    {
        var current = state ?? ResolveGuestSessionState(null);
        var completed = Math.Clamp(current.CompletedAnalyses + 1, 0, GuestAnalysisLimit);
        WriteGuestSessionStateCookie(current with { CompletedAnalyses = completed });
        return completed;
    }

    private GuestSessionState? ReadGuestSessionStateCookie()
    {
        if (!Request.Cookies.TryGetValue(GuestSessionCookieName, out var rawCookie) ||
            string.IsNullOrWhiteSpace(rawCookie))
        {
            return null;
        }

        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(rawCookie));
            return JsonSerializer.Deserialize<GuestSessionState>(json);
        }
        catch (Exception)
        {
            return null;
        }
    }

    private void WriteGuestSessionStateCookie(GuestSessionState state)
    {
        var json = JsonSerializer.Serialize(state);
        var value = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
        Response.Cookies.Append(
            GuestSessionCookieName,
            value,
            new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps
            }
        );
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private sealed record GuestSessionState(
        string SessionId,
        int CompletedAnalyses,
        bool SurveyCompleted = false,
        string? PersonalityJson = null,
        string? AgeGroup = null
    );
}
