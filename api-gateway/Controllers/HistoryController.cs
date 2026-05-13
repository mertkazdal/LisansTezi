using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/history")]
[Authorize]
public class HistoryController : ControllerBase
{
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly AppDbContext _db;

    public HistoryController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int page = DefaultPage,
        [FromQuery] int limit = DefaultPageSize,
        [FromQuery] string? emotion = null)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (page < 1)
        {
            return BadRequest(new { message = "Page must be at least 1." });
        }

        if (limit < 1 || limit > MaxPageSize)
        {
            return BadRequest(new { message = $"Limit must be between 1 and {MaxPageSize}." });
        }

        var query = _db.EmotionHistories
            .Where(h => h.UserId == userId.Value);
        var emotionFilter = NormalizeEmotionFilter(emotion);
        if (emotionFilter != null)
        {
            query = query.Where(h => h.DetectedEmotion == emotionFilter);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(h => h.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(h => new HistoryItemResponse
            {
                Id = h.Id,
                DetectedEmotion = h.DetectedEmotion,
                Confidence = h.Confidence,
                Explanation = h.Explanation,
                UserText = h.UserText,
                CreatedAt = h.CreatedAt,
                ModalityUsed = h.ModalityUsed,
                ModelUsed = h.ModelUsed,
                ResponseTimeMs = h.ResponseTimeMs,
                FaceDetected = h.FaceDetected
            })
            .ToListAsync();

        var analysisRecordsQuery = _db.AnalysisRecords
            .Where(record => record.UserId == userId.Value);
        if (emotionFilter != null)
        {
            analysisRecordsQuery = analysisRecordsQuery.Where(record => record.EmotionResult == emotionFilter);
        }

        var analysisRecords = await analysisRecordsQuery
            .OrderByDescending(record => record.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(record => new AnalysisRecordResponse
            {
                Id = record.Id,
                Status = record.Status,
                InputType = record.InputType,
                EmotionResult = record.EmotionResult,
                EmotionConfidence = record.EmotionConfidence,
                ImageEmotion = record.ImageEmotion,
                ImageConfidence = record.ImageConfidence,
                TextEmotion = record.TextEmotion,
                TextConfidence = record.TextConfidence,
                ConflictDetected = record.ConflictDetected,
                Language = record.Language,
                CreatedAt = record.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            items,
            analysisRecords,
            total,
            page,
            limit,
            totalPages = total == 0 ? 0 : (int)Math.Ceiling((double)total / limit)
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetHistoryItem(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var record = await _db.AnalysisRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId.Value);

        if (record != null)
        {
            return Ok(ToAnalysisRecordResponse(record));
        }

        var item = await _db.EmotionHistories
            .FirstOrDefaultAsync(h => h.Id == id && h.UserId == userId.Value);

        if (item == null) return NotFound(new { message = "History item not found." });

        return Ok(new HistoryItemResponse
        {
            Id = item.Id,
            DetectedEmotion = item.DetectedEmotion,
            Confidence = item.Confidence,
            Explanation = item.Explanation,
            UserText = item.UserText,
            CreatedAt = item.CreatedAt,
            ModalityUsed = item.ModalityUsed,
            ModelUsed = item.ModelUsed,
            ResponseTimeMs = item.ResponseTimeMs,
            FaceDetected = item.FaceDetected
        });
    }

    [HttpGet("{id}/report")]
    public async Task<IActionResult> GetReport(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var record = await FindOwnedRecordOrCreateFromHistoryAsync(id, userId.Value);
        if (record == null) return NotFound(new { message = "History item not found." });

        var pdfBytes = BuildSimplePdf(BuildReportLines(record));
        return File(pdfBytes, "application/pdf", $"analysis-{record.Id}.pdf");
    }

    [HttpGet("{id}/share")]
    public async Task<IActionResult> Share(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var record = await FindOwnedRecordOrCreateFromHistoryAsync(id, userId.Value);
        if (record == null) return NotFound(new { message = "History item not found." });

        if (string.IsNullOrWhiteSpace(record.ShareToken))
        {
            record.ShareToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
            await _db.SaveChangesAsync();
        }

        var link = $"{Request.Scheme}://{Request.Host}/api/history/shared/{record.ShareToken}";
        return Ok(new
        {
            shareToken = record.ShareToken,
            url = link
        });
    }

    [HttpGet("shared/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetShared(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { message = "Share token is required." });
        }

        var record = await _db.AnalysisRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.ShareToken == token.Trim());

        return record == null
            ? NotFound(new { message = "Shared analysis not found." })
            : Ok(ToAnalysisRecordResponse(record));
    }

    private async Task<AnalysisRecord?> FindOwnedRecordOrCreateFromHistoryAsync(Guid id, Guid userId)
    {
        var record = await _db.AnalysisRecords
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        if (record != null)
        {
            return record;
        }

        var history = await _db.EmotionHistories
            .Include(item => item.Recommendations)
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        if (history == null)
        {
            return null;
        }

        record = new AnalysisRecord
        {
            UserId = userId,
            InputType = NormalizeInputType(history.ModalityUsed),
            EmotionResult = history.DetectedEmotion,
            EmotionConfidence = history.Confidence,
            RecommendationsJson = BuildRecommendationsJson(history),
            Language = "tr",
            CreatedAt = history.CreatedAt
        };

        _db.AnalysisRecords.Add(record);
        await _db.SaveChangesAsync();
        return record;
    }

    private static AnalysisRecordResponse ToAnalysisRecordResponse(AnalysisRecord record)
    {
        return new AnalysisRecordResponse
        {
            Id = record.Id,
            Status = record.Status,
            InputType = record.InputType,
            EmotionResult = record.EmotionResult,
            EmotionConfidence = record.EmotionConfidence,
            ImageEmotion = record.ImageEmotion,
            ImageConfidence = record.ImageConfidence,
            TextEmotion = record.TextEmotion,
            TextConfidence = record.TextConfidence,
            ConflictDetected = record.ConflictDetected,
            Recommendations = DeserializeJsonOrNull(record.RecommendationsJson),
            Language = record.Language,
            CreatedAt = record.CreatedAt
        };
    }

    private static string NormalizeInputType(string? modality)
    {
        return modality?.Trim().ToLowerInvariant() switch
        {
            "image" => "image",
            "text" => "text",
            _ => "both"
        };
    }

    private static string BuildRecommendationsJson(EmotionHistory history)
    {
        var payload = new Dictionary<string, object?>
        {
            ["coach_advice"] = history.Explanation
        };

        foreach (var recommendation in history.Recommendations)
        {
            var key = recommendation.Category switch
            {
                "music" => "music",
                "movie" => "films",
                "book" => "books",
                "advice" => "activities",
                _ => recommendation.Category
            };
            payload[key] = DeserializeJsonOrNull(recommendation.Content);
        }

        return JsonSerializer.Serialize(payload);
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

    private static List<string> BuildReportLines(AnalysisRecord record)
    {
        var lines = new List<string>
        {
            "MoodLens Analysis Report",
            $"Emotion: {record.EmotionResult}",
            $"Confidence: {record.EmotionConfidence:P0}",
            $"Input type: {record.InputType}",
            $"Status: {record.Status}",
            $"Timestamp: {record.CreatedAt:u}"
        };

        var coachAdvice = ExtractString(record.RecommendationsJson, "coach_advice")
            ?? ExtractString(record.RecommendationsJson, "coachComment");
        if (!string.IsNullOrWhiteSpace(coachAdvice))
        {
            lines.Add($"Coach advice: {coachAdvice}");
        }

        lines.AddRange(BuildRecommendationSummary(record.RecommendationsJson));
        return lines;
    }

    private static IEnumerable<string> BuildRecommendationSummary(string recommendationsJson)
    {
        using var document = ParseJsonDocument(recommendationsJson);
        if (document == null || document.RootElement.ValueKind != JsonValueKind.Object)
        {
            yield break;
        }

        foreach (var key in new[] { "music", "movies", "films", "books", "lifeAdvice", "activities" })
        {
            if (!document.RootElement.TryGetProperty(key, out var value) ||
                value.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            var labels = value.EnumerateArray()
                .Take(3)
                .Select(ExtractItemLabel)
                .Where(label => !string.IsNullOrWhiteSpace(label))
                .ToList();

            if (labels.Count > 0)
            {
                yield return $"{key}: {string.Join(", ", labels)}";
            }
        }
    }

    private static string? ExtractItemLabel(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.String)
        {
            return item.GetString();
        }

        if (item.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        foreach (var key in new[] { "title", "name", "description" })
        {
            if (item.TryGetProperty(key, out var property) && property.ValueKind == JsonValueKind.String)
            {
                return property.GetString();
            }
        }

        return null;
    }

    private static string? ExtractString(string json, string propertyName)
    {
        using var document = ParseJsonDocument(json);
        if (document == null ||
            document.RootElement.ValueKind != JsonValueKind.Object ||
            !document.RootElement.TryGetProperty(propertyName, out var value) ||
            value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return value.GetString();
    }

    private static JsonDocument? ParseJsonDocument(string? rawJson)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            return null;
        }

        try
        {
            return JsonDocument.Parse(rawJson);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static byte[] BuildSimplePdf(IEnumerable<string> lines)
    {
        var content = new StringBuilder("BT\n/F1 12 Tf\n50 780 Td\n");
        foreach (var line in lines.Take(32))
        {
            content.Append('(')
                .Append(EscapePdfText(line))
                .Append(") Tj\n0 -18 Td\n");
        }
        content.Append("ET");

        var objects = new[]
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            $"<< /Length {Encoding.ASCII.GetByteCount(content.ToString())} >>\nstream\n{content}\nendstream"
        };

        var pdf = new StringBuilder("%PDF-1.4\n");
        var offsets = new List<int> { 0 };
        foreach (var obj in objects.Select((value, index) => (value, index)))
        {
            offsets.Add(Encoding.ASCII.GetByteCount(pdf.ToString()));
            pdf.Append(obj.index + 1).Append(" 0 obj\n").Append(obj.value).Append("\nendobj\n");
        }

        var xrefOffset = Encoding.ASCII.GetByteCount(pdf.ToString());
        pdf.Append("xref\n0 ").Append(objects.Length + 1).Append('\n');
        pdf.Append("0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1))
        {
            pdf.Append(offset.ToString("D10")).Append(" 00000 n \n");
        }
        pdf.Append("trailer\n<< /Size ").Append(objects.Length + 1).Append(" /Root 1 0 R >>\n");
        pdf.Append("startxref\n").Append(xrefOffset).Append("\n%%EOF");

        return Encoding.ASCII.GetBytes(pdf.ToString());
    }

    private static string EscapePdfText(string value)
    {
        var ascii = new string(value.Select(ch => ch is >= ' ' and <= '~' ? ch : '?').ToArray());
        return ascii.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private static string? NormalizeEmotionFilter(string? emotion)
    {
        if (string.IsNullOrWhiteSpace(emotion))
        {
            return null;
        }

        var normalized = emotion.Trim().ToLowerInvariant();
        return normalized == "all" ? null : normalized;
    }
}
