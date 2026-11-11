#requires -Version 5.1
[CmdletBinding()]
param([switch]$Stop, [switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false)
$projectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$runRoot = Join-Path $projectRoot '.run.local\one-click'
$logRoot = Join-Path $runRoot 'logs'
$stateFile = Join-Path $runRoot 'state.json'
$settingsFile = Join-Path $runRoot 'settings.json'
$webUrl = 'http://127.0.0.1:5181'
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
$utf8 = New-Object Text.UTF8Encoding($false)
$state = @{ ProjectRoot = $projectRoot; Backend = $null; Frontend = $null }

function Read-Setting([string]$Name, $Default = $null) {
    $property = $settings.PSObject.Properties[$Name]
    if ($null -ne $property -and $null -ne $property.Value -and [string]$property.Value -ne '') { return $property.Value }
    return $Default
}

function Save-State {
    $temporary = $stateFile + '.tmp'
    [IO.File]::WriteAllText($temporary, ($state | ConvertTo-Json -Depth 6), $utf8)
    Move-Item -LiteralPath $temporary -Destination $stateFile -Force
}

function Get-ManagedProcess($Record) {
    if ($null -eq $Record) { return $null }
    $process = Get-Process -Id ([int]$Record.Pid) -ErrorAction SilentlyContinue
    if ($null -eq $process) { return $null }
    try {
        if ($process.StartTime.ToUniversalTime().Ticks.ToString() -ne [string]$Record.Started) { return $null }
        if (-not [string]::Equals($process.Path, [string]$Record.Executable, [StringComparison]::OrdinalIgnoreCase)) { return $null }
    } catch { return $null }
    return $process
}

function Process-Record($Process, [string]$Executable) {
    return @{ Pid = $Process.Id; Started = $Process.StartTime.ToUniversalTime().Ticks.ToString(); Executable = $Executable }
}

function Quote-Argument([string]$Value) {
    $escaped = $Value -replace '(\\*)"', '$1$1\"'
    $escaped = $escaped -replace '(\\+)$', '$1$1'
    return '"' + $escaped + '"'
}

function Start-Hidden([string]$Executable, [string[]]$Arguments, [string]$WorkingDirectory, [string]$LogName, [switch]$Wait) {
    $line = ($Arguments | ForEach-Object { Quote-Argument $_ }) -join ' '
    $options = @{ FilePath = $Executable; ArgumentList = $line; WorkingDirectory = $WorkingDirectory;
        WindowStyle = 'Hidden'; PassThru = $true;
        RedirectStandardOutput = (Join-Path $logRoot ($LogName + '.log'));
        RedirectStandardError = (Join-Path $logRoot ($LogName + '-error.log')) }
    $process = Start-Process @options
    # Cache the native handle before a short-lived command exits (Windows PowerShell 5.1 ExitCode quirk).
    $null = $process.Handle
    # -Wait waits for the entire process tree on Windows, including pg_ctl's persistent database child.
    if ($Wait) { $process.WaitForExit(); $process.Refresh() }
    return $process
}

function With-Environment([hashtable]$Values, [scriptblock]$Action) {
    $previous = @{}
    foreach ($name in $Values.Keys) {
        $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
        [Environment]::SetEnvironmentVariable($name, $Values[$name], 'Process')
    }
    try { & $Action } finally {
        foreach ($name in $previous.Keys) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
    }
}

function Get-LocalResponse([string]$Url) {
    $response = $null
    try {
        $request = [Net.HttpWebRequest]::Create($Url)
        $request.Proxy = $null
        $request.Timeout = 2000
        $request.ReadWriteTimeout = 2000
        try { $response = $request.GetResponse() } catch [Net.WebException] { $response = $_.Exception.Response }
        if ($null -eq $response) { return $null }
        $reader = New-Object IO.StreamReader($response.GetResponseStream())
        try { return @{ Status = [int]$response.StatusCode; Body = $reader.ReadToEnd() } } finally { $reader.Dispose() }
    } catch { return $null } finally { if ($null -ne $response) { $response.Dispose() } }
}

function Test-Api {
    $health = Get-LocalResponse ($apiUrl + '/health/ready')
    if ($null -eq $health -or $health.Status -ne 200) { return $false }
    $info = Get-LocalResponse ($apiUrl + '/api/v1/system/info')
    if ($null -eq $info -or $info.Status -ne 200) { return $false }
    try { return ($info.Body | ConvertFrom-Json).service -eq 'FocusTime_Server' } catch { return $false }
}

function Test-Frontend {
    $response = Get-LocalResponse ($webUrl + '/package.json')
    if ($null -eq $response -or $response.Status -ne 200) { return $false }
    try { return ($response.Body | ConvertFrom-Json).name -eq 'focustime-admin' } catch { return $false }
}

function Test-Port([int]$Port) {
    $client = New-Object Net.Sockets.TcpClient
    try {
        $attempt = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $attempt.AsyncWaitHandle.WaitOne(500)) { return $false }
        $client.EndConnect($attempt)
        return $true
    } catch { return $false } finally { $client.Dispose() }
}

