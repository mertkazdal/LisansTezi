param(
    [string]$ApiBase = "http://localhost:5000",
    [int]$GeminiCooldownSeconds = 65
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $params = @{
        Method = $Method
        Uri = $Url
        Headers = $Headers
        TimeoutSec = 240
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json; charset=utf-8"
        $params.Body = ($Body | ConvertTo-Json -Depth 30 -Compress)
    }

    Invoke-RestMethod @params
}

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "codex_smoke_$timestamp@example.com"
$username = "codex$timestamp"
$survey = @{
    recommendationGoal = "comfort"
    energyPreference = "balanced"
    musicGenres = @("pop", "indie")
    movieGenres = @("drama", "adventure")
    bookGenres = @("psychology", "fiction")
}

$register = Invoke-Json POST "$ApiBase/api/auth/register" @{
    username = $username
    email = $email
    password = "Smoke123!"
    recommendationSurvey = $survey
}

$headers = @{
    Authorization = "Bearer $($register.token)"
    "Accept-Language" = "tr"
}

$answers = [ordered]@{}
for ($i = 1; $i -le 20; $i++) {
    $answers[[string]$i] = (($i % 5) + 1)
}

$personality = Invoke-Json POST "$ApiBase/api/survey/submit" @{
    answers = $answers
    ageGroup = "young_adult"
} $headers

if ($GeminiCooldownSeconds -gt 0) {
    Start-Sleep -Seconds $GeminiCooldownSeconds
}

$analysis = Invoke-Json POST "$ApiBase/api/analyze" @{
    text = "Bugün kendimi daha umutlu hissediyorum, ama biraz da yorgunum. Bana sakin ve iyi gelecek öneriler lazım."
    age_group = "young_adult"
} $headers

if (-not $analysis.historyId) {
    throw "Analyze did not create historyId."
}

$sources = if ($analysis.data_sources) { $analysis.data_sources } elseif ($analysis.dataSources) { $analysis.dataSources } else { $analysis.recommendations.data_sources }
if ($sources.music -ne "spotify" -or $sources.films -ne "tmdb" -or $sources.books -ne "google_books") {
    throw "Analyze recommendations fell back: $($sources | ConvertTo-Json -Compress)"
}

$historyId = $analysis.historyId
$history = Invoke-Json GET "$ApiBase/api/history/$historyId" $null $headers
$share = Invoke-Json GET "$ApiBase/api/history/$historyId/share" $null $headers
$shareToken = if ($share.shareToken) { $share.shareToken } else { $share.token }
if (-not $shareToken -or -not $share.expiresAt) {
    throw "Share token did not include expiry."
}

Invoke-Json GET "$ApiBase/api/history/shared/$shareToken" | Out-Null
Invoke-Json DELETE "$ApiBase/api/history/$historyId/share" $null $headers | Out-Null
try {
    Invoke-Json GET "$ApiBase/api/history/shared/$shareToken" | Out-Null
    throw "Revoked share token still worked."
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 404) {
        throw
    }
}

$pdfFile = New-TemporaryFile
$pdfCurl = & curl.exe -sS -w "%{http_code} %{size_download}" `
    -H "Authorization: Bearer $($register.token)" `
    -o $pdfFile.FullName `
    "$ApiBase/api/history/$historyId/report"
if ($LASTEXITCODE -ne 0) {
    throw "PDF report request failed."
}
$pdfParts = $pdfCurl.Trim().Split(" ", [StringSplitOptions]::RemoveEmptyEntries)
$pdfStatus = [int]$pdfParts[0]
$pdfBytes = [int]$pdfParts[1]
Remove-Item -LiteralPath $pdfFile.FullName -Force
if ($pdfStatus -ne 200 -or $pdfBytes -lt 500) {
    throw "PDF report was not generated."
}

$saved = Invoke-Json POST "$ApiBase/api/saved" @{
    item_type = "movies"
    item_id = "smoke-movie-42"
    item_title = "Smoke Movie"
    item_data = @{ id = "smoke-movie-42"; title = "Smoke Movie" }
} $headers

$check = Invoke-Json GET "$ApiBase/api/saved/check/movie/smoke-movie-42" $null $headers
if (-not $check.saved) {
    throw "Saved check failed."
}

$list = Invoke-Json GET "$ApiBase/api/saved?type=films" $null $headers
if ($list.total -lt 1) {
    throw "Saved list film alias failed."
}

$delete = Invoke-Json DELETE "$ApiBase/api/user/account" @{
    confirmationText = "DELETE"
} $headers

[pscustomobject]@{
    email = $email
    userId = $register.userId
    personalityPersisted = $personality.persisted
    emotion = $analysis.emotion
    historyId = $historyId
    dataSources = $sources
    shareHadExpiry = [bool]$share.expiresAt
    pdfBytes = $pdfBytes
    savedAliasWorked = $check.saved
    deletedAnalyses = $delete.deletedAnalyses
    deletedAnalysisRecords = $delete.deletedAnalysisRecords
    deletedSavedRecommendations = $delete.deletedSavedRecommendations
    historyStatus = $history.status
} | ConvertTo-Json -Depth 8
