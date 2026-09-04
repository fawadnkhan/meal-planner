$ProgressPreference = 'SilentlyContinue'
$api    = "https://meal-planner-api-82e5.onrender.com"
$origin = "https://meal-planner-nu-five.vercel.app"
$ts     = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email  = "corstest${ts}@test.com"
$script:tok = ""
$pass = 0; $fail = 0

function HttpReq([string]$method, [string]$url, [string]$body, [string]$token, [bool]$sendOrigin) {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.Method      = $method
    $req.ContentType = "application/json"
    $req.Timeout     = 30000
    if ($sendOrigin) { $req.Headers["Origin"] = $script:origin }
    if ($token)      { $req.Headers["Authorization"] = "Bearer $token" }
    if ($body) {
        $b = [System.Text.Encoding]::UTF8.GetBytes($body)
        $req.ContentLength = $b.Length
        $s = $req.GetRequestStream()
        $s.Write($b, 0, $b.Length)
        $s.Close()
    } else {
        $req.ContentLength = 0
    }
    try {
        $res  = $req.GetResponse()
        $txt  = (New-Object System.IO.StreamReader($res.GetResponseStream())).ReadToEnd()
        $acao = $res.Headers["Access-Control-Allow-Origin"]
        return [pscustomobject]@{ Code = [int]$res.StatusCode; Body = $txt; ACAO = $acao }
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $txt  = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
            $acao = $_.Exception.Response.Headers["Access-Control-Allow-Origin"]
            return [pscustomobject]@{ Code = [int]$_.Exception.Response.StatusCode; Body = $txt; ACAO = $acao }
        }
        return [pscustomobject]@{ Code = 0; Body = $_.Exception.Message; ACAO = "" }
    }
}

function T([string]$lbl, $r, [int]$want) {
    if ($r.Code -eq $want) {
        Write-Host "  PASS [$($r.Code)] $lbl"
        $script:pass++
    } else {
        Write-Host "  FAIL [$($r.Code)] $lbl  =>  $($r.Body)"
        $script:fail++
    }
    if ($r.ACAO) {
        Write-Host "       CORS: $($r.ACAO)"
    }
}

# -- CORS preflight -----------------------------------------------------------
Write-Host "=== CORS Preflight ==="
$req = [System.Net.HttpWebRequest]::Create("$api/api/auth/login")
$req.Method = "OPTIONS"
$req.Timeout = 15000
$req.Headers["Origin"] = $origin
$req.Headers["Access-Control-Request-Method"]  = "POST"
$req.Headers["Access-Control-Request-Headers"] = "content-type,authorization"
$req.ContentLength = 0
try {
    $res  = $req.GetResponse()
    $acao = $res.Headers["Access-Control-Allow-Origin"]
    $acam = $res.Headers["Access-Control-Allow-Methods"]
    Write-Host "  Preflight HTTP $([int]$res.StatusCode)"
    Write-Host "  Allow-Origin  : $acao"
    Write-Host "  Allow-Methods : $acam"
    if ($acao -eq $origin) {
        Write-Host "  CORS origin match: OK"
        $pass++
    } else {
        Write-Host "  CORS origin match: FAIL (got '$acao')"
        $fail++
    }
} catch [System.Net.WebException] {
    if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
        $acao = $_.Exception.Response.Headers["Access-Control-Allow-Origin"]
        Write-Host "  Preflight HTTP $code - ACAO: $acao"
        if ($acao -eq $origin) { $pass++ } else { $fail++ }
    } else {
        Write-Host "  Preflight error: $($_.Exception.Message)"
        $fail++
    }
}

# -- Auth with Origin header (simulates browser) ------------------------------
Write-Host ""
Write-Host "=== Auth (browser-simulated with Origin header) ==="
$r = HttpReq "POST" "$api/api/auth/register" "{`"name`":`"CORS Test`",`"email`":`"$email`",`"password`":`"pass1234`"}" "" $true
T "Register" $r 201
if ($r.Code -eq 201) { $script:tok = ($r.Body | ConvertFrom-Json).token }

$r = HttpReq "POST" "$api/api/auth/login" "{`"email`":`"$email`",`"password`":`"pass1234`"}" "" $true
T "Login" $r 200
if ($r.Code -eq 200) { $script:tok = ($r.Body | ConvertFrom-Json).token }

$r = HttpReq "GET" "$api/api/auth/me" "" $script:tok $true
T "GET /me (Origin + JWT)" $r 200
if ($r.Code -eq 200) { Write-Host "       => $(($r.Body | ConvertFrom-Json).user.email)" }

# -- Summary ------------------------------------------------------------------
Write-Host ""
Write-Host "========================="
Write-Host "  PASSED : $pass"
Write-Host "  FAILED : $fail"
Write-Host "========================="
