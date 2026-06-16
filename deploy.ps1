param(
  [string]$BranchName = "feature/v3.4-mobile-motm-liveresults",
  [string]$CommitMessage = "feat: v3.4.0 - Mobile responsive, MOTM fix, Live Results and Web Scraper"
)

$ProjectRoot   = $PSScriptRoot
$env:GIT_PAGER = ""

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}
function Fail($step) {
  Write-Host "[FAIL] $step (exit $LASTEXITCODE)" -ForegroundColor Red
  exit 1
}
function OK($label) { Write-Host "[OK]   $label" -ForegroundColor Green }

Set-Location $ProjectRoot
Write-Host "Project: $ProjectRoot" -ForegroundColor DarkGray

# -----------------------------------------------
# 1. Create/Checkout feature branch
# -----------------------------------------------
Write-Step "1/5 Create/Checkout feature branch ($BranchName)"
git checkout -b $BranchName 2>$null
if ($LASTEXITCODE -ne 0) {
  git checkout $BranchName
  if ($LASTEXITCODE -ne 0) { Fail "git checkout $BranchName" }
}
OK "On branch $BranchName"

# -----------------------------------------------
# 2. Stage and commit
# -----------------------------------------------
Write-Step "2/5 Stage and commit changes"
git add .
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
  Write-Host "     Nothing new to commit or commit failed." -ForegroundColor Yellow
} else {
  OK "Committed: $CommitMessage"
}

# -----------------------------------------------
# 3. Checkout main and pull latest
# -----------------------------------------------
Write-Step "3/5 Checkout main and pull"
git checkout main
if ($LASTEXITCODE -ne 0) { Fail "git checkout main" }
git pull origin main

# -----------------------------------------------
# 4. Merge feature branch into main
# -----------------------------------------------
Write-Step "4/5 Merge $BranchName into main"
git merge $BranchName --no-edit
if ($LASTEXITCODE -ne 0) { Fail "git merge $BranchName" }
OK "Merged $BranchName into main"

# -----------------------------------------------
# 5. Push main to origin (Vercel CD triggers auto-deploy)
# -----------------------------------------------
Write-Step "5/5 Push main to origin"
git push origin main
if ($LASTEXITCODE -ne 0) { Fail "git push origin main" }
OK "Pushed main successfully. Vercel will auto-build and deploy!"

# Clean up local feature branch
git branch -d $BranchName 2>$null
OK "Cleaned up local feature branch $BranchName"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Done! Successfully deployed to Vercel." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
git log --oneline -5