function Find-Node {
    $candidates = New-Object 'Collections.Generic.List[string]'
    $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command) { $candidates.Add($command.Source) }
    $candidates.Add([string](Read-Setting 'NodePath' ''))
    $candidates.Add((Join-Path $env:ProgramFiles 'nodejs\node.exe'))
    $candidates.Add((Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'))
    try {
        foreach ($package in @(Get-AppxPackage -Name 'OpenAI.CodexPrimaryRuntime*' -ErrorAction SilentlyContinue | Sort-Object Version -Descending)) {
            $candidates.Add((Join-Path $package.InstallLocation 'dependencies\node\bin\node.exe'))
        }
    } catch { }
    foreach ($directory in @(Get-ChildItem (Join-Path $env:ProgramFiles 'WindowsApps') -Directory -Filter 'OpenAI.CodexPrimaryRuntime*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending)) {
        $candidates.Add((Join-Path $directory.FullName 'dependencies\node\bin\node.exe'))
    }
    foreach ($candidate in @($candidates | Where-Object { $_ } | Select-Object -Unique)) {
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        try {
            $version = & $candidate -p 'process.versions.node' 2>$null
            if ($LASTEXITCODE -eq 0 -and [version]$version -ge [version]'22.13.0') { return [IO.Path]::GetFullPath($candidate) }
        } catch { }
    }
    throw '找不到可用的 Node.js。请安装 Node.js 22.13 或更高版本后重新双击启动；也可使用本机 Codex 附带的 Node.js。'
}

function Ensure-Dependencies {
    if (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules\vite\bin\vite.js')) { return }
    Write-Host '[2/5] 首次安装前端依赖，请稍候…'
    $nodeBin = Split-Path -Parent $node
    $pnpm = Join-Path $nodeBin '..\node_modules\pnpm\bin\pnpm.mjs'
    $npm = Join-Path $nodeBin 'node_modules\npm\bin\npm-cli.js'
    $packageManager = Get-Command pnpm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    $env:PATH = $nodeBin + ';' + $env:PATH
    if (Test-Path -LiteralPath $pnpm) {
        $install = Start-Hidden $node @([IO.Path]::GetFullPath($pnpm), 'install', '--frozen-lockfile', '--store-dir', (Join-Path $projectRoot '.pnpm-store')) $projectRoot 'dependencies' -Wait
    } elseif (Test-Path -LiteralPath $npm) {
        $install = Start-Hidden $node @($npm, 'install', '--no-package-lock') $projectRoot 'dependencies' -Wait
    } elseif ($null -ne $packageManager) {
        & $packageManager.Source install --frozen-lockfile --store-dir (Join-Path $projectRoot '.pnpm-store')
        if ($LASTEXITCODE -ne 0) { throw '前端依赖安装失败，请检查网络和上方输出。' }
        return
    } else { throw '前端依赖尚未安装，且未找到包管理器。请安装包含 npm 的 Node.js 后重新启动。' }
    if ($install.ExitCode -ne 0) { throw "前端依赖安装失败，请查看 $logRoot\dependencies-error.log" }
}

function Ensure-Database {
    $data = [IO.Path]::GetFullPath([string](Read-Setting 'DatabaseDataDirectory'))
    $pgBin = Join-Path $serverRoot '.tools\pgsql\bin'
    $pgCtl = Join-Path $pgBin 'pg_ctl.exe'
    $psql = Join-Path $pgBin 'psql.exe'
    if (-not (Test-Path -LiteralPath (Join-Path $data 'PG_VERSION'))) { throw '找不到原有数据库目录，请检查本机启动配置；不会创建空数据库替换现有数据。' }
    if (-not (Test-Path -LiteralPath $pgCtl) -or -not (Test-Path -LiteralPath $psql)) { throw '找不到 FocusTime_Server 的 PostgreSQL 工具。' }
    if (-not (Test-Port $databasePort)) {
        $addresses = @('127.0.0.1')
        $optsFile = Join-Path $data 'postmaster.opts'
        if (Test-Path -LiteralPath $optsFile) {
            $opts = Get-Content -LiteralPath $optsFile -Raw
            if ($opts -match '"-h"\s+"([0-9a-fA-F:.,]+)"') {
                $savedAddresses = $matches[1] -split ','
                $assigned = @([Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() | ForEach-Object { $_.GetIPProperties().UnicastAddresses } | ForEach-Object { $_.Address.ToString() })
                $addresses += @($savedAddresses | Where-Object { $_ -in $assigned })
            }
        }
        $listen = ($addresses | Select-Object -Unique) -join ','
        $pg = Start-Hidden $pgCtl @('-D', $data, '-l', (Join-Path $logRoot 'postgres.log'), '-o', "-h $listen -p $databasePort", '-t', '30', '-w', 'start') $projectRoot 'database-start' -Wait
        if ($pg.ExitCode -ne 0) { throw "原有数据库启动失败，请查看 $logRoot\postgres.log" }
    }
    With-Environment @{ PGPASSWORD = $databasePassword } {
        $check = Start-Hidden $psql @('-h', '127.0.0.1', '-p', [string]$databasePort, '-U', 'postgres', '-d', 'postgres', '-At', '-c', 'SHOW data_directory;') $projectRoot 'database-check' -Wait
        if ($check.ExitCode -ne 0) { throw "数据库连接验证失败，请查看 $logRoot\database-check-error.log" }
        $actual = (Get-Content (Join-Path $logRoot 'database-check.log') -Raw).Trim()
        if (-not [string]::Equals([IO.Path]::GetFullPath($actual).TrimEnd('\'), $data.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)) { throw '55432 端口上的数据库与原数据目录不一致，已停止启动。' }
    }
}

# Serialize double clicks and stop requests for this checkout.
$sha = [Security.Cryptography.SHA256]::Create()
try { $key = [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot.ToLowerInvariant()))).Replace('-', '').Substring(0, 16) } finally { $sha.Dispose() }
$mutex = New-Object Threading.Mutex($false, ('Local\FocusTimeAdmin.Dev.' + $key))
$locked = $false
try {
    try { $locked = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $locked = $true }
    if (-not $locked) { Write-Host '另一个启动或停止操作正在进行，请稍候。'; exit 0 }
    if (Test-Path -LiteralPath $stateFile) {
        $saved = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
        if (-not [string]::Equals([string]$saved.ProjectRoot, $projectRoot, [StringComparison]::OrdinalIgnoreCase)) { throw '启动状态文件属于另一个项目目录。' }
        $state.Backend = $saved.Backend
        $state.Frontend = $saved.Frontend
    }
    if ($Stop) {
        foreach ($name in @('Frontend', 'Backend')) {
            $managed = Get-ManagedProcess $state[$name]
            if ($null -ne $managed) { Stop-Process -InputObject $managed; $managed.WaitForExit(5000) | Out-Null }
            $state[$name] = $null
        }
        Save-State
        Write-Host '项目服务已停止。共享 PostgreSQL 数据库保持运行。' -ForegroundColor Green
        exit 0
    }
    if (-not (Test-Path -LiteralPath $settingsFile)) { throw "找不到本机启动配置：$settingsFile。请按 README 的一键启动配置说明填写原数据库路径。" }
    $settings = Get-Content -LiteralPath $settingsFile -Raw | ConvertFrom-Json
    $serverRoot = [IO.Path]::GetFullPath([string](Read-Setting 'ServerRoot' (Join-Path (Split-Path -Parent $projectRoot) 'FocusTime_Server')))
    $databasePort = [int](Read-Setting 'DatabasePort' 55432)
    if ($databasePort -notin 1024..65535) { throw '数据库端口配置无效。' }
    $apiUrl = 'http://127.0.0.1:5082'
    $envFile = Join-Path $projectRoot '.env.local'
    if (Test-Path -LiteralPath $envFile) {
        $setting = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^\s*FOCUSTIME_API_TARGET\s*=' } | Select-Object -First 1
        if ($setting) { $apiUrl = (($setting -split '=', 2)[1]).Trim().Trim('"').Trim("'").TrimEnd('/') }
    }
    $apiUri = [Uri]$apiUrl
    if (-not $apiUri.IsLoopback -or $apiUri.Scheme -ne 'http') { throw '本机一键启动要求 .env.local 中的后端为本地 HTTP 地址。' }
    Write-Host '[1/5] 检查本机运行环境…'
    $node = Find-Node
    Write-Host ('Node.js：' + $node)
    Ensure-Dependencies
    Write-Host '[2/5] 前端依赖已就绪，无需手动运行 pnpm。'
    $contentRoot = [IO.Path]::GetFullPath([string](Read-Setting 'ApiContentRoot'))
    $adminFile = [string](Read-Setting 'AdministratorFile')
    if (-not (Test-Path -LiteralPath (Join-Path $contentRoot 'appsettings.json')) -or -not (Test-Path -LiteralPath $adminFile)) { throw '找不到原后端配置或管理员配置，请检查本机启动配置。' }
    $adminId = [Guid]((Get-Content -LiteralPath $adminFile -Raw | ConvertFrom-Json).UserId)
    if ($adminId -eq [Guid]::Empty) { throw '管理员 ID 配置为空。' }
    $passwordFile = [string](Read-Setting 'DatabasePasswordFile' '')
    if ($passwordFile -and (Test-Path -LiteralPath $passwordFile)) {
        $secure = (Get-Content -LiteralPath $passwordFile -Raw).Trim() | ConvertTo-SecureString
        $databasePassword = (New-Object Net.NetworkCredential('', $secure)).Password
    } else {
        $passwordSetting = Get-Content (Join-Path $serverRoot '.env') | Where-Object { $_ -match '^POSTGRES_PASSWORD=' } | Select-Object -First 1
        if (-not $passwordSetting) { throw '未找到已有数据库密码配置。' }
        $databasePassword = (($passwordSetting -split '=', 2)[1]).Trim().Trim('"').Trim("'")
    }
    Write-Host '[3/5] 检查并启动原有 PostgreSQL 数据库…'
    Ensure-Database
    Write-Host '[4/5] 检查并启动 FocusTime_Server…'
    if (-not (Test-Api)) {
        if (Test-Port $apiUri.Port) { throw "后端端口 $($apiUri.Port) 已被占用但未就绪，请先检查已有服务。" }
        $dotnet = Join-Path $serverRoot '.tools\dotnet\dotnet.exe'
        if (-not (Test-Path -LiteralPath $dotnet)) {
            $dotnetCommand = Get-Command dotnet.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($null -eq $dotnetCommand) { throw '找不到 .NET SDK，请安装 .NET 10 SDK 后重新启动。' }
            $dotnet = $dotnetCommand.Source
        }
        $connection = New-Object System.Data.Common.DbConnectionStringBuilder
        $connection['Host'] = '127.0.0.1'; $connection['Port'] = [string]$databasePort
        $connection['Database'] = 'postgres'; $connection['Username'] = 'postgres'; $connection['Password'] = $databasePassword
        $connection['Timeout'] = '3'; $connection['Command Timeout'] = '10'
        $environment = @{ DOTNET_ROOT = (Split-Path -Parent $dotnet); DOTNET_ENVIRONMENT = 'Development'; ASPNETCORE_ENVIRONMENT = 'Development';
            ConnectionStrings__Database = $connection.ConnectionString; Email__Mode = 'Pickup'; Email__PickupDirectory = (Join-Path $contentRoot 'mail');
            AdminOverview__UserIds__0 = $adminId.ToString() }
        $apiBuild = Join-Path $runRoot 'api-build'
        With-Environment $environment {
            $arguments = @('build', (Join-Path $serverRoot 'src\FocusTime.Api\FocusTime.Api.csproj'), '--nologo', '--verbosity', 'minimal', '--output', $apiBuild)
            if (Test-Path (Join-Path $serverRoot 'src\FocusTime.Api\obj\project.assets.json')) { $arguments += '--no-restore' }
            $build = Start-Hidden $dotnet $arguments $serverRoot 'backend-build' -Wait
            if ($build.ExitCode -ne 0) { throw "后端构建失败，请查看 $logRoot\backend-build.log" }
            $backend = Start-Hidden $dotnet @((Join-Path $apiBuild 'FocusTime.Api.dll'), '--contentRoot', $contentRoot, '--urls', $apiUrl) $contentRoot 'backend'
            $state.Backend = Process-Record $backend $dotnet
            Save-State
            $deadline = [DateTime]::UtcNow.AddSeconds(40)
            while (-not (Test-Api)) {
                if ($backend.HasExited) { throw "后端进程已退出，请查看 $logRoot\backend-error.log" }
                if ([DateTime]::UtcNow -gt $deadline) { throw "后端未就绪，请查看 $logRoot\backend.log；确认数据库迁移已完成。" }
                Start-Sleep -Milliseconds 300
            }
        }
        $legacyState = Join-Path $contentRoot 'process.json'
        if (Test-Path -LiteralPath $legacyState) {
            [IO.File]::WriteAllText($legacyState, (@{ Pid = $state.Backend.Pid; Started = [long]$state.Backend.Started; BaseUrl = $apiUrl } | ConvertTo-Json), $utf8)
        }
    } else { Write-Host '后端已运行，复用现有服务。' }
    Write-Host '[5/5] 检查并启动管理后台…'
    if (-not (Test-Frontend)) {
        if (Test-Port 5181) { throw '5181 端口被其他程序占用，未终止任何现有程序。' }
        $frontend = With-Environment @{ FOCUSTIME_API_TARGET = $apiUrl } {
            Start-Hidden $node @((Join-Path $projectRoot 'node_modules\vite\bin\vite.js'), '--host', '127.0.0.1', '--port', '5181', '--strictPort') $projectRoot 'frontend'
        }
        $state.Frontend = Process-Record $frontend $node
        Save-State
        $deadline = [DateTime]::UtcNow.AddSeconds(25)
        while (-not (Test-Frontend)) {
            if ($frontend.HasExited) { throw "前端进程已退出，请查看 $logRoot\frontend-error.log" }
            if ([DateTime]::UtcNow -gt $deadline) { throw "前端启动超时，请查看 $logRoot\frontend.log" }
            Start-Sleep -Milliseconds 250
        }
    } else { Write-Host '前端已运行，复用现有服务。' }
    $proxy = Get-LocalResponse ($webUrl + '/api/v1/admin/session')
    if ($null -eq $proxy -or $proxy.Status -notin @(200, 401, 403)) { throw '前端已启动，但后端代理连接失败，请查看前后端日志。' }
    Save-State
    Write-Host "启动成功：$webUrl/login" -ForegroundColor Green
    Write-Host '以后双击“启动项目.cmd”即可；停止前后端请双击“停止项目.cmd”。'
    if (-not $NoBrowser) { Start-Process ($webUrl + '/login') }
} catch {
    Write-Host ('启动/停止失败：' + $_.Exception.Message) -ForegroundColor Red
    Write-Host ('日志目录：' + $logRoot)
    exit 1
} finally {
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
