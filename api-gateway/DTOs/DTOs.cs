namespace MoodLens.ApiGateway.DTOs;

// --- Auth DTOs ---
public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? GuestSessionId { get; set; }
    public RecommendationSurveyRequest? RecommendationSurvey { get; set; }
}

public class RecommendationSurveyRequest
{
    public string RecommendationGoal { get; set; } = string.Empty;
    public string EnergyPreference { get; set; } = string.Empty;
    public List<string> MusicGenres { get; set; } = new();
    public List<string> MovieGenres { get; set; } = new();
    public List<string> BookGenres { get; set; } = new();
}

public class RecommendationSurveyResponse
{
    public string RecommendationGoal { get; set; } = string.Empty;
    public string EnergyPreference { get; set; } = string.Empty;
    public List<string> MusicGenres { get; set; } = new();
    public List<string> MovieGenres { get; set; } = new();
    public List<string> BookGenres { get; set; } = new();
}

public class PersonalitySurveySubmitRequest
{
    public Dictionary<int, int> Answers { get; set; } = new();
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? GuestSessionId { get; set; }
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string Role { get; set; } = "user";
    public bool IsAdmin { get; set; }
    public bool GuestDataMerged { get; set; }
    public int MigratedGuestAnalysesCount { get; set; }
    public RecommendationSurveyResponse? RecommendationSurvey { get; set; }
    public string PreferredColorTheme { get; set; } = "kirmizi";
}

// --- Analyze DTOs ---
public class AnalyzeRequest
{
    public string? ImageBase64 { get; set; }
    public string? Text { get; set; }
    public string? MimeType { get; set; }
    public string? GuestSessionId { get; set; }
    public RecommendationSurveyRequest? RecommendationSurvey { get; set; }
}

public class AnalyzeResponse
{
    public Guid? HistoryId { get; set; }
    public string Emotion { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public bool NeedsReason { get; set; }
    public bool ReasonProvided { get; set; } = true;
    public string? FollowUpQuestion { get; set; }
    public string ModalityUsed { get; set; } = "multimodal";
    public string ModelUsed { get; set; } = "gemini-multimodal";
    public int? ResponseTimeMs { get; set; }
    public bool FaceDetected { get; set; }
    public int? GuestRemainingAnalyses { get; set; }
    public string? Warning { get; set; }
    public bool AskAvatarRefresh { get; set; }
}

// --- Recommendation DTOs ---
public class RecommendationResponse
{
    public List<object> Music { get; set; } = new();
    public List<object> Movies { get; set; } = new();
    public List<object> Books { get; set; } = new();
    public List<object> LifeAdvice { get; set; } = new();
}

public class FeedbackRequest
{
    public int OverallRating { get; set; }
    public int AnalysisAccuracyRating { get; set; }
    public int RecommendationQualityRating { get; set; }
    public bool Helpful { get; set; }
    public bool WouldReuse { get; set; }
    public string? Comment { get; set; }
}

public class FeedbackResponse
{
    public Guid Id { get; set; }
    public Guid HistoryId { get; set; }
    public int OverallRating { get; set; }
    public int AnalysisAccuracyRating { get; set; }
    public int RecommendationQualityRating { get; set; }
    public bool Helpful { get; set; }
    public bool WouldReuse { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

// --- History DTOs ---
public class HistoryItemResponse
{
    public Guid Id { get; set; }
    public string DetectedEmotion { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string? Explanation { get; set; }
    public string? UserText { get; set; }
    public DateTime CreatedAt { get; set; }
    public string ModalityUsed { get; set; } = "multimodal";
    public string ModelUsed { get; set; } = "gemini-multimodal";
    public int? ResponseTimeMs { get; set; }
    public bool FaceDetected { get; set; }
}

public class AnalysisRecordResponse
{
    public Guid Id { get; set; }
    public string Status { get; set; } = "complete";
    public string InputType { get; set; } = "text";
    public string EmotionResult { get; set; } = string.Empty;
    public double EmotionConfidence { get; set; }
    public string? ImageEmotion { get; set; }
    public double? ImageConfidence { get; set; }
    public string? TextEmotion { get; set; }
    public double? TextConfidence { get; set; }
    public bool ConflictDetected { get; set; }
    public object? Recommendations { get; set; }
    public string Language { get; set; } = "tr";
    public DateTime CreatedAt { get; set; }
}

public class MediaLogRequest
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Note { get; set; }
}

// --- User Profile DTOs ---
public class UserProfileResponse
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalAnalyses { get; set; }
    public string? MostFrequentEmotion { get; set; }
    public string Role { get; set; } = "user";
    public bool IsAdmin { get; set; }
    public bool CanDeleteAccount { get; set; } = true;
    public string DeleteConfirmationText { get; set; } = "DELETE";
    public RecommendationSurveyResponse? RecommendationSurvey { get; set; }
    public string PreferredColorTheme { get; set; } = "kirmizi";
}

public class DeleteAccountRequest
{
    public string ConfirmationText { get; set; } = string.Empty;
}

public class UpdateColorThemeRequest
{
    public string ColorTheme { get; set; } = string.Empty;
}
