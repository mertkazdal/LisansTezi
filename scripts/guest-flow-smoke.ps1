param(
    [string]$ApiBase = "http://localhost:5000",
    [int]$GeminiCooldownSeconds = 65
)

$ErrorActionPreference = "Stop"

function Invoke-GuestJson {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session
    )

    $params = @{
        Method = $Method
        Uri = $Url
        WebSession = $Session
        TimeoutSec = 240
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json; charset=utf-8"
        $params.Body = ($Body | ConvertTo-Json -Depth 30 -Compress)
    }

    Invoke-RestMethod @params
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$answers = [ordered]@{}
for ($i = 1; $i -le 20; $i++) {
    $answers[[string]$i] = (($i % 5) + 1)
}

$survey = Invoke-GuestJson POST "$ApiBase/api/survey/submit" @{
    answers = $answers
    ageGroup = "young_adult"
} $session

if ($GeminiCooldownSeconds -gt 0) {
    Start-Sleep -Seconds $GeminiCooldownSeconds
}

$analysis = Invoke-GuestJson POST "$ApiBase/api/analyze" @{
    text = "Bugün içim biraz dar ama toparlanmak istiyorum. Bana sakin ve uygulanabilir öneriler ver."
} $session

$sources = if ($analysis.data_sources) { $analysis.data_sources } elseif ($analysis.dataSources) { $analysis.dataSources } else { $analysis.recommendations.data_sources }
if ($sources.music -ne "spotify" -or $sources.films -ne "tmdb" -or $sources.books -ne "google_books") {
    throw "Guest provider fallback: $($sources | ConvertTo-Json -Compress)"
}

$cookieJson = @{
    SessionId = "quota-test-session"
    CompletedAnalyses = 3
    SurveyCompleted = $true
    PersonalityJson = "{}"
    AgeGroup = "young_adult"
} | ConvertTo-Json -Compress
$cookieValue = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($cookieJson))
$quotaSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$quotaSession.Cookies.SetCookies([uri]$ApiBase, "moodlens_guest_session=$cookieValue")

$quotaBodyFile = New-TemporaryFile
[IO.File]::WriteAllText(
    $quotaBodyFile.FullName,
    '{"text":"Bugün biraz yorgunum ama sakin önerilere ihtiyacım var."}',
    [Text.Encoding]::UTF8
)
$quotaResponse = & curl.exe -sS -w "`n%{http_code}" `
    -H "Content-Type: application/json; charset=utf-8" `
    -H "Cookie: moodlens_guest_session=$cookieValue" `
    --data-binary "@$($quotaBodyFile.FullName)" `
    "$ApiBase/api/analyze"
Remove-Item -LiteralPath $quotaBodyFile.FullName -Force
if ($LASTEXITCODE -ne 0) {
    throw "Guest quota request failed."
}
$quotaLines = $quotaResponse -split "`n"
$quotaStatus = [int]$quotaLines[-1]
$quotaBody = ($quotaLines[0..($quotaLines.Count - 2)] -join "`n")
if ($quotaStatus -ne 403 -or $quotaBody -notmatch "GUEST_QUOTA_EXCEEDED") {
    throw "Guest quota did not return expected code: $quotaBody"
}

[pscustomobject]@{
    guestSurveyPersisted = $survey.persisted
    guestSessionId = $survey.guestSessionId
    emotion = $analysis.emotion
    sources = $sources
    remaining = $analysis.guestRemainingAnalyses
    quotaBlocked = $true
} | ConvertTo-Json -Depth 8
