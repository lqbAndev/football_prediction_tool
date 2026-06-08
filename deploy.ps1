$ProjectRoot   = "e:\Study\vibe-antigravity\football_prediction_tool"
$BranchName    = "feature/epl-bestxi-curious-stats"
$CommitMessage = "feat: EPL Best XI, Curious Stats, Vercel Deploy (v3.1.0)"

$env:GIT_PAGER = ""

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}
function Fail($step) {
  Write-Host "[FAIL] $step (exit $LASTEXITCODE)" -ForegroundColor Red
  Restore-App
  exit 1
}
function OK($label) { Write-Host "[OK]   $label" -ForegroundColor Green }

$appDev  = Join-Path $ProjectRoot "src\App.tsx"
$appProd = Join-Path $ProjectRoot "src\App.prod.tsx"
$appBak  = Join-Path $ProjectRoot "src\App.dev.tsx"

function Restore-App {
  if (Test-Path $appBak) {
    Copy-Item $appBak $appDev -Force
    Remove-Item $appBak -Force
    Write-Host "[RESTORE] App.tsx restored to dev version" -ForegroundColor Yellow
  }
}

Set-Location $ProjectRoot
Write-Host "Project: $ProjectRoot" -ForegroundColor DarkGray

# -----------------------------------------------
# 0. Swap App.tsx with production version
#    App.prod.tsx has NO testCup import / route
# -----------------------------------------------
Write-Step "0/6  Swap App.tsx to production version"

Copy-Item $appDev $appBak -Force
Copy-Item $appProd $appDev -Force
OK "App.tsx swapped to App.prod.tsx (no testCup references)"

# -----------------------------------------------
# 1. Create feature branch
# -----------------------------------------------
Write-Step "1/6  Create feature branch ($BranchName)"
git checkout -b $BranchName 2>$null
if ($LASTEXITCODE -ne 0) {
  git checkout $BranchName
  if ($LASTEXITCODE -ne 0) { Fail "git checkout $BranchName" }
}
OK "on branch $BranchName"

# -----------------------------------------------
# 2. Stage and commit
#    .gitignore excludes: testCup/, *.local-backup, App.dev.tsx
# -----------------------------------------------
Write-Step "2/6  Stage and commit"

git add src/ public/ index.html package.json package-lock.json vite.config.ts tailwind.config.ts postcss.config.js tsconfig.json tsconfig.node.json .gitignore README.md
git add -f project_updates/ deploy.ps1 scripts/

git diff --cached --name-only

$changedFiles = git diff --cached --name-only
if (-not $changedFiles) {
  Write-Host "     Nothing new to commit." -ForegroundColor Yellow
} else {
  git commit -m $CommitMessage
  if ($LASTEXITCODE -ne 0) { Fail "git commit" }
  OK "committed"
}

# -----------------------------------------------
# 3. Checkout main and merge
# -----------------------------------------------
Write-Step "3/6  Checkout main and merge"
git checkout main
if ($LASTEXITCODE -ne 0) { Fail "git checkout main" }

git fetch origin main
git merge origin/main --no-edit

git merge $BranchName --no-edit
if ($LASTEXITCODE -ne 0) { Fail "git merge $BranchName" }
OK "merged $BranchName into main"

# -----------------------------------------------
# 4. Push main (Vercel auto-deploys from main)
# -----------------------------------------------
Write-Step "4/6  Push main"
git push origin main
if ($LASTEXITCODE -ne 0) { Fail "git push origin main" }
OK "pushed main - Vercel will auto-build and deploy"

# -----------------------------------------------
# 5. Restore dev App.tsx
# -----------------------------------------------
Write-Step "5/6  Restore App.tsx to dev version"
Restore-App

# -----------------------------------------------
# 6. Cleanup branch
# -----------------------------------------------
Write-Step "6/6  Cleanup"
git branch -d $BranchName 2>$null
OK "cleaned up feature branch"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Done! Pushed to main." -ForegroundColor Green
Write-Host "  Vercel CD will auto-detect and deploy." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
git log --oneline -5
