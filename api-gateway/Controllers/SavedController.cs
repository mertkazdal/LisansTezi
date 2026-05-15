using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;
using MoodLens.ApiGateway.Models;

namespace MoodLens.ApiGateway.Controllers;

[ApiController]
[Route("api/saved")]
[Authorize]
public class SavedController : ControllerBase
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;
    private static readonly HashSet<string> AllowedItemTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "music",
        "film",
        "book"
    };

    private readonly AppDbContext _db;

    public SavedController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveRecommendationRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (!TryNormalizeItemType(request.ItemType, out var itemType))
        {
            return BadRequest(new
            {
                message = "item_type must be one of: music, film, book.",
                code = "INVALID_ITEM_TYPE"
            });
        }

        var itemId = (request.ItemId ?? string.Empty).Trim();
        var itemTitle = (request.ItemTitle ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(itemId) || itemId.Length > 240)
        {
            return BadRequest(new
            {
                message = "item_id is required and must be 240 characters or fewer.",
                code = "INVALID_ITEM_ID"
            });
        }

        if (string.IsNullOrWhiteSpace(itemTitle) || itemTitle.Length > 500)
        {
            return BadRequest(new
            {
                message = "item_title is required and must be 500 characters or fewer.",
                code = "INVALID_ITEM_TITLE"
            });
        }

        if (request.AnalysisRecordId is { } analysisRecordId)
        {
            var ownsRecord = await _db.AnalysisRecords
                .AsNoTracking()
                .AnyAsync(record => record.Id == analysisRecordId && record.UserId == userId.Value);
            if (!ownsRecord)
            {
                return NotFound(new { message = "Analysis record not found." });
            }
        }

        var existing = await _db.SavedRecommendations
            .AsNoTracking()
            .FirstOrDefaultAsync(item =>
                item.UserId == userId.Value &&
                item.ItemType == itemType &&
                item.ItemId == itemId);

        if (existing != null)
        {
            return Ok(new
            {
                saved = true,
                already_existed = true,
                id = existing.Id
            });
        }

        var itemData = request.ItemData.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null
            ? "{}"
            : request.ItemData.GetRawText();
        var saved = new SavedRecommendation
        {
            UserId = userId.Value,
            AnalysisRecordId = request.AnalysisRecordId,
            ItemType = itemType,
            ItemId = itemId,
            ItemTitle = itemTitle,
            ItemData = itemData,
            SavedAt = DateTime.UtcNow
        };

        _db.SavedRecommendations.Add(saved);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            var duplicate = await _db.SavedRecommendations
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.UserId == userId.Value &&
                    item.ItemType == itemType &&
                    item.ItemId == itemId);
            if (duplicate != null)
            {
                return Ok(new
                {
                    saved = true,
                    already_existed = true,
                    id = duplicate.Id
                });
            }

            throw;
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            saved = true,
            already_existed = false,
            id = saved.Id
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetSaved(
        [FromQuery] string? type = null,
        [FromQuery] int page = DefaultPage,
        [FromQuery] int limit = DefaultLimit)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (page < 1)
        {
            return BadRequest(new { message = "page must be at least 1." });
        }

        if (limit < 1 || limit > MaxLimit)
        {
            return BadRequest(new { message = $"limit must be between 1 and {MaxLimit}." });
        }

        var query = _db.SavedRecommendations
            .AsNoTracking()
            .Where(item => item.UserId == userId.Value);

        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!TryNormalizeItemType(type, out var normalizedType))
            {
                return BadRequest(new
                {
                    message = "type must be one of: music, film, book.",
                    code = "INVALID_ITEM_TYPE"
                });
            }

            query = query.Where(item => item.ItemType == normalizedType);
        }

        var total = await query.CountAsync();
        var savedItems = await query
            .OrderByDescending(item => item.SavedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();
        var items = savedItems
            .Select(item => new
            {
                id = item.Id,
                analysis_record_id = item.AnalysisRecordId,
                item_type = item.ItemType,
                item_id = item.ItemId,
                item_title = item.ItemTitle,
                item_data = DeserializeJsonOrEmpty(item.ItemData),
                saved_at = item.SavedAt
            })
            .ToList();

        return Ok(new
        {
            items,
            total,
            page,
            limit
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var item = await _db.SavedRecommendations
            .FirstOrDefaultAsync(saved => saved.Id == id && saved.UserId == userId.Value);
        if (item == null)
        {
            return NotFound(new { message = "Saved item not found." });
        }

        _db.SavedRecommendations.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { removed = true });
    }

    [HttpGet("check/{itemType}/{itemId}")]
    public async Task<IActionResult> Check(string itemType, string itemId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (!TryNormalizeItemType(itemType, out var normalizedType))
        {
            return BadRequest(new
            {
                message = "item_type must be one of: music, film, book.",
                code = "INVALID_ITEM_TYPE"
            });
        }

        var normalizedItemId = (itemId ?? string.Empty).Trim();
        var item = await _db.SavedRecommendations
            .AsNoTracking()
            .FirstOrDefaultAsync(saved =>
                saved.UserId == userId.Value &&
                saved.ItemType == normalizedType &&
                saved.ItemId == normalizedItemId);

        return item == null
            ? Ok(new { saved = false })
            : Ok(new { saved = true, id = item.Id });
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private static bool TryNormalizeItemType(string? rawType, out string itemType)
    {
        itemType = (rawType ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "movie" or "movies" or "films" => "film",
            "tracks" or "track" => "music",
            "books" => "book",
            var normalized => normalized
        };
        return AllowedItemTypes.Contains(itemType);
    }

    private static JsonElement DeserializeJsonOrEmpty(string? rawJson)
    {
        try
        {
            return JsonSerializer.Deserialize<JsonElement>(
                string.IsNullOrWhiteSpace(rawJson) ? "{}" : rawJson
            );
        }
        catch (JsonException)
        {
            return JsonSerializer.Deserialize<JsonElement>("{}");
        }
    }
}
