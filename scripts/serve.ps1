param([int]$Port = 4173, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$siteRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\dist'))
if (-not (Test-Path -LiteralPath (Join-Path $siteRoot 'index.html'))) { throw 'dist/index.html bulunamadi. ZIP dosyasini tamamen cikarin.' }
$listener = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback, $Port)
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.json'='application/json'; '.txt'='text/plain; charset=utf-8' }
try {
  $listener.Start()
  Write-Host "GENCEBAY ROADS - http://127.0.0.1:$Port" -ForegroundColor Green
  Write-Host 'Internet gerekmez. Durdurmak icin bu pencereyi kapatin veya Ctrl+C.'
  if (-not $NoBrowser) { Start-Process "http://127.0.0.1:$Port" }
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 2500
      $stream = $client.GetStream()
      $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $request = $reader.ReadLine()
      if (-not $request) { continue }
      do { $header = $reader.ReadLine() } while ($header)
      $parts = $request.Split(' ')
      $uriPath = [Uri]::UnescapeDataString(($parts[1] -split '\?')[0]).TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
      if (-not $uriPath) { $uriPath = 'index.html' }
      $target = [IO.Path]::GetFullPath((Join-Path $siteRoot $uriPath))
      $status = '200 OK'
      if (-not $target.StartsWith($siteRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $target -PathType Leaf)) {
        $status = '404 Not Found'; $bytes = [Text.Encoding]::UTF8.GetBytes('Not found'); $type = 'text/plain'
      } else {
        $bytes = [IO.File]::ReadAllBytes($target)
        $type = $mime[[IO.Path]::GetExtension($target)]
        if (-not $type) { $type = 'application/octet-stream' }
      }
      $response = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nX-Content-Type-Options: nosniff`r`n`r`n"
      $head = [Text.Encoding]::ASCII.GetBytes($response)
      $stream.Write($head, 0, $head.Length)
      if ($parts[0] -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
      $stream.Flush()
    } catch { Write-Verbose $_ } finally { $client.Close() }
  }
} catch { Write-Host "Sunucu baslatilamadi: $($_.Exception.Message)" -ForegroundColor Red; Write-Host '4173 portunu kullanan onceki oyun penceresini kapatin. Veya: powershell -File scripts/serve.ps1 -Port 4174'; Read-Host 'Kapatmak icin Enter' } finally { $listener.Stop() }
