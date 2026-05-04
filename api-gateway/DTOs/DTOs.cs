namespace MoodLens.ApiGateway.DTOs;

// --- Auth DTOs ---
public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? GuestSessionId { get; set; }
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
}

// --- Analyze DTOs ---
public class AnalyzeRequest
{
    public string? ImageBase64 { get; set; }
    public string? Text { get; set; }
    public string? MimeType { get; set; }
    public string? GuestSessionId { get; set; }
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
}

public class DeleteAccountRequest
{
    public string ConfirmationText { get; set; } = string.Empty;
}
