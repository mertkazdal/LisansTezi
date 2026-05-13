using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;

namespace MoodLens.ApiGateway.Services;

public sealed record NormalizedRecommendationSurvey(
    string RecommendationGoal,
    string EnergyPreference,
    IReadOnlyList<string> MusicGenres,
    IReadOnlyList<string> MovieGenres,
    IReadOnlyList<string> BookGenres
);

public static class RecommendationSurveyService
{
    private static readonly HashSet<string> AllowedRecommendationGoals = new(StringComparer.OrdinalIgnoreCase)
    {
        "comfort",
        "focus",
        "energy",
        "discovery"
    };

    private static readonly HashSet<string> AllowedEnergyPreferences = new(StringComparer.OrdinalIgnoreCase)
    {
        "soft",
        "balanced",
        "high"
    };

    private static readonly HashSet<string> AllowedMusicGenres = new(StringComparer.OrdinalIgnoreCase)
    {
        "acoustic",
        "pop",
        "indie",
        "electronic",
        "rap",
        "classical"
    };

    private static readonly HashSet<string> AllowedMovieGenres = new(StringComparer.OrdinalIgnoreCase)
    {
        "comedy",
        "drama",
        "adventure",
        "science_fiction",
        "documentary",
        "romance"
    };

    private static readonly HashSet<string> AllowedBookGenres = new(StringComparer.OrdinalIgnoreCase)
    {
        "self_growth",
        "fiction",
        "psychology",
        "memoir",
        "poetry",
        "philosophy"
    };

    private static readonly Dictionary<string, string> GoalQueryTerms = new(StringComparer.OrdinalIgnoreCase)
    {
        ["comfort"] = "comfort grounding ease",
        ["focus"] = "focus clarity concentration",
        ["energy"] = "energy motivation momentum",
        ["discovery"] = "discovery novelty exploration"
    };

    private static readonly Dictionary<string, string> EnergyQueryTerms = new(StringComparer.OrdinalIgnoreCase)
    {
        ["soft"] = "soft calm gentle",
        ["balanced"] = "balanced steady measured",
        ["high"] = "high energy dynamic upbeat"
    };

    private static readonly Dictionary<string, string> MusicQueryTerms = new(StringComparer.OrdinalIgnoreCase)
    {
        ["acoustic"] = "acoustic",
        ["pop"] = "pop",
        ["indie"] = "indie",
        ["electronic"] = "electronic",
        ["rap"] = "rap",
        ["classical"] = "classical"
    };

    private static readonly Dictionary<string, string> MovieQueryTerms = new(StringComparer.OrdinalIgnoreCase)
    {
        ["comedy"] = "comedy",
        ["drama"] = "drama",
        ["adventure"] = "adventure",
        ["science_fiction"] = "science fiction",
        ["documentary"] = "documentary",
        ["romance"] = "romance"
    };

    private static readonly Dictionary<string, string> BookQueryTerms = new(StringComparer.OrdinalIgnoreCase)
    {
        ["self_growth"] = "self growth",
        ["fiction"] = "fiction",
        ["psychology"] = "psychology",
        ["memoir"] = "memoir",
        ["poetry"] = "poetry",
        ["philosophy"] = "philosophy"
    };

    public static bool TryNormalize(
        RecommendationSurveyRequest? request,
        out NormalizedRecommendationSurvey? survey,
        out string code,
        out string message)
    {
        survey = null;
        code = "SURVEY_REQUIRED";
        message = "Please complete the recommendation survey to create an account.";

        if (request == null)
        {
            return false;
        }

        if (!TryNormalizeSingle(
                request.RecommendationGoal,
                AllowedRecommendationGoals,
                out var recommendationGoal))
        {
            code = "INVALID_RECOMMENDATION_GOAL";
            message = "Choose one recommendation goal in the survey.";
            return false;
        }

        if (!TryNormalizeSingle(
                request.EnergyPreference,
                AllowedEnergyPreferences,
                out var energyPreference))
        {
            code = "INVALID_ENERGY_PREFERENCE";
            message = "Choose one energy preference in the survey.";
            return false;
        }

        var musicGenres = NormalizeSelections(request.MusicGenres, AllowedMusicGenres, maxCount: 3);
        if (musicGenres.Count == 0)
        {
            code = "INVALID_MUSIC_GENRES";
            message = "Select at least one music preference in the survey.";
            return false;
        }

        var movieGenres = NormalizeSelections(request.MovieGenres, AllowedMovieGenres, maxCount: 3);
        if (movieGenres.Count == 0)
        {
            code = "INVALID_MOVIE_GENRES";
            message = "Select at least one film preference in the survey.";
            return false;
        }

        var bookGenres = NormalizeSelections(request.BookGenres, AllowedBookGenres, maxCount: 3);
        if (bookGenres.Count == 0)
        {
            code = "INVALID_BOOK_GENRES";
            message = "Select at least one book preference in the survey.";
            return false;
        }

        survey = new NormalizedRecommendationSurvey(
            recommendationGoal,
            energyPreference,
            musicGenres,
            movieGenres,
            bookGenres);

        return true;
    }

