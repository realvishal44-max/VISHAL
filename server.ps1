$root = (Get-Item -Path ".").FullName
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "BCA STORE running at http://localhost:$port/"
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $path = $req.Url.LocalPath
    if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }
    $filePath = Join-Path $root ($path.TrimStart("/").Replace("/","\"))
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    $mime = switch ($ext) {
        ".html" { "text/html; charset=utf-8" }
        ".css"  { "text/css; charset=utf-8" }
        ".js"   { "application/javascript; charset=utf-8" }
        ".json" { "application/json" }
        ".png"  { "image/png" }
        ".jpg"  { "image/jpeg" }
        ".ico"  { "image/x-icon" }
        default { "text/plain" }
    }
    if (Test-Path $filePath) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentType = $mime
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $res.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $res.OutputStream.Write($msg, 0, $msg.Length)
    }
    $res.OutputStream.Close()
}
