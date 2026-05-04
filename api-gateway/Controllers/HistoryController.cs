using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoodLens.ApiGateway.Data;
using MoodLens.ApiGateway.DTOs;

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
    public async Task<IActionResult> GetHistory([FromQuery] int page = DefaultPage, [FromQuery] int limit = DefaultPageSize)
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
            .Where(h => h.UserId == userId.Value)
            .OrderByDescending(h => h.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
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

        return Ok(new
        {
            items,
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

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