    public static RecommendationSurveyResponse? ToResponse(User? user)
    {
        if (user == null || !HasCompletedSurvey(user))
        {
            return null;
        }

        return new RecommendationSurveyResponse
        {
            RecommendationGoal = user.RecommendationGoal ?? string.Empty,
            EnergyPreference = user.EnergyPreference ?? string.Empty,
            MusicGenres = SplitSelections(user.FavoriteMusicGenres),
            MovieGenres = SplitSelections(user.FavoriteMovieGenres),
            BookGenres = SplitSelections(user.FavoriteBookGenres)
        };
    }

    public static string BuildRecommendationContext(string? analysisContext, User? user)
    {
        var trimmedContext = (analysisContext ?? string.Empty).Trim();
        if (user == null || !HasCompletedSurvey(user))
        {
            return trimmedContext;
        }

        var survey = new NormalizedRecommendationSurvey(
            user.RecommendationGoal ?? string.Empty,
            user.EnergyPreference ?? string.Empty,
            SplitSelections(user.FavoriteMusicGenres),
            SplitSelections(user.FavoriteMovieGenres),
            SplitSelections(user.FavoriteBookGenres));

        return BuildRecommendationContextFromSurvey(trimmedContext, survey);
    }

    public static string BuildRecommendationContext(string? analysisContext, NormalizedRecommendationSurvey? survey)
    {
        var trimmedContext = (analysisContext ?? string.Empty).Trim();
        return survey == null ? trimmedContext : BuildRecommendationContextFromSurvey(trimmedContext, survey);
    }

    private static string BuildRecommendationContextFromSurvey(string trimmedContext, NormalizedRecommendationSurvey survey)
    {
        var preferenceSegments = new List<string>
        {
            $"recommendation goal {MapTerm(GoalQueryTerms, survey.RecommendationGoal)}",
            $"energy preference {MapTerm(EnergyQueryTerms, survey.EnergyPreference)}"
        };

        AppendSegment(preferenceSegments, "music genres", survey.MusicGenres, MusicQueryTerms);
        AppendSegment(preferenceSegments, "movie genres", survey.MovieGenres, MovieQueryTerms);
        AppendSegment(preferenceSegments, "book genres", survey.BookGenres, BookQueryTerms);

        var surveyContext = $"Preference profile: {string.Join(". ", preferenceSegments)}.";
        if (string.IsNullOrWhiteSpace(trimmedContext))
        {
            return surveyContext;
        }

        return $"{trimmedContext}\n{surveyContext}";
    }

    public static void ApplyToUser(User user, NormalizedRecommendationSurvey survey)
    {
        user.RecommendationGoal = survey.RecommendationGoal;
        user.EnergyPreference = survey.EnergyPreference;
        user.FavoriteMusicGenres = SerializeSelections(survey.MusicGenres);
        user.FavoriteMovieGenres = SerializeSelections(survey.MovieGenres);
        user.FavoriteBookGenres = SerializeSelections(survey.BookGenres);
    }

    public static bool HasCompletedSurvey(User? user)
    {
        return user != null &&
               !string.IsNullOrWhiteSpace(user.RecommendationGoal) &&
               !string.IsNullOrWhiteSpace(user.EnergyPreference) &&
               !string.IsNullOrWhiteSpace(user.FavoriteMusicGenres) &&
               !string.IsNullOrWhiteSpace(user.FavoriteMovieGenres) &&
               !string.IsNullOrWhiteSpace(user.FavoriteBookGenres);
    }

    private static bool TryNormalizeSingle(string? value, HashSet<string> allowed, out string normalized)
    {
        normalized = string.Empty;
        var candidate = (value ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(candidate) || !allowed.Contains(candidate))
        {
            return false;
        }

        normalized = candidate;
        return true;
    }

    private static List<string> NormalizeSelections(IEnumerable<string>? values, HashSet<string> allowed, int maxCount)
    {
        var normalized = new List<string>();
        if (values == null)
        {
            return normalized;
        }

        foreach (var value in values)
        {
            var candidate = (value ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(candidate) || !allowed.Contains(candidate) || normalized.Contains(candidate))
            {
                continue;
            }

            normalized.Add(candidate);
            if (normalized.Count >= maxCount)
            {
                break;
            }
        }

        return normalized;
    }

    private static string SerializeSelections(IEnumerable<string> selections)
    {
        return string.Join(",", selections);
    }

    private static List<string> SplitSelections(string? selections)
    {
        return (selections ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => item.Trim().ToLowerInvariant())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string MapTerm(IReadOnlyDictionary<string, string> map, string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return "balanced";
        }

        return map.TryGetValue(key, out var value) ? value : key;
    }

    private static void AppendSegment(
        ICollection<string> segments,
        string label,
        IReadOnlyCollection<string> keys,
        IReadOnlyDictionary<string, string> map)
    {
        if (keys.Count == 0)
        {
            return;
        }

        var mapped = keys.Select(key => MapTerm(map, key)).ToList();
        segments.Add($"{label} {string.Join(", ", mapped)}");
    }
}
