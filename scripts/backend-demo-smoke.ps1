param(
    [string]$ApiBase = "http://localhost:5000",
    [string]$AiBase = "http://localhost:8000",
    [string]$AuthToken = "",
    [switch]$SkipRecommendations
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
        TimeoutSec = 180
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json; charset=utf-8"
        $params.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
    }

    Invoke-RestMethod @params
}

Write-Host "== Health =="
$aiHealth = Invoke-Json -Method GET -Url "$AiBase/health"
$apiHealth = Invoke-Json -Method GET -Url "$ApiBase/health"
Write-Host "AI status:  $($aiHealth.status)"
Write-Host "API status: $($apiHealth.status)"

Write-Host "== Survey questions =="
$questions = Invoke-Json -Method GET -Url "$ApiBase/api/survey/questions?language=tr"
if (-not $questions.questions -or $questions.questions.Count -lt 20) {
    throw "Survey questions endpoint did not return 20 questions."
}
Write-Host "Survey questions: $($questions.questions.Count)"

Write-Host "== Image validation errors =="
try {
    Invoke-Json -Method POST -Url "$AiBase/api/validate-image" -Body @{
        image_base64 = "not-valid-base64"
        mime_type = "image/jpeg"
        language = "tr"
    } | Out-Null
    throw "Invalid base64 unexpectedly passed validation."
}
catch {
    $message = $_.ErrorDetails.Message
    if ($message -notmatch "INVALID_IMAGE") {
        throw "Invalid base64 did not return INVALID_IMAGE. Response: $message"
    }
    Write-Host "Invalid base64 -> INVALID_IMAGE"
}

try {
    Invoke-Json -Method POST -Url "$AiBase/api/validate-image" -Body @{
        image_base64 = "AAAA"
        mime_type = "image/heic"
        language = "tr"
    } | Out-Null
    throw "Unsupported mime type unexpectedly passed validation."
}
catch {
    $message = $_.ErrorDetails.Message
    if ($message -notmatch "UNSUPPORTED_IMAGE_TYPE") {
        throw "Unsupported mime did not return UNSUPPORTED_IMAGE_TYPE. Response: $message"
    }
    Write-Host "Unsupported mime -> UNSUPPORTED_IMAGE_TYPE"
}

if (-not $SkipRecommendations) {
    Write-Host "== Direct AI recommendations =="
    $recommendations = Invoke-Json -Method POST -Url "$AiBase/recommendations" -Body @{
        emotion = "happy"
        context = "Kullanıcı moral olarak iyi ve yeni şeyler keşfetmek istiyor."
        language = "tr"
        personality_json = '{"openness":78,"conscientiousness":62,"extraversion":55,"agreeableness":70,"neuroticism":35}'
        age_group = "young_adult"
        confidence = 0.82
        analysis_text = "Bugün kendimi daha hafif ve umutlu hissediyorum."
        survey_movie_genres = @("drama", "adventure")
        excluded_movie_ids = @()
    }

    if ($recommendations.music.Count -lt 1 -or $recommendations.movies.Count -lt 1 -or $recommendations.books.Count -lt 1) {
        throw "Recommendations did not return music, movies and books."
    }

    $sources = $recommendations.data_sources
    Write-Host "Data sources: music=$($sources.music), films=$($sources.films), books=$($sources.books)"
}

if (-not [string]::IsNullOrWhiteSpace($AuthToken)) {
    Write-Host "== Authenticated saved endpoints =="
    $headers = @{ Authorization = "Bearer $AuthToken" }
    $saved = Invoke-Json -Method POST -Url "$ApiBase/api/saved" -Headers $headers -Body @{
        item_type = "movies"
        item_id = "smoke-test-movie-1"
        item_title = "Smoke Test Movie"
        item_data = @{ id = "smoke-test-movie-1"; title = "Smoke Test Movie" }
    }
    Write-Host "Saved alias movies -> id=$($saved.id), existed=$($saved.already_existed)"

    $check = Invoke-Json -Method GET -Url "$ApiBase/api/saved/check/movie/smoke-test-movie-1" -Headers $headers
    if (-not $check.saved) {
        throw "Saved check endpoint did not find the saved movie alias."
    }
    Write-Host "Saved check movie alias -> saved=true"
}

Write-Host "Backend demo smoke completed."
