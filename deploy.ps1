$ProjectRoot   = "e:\Study\vibe-antigravity\WC26_prediction_tool"
$FeatureBranch = "feature/scenarios-and-penalty"
$CommitMessage = "feat: outcome-first scenario engine + flat-72% penalty`n`nYEU CAU 1 - Scenario Engine (Outcome-First):`n  - Standard: purely random, no rating bias.`n  - Favorites: 80% strong-wins, 10% draw, 10% weak-wins.`n  - Underdogs: 60% weak-wins, 20% draw, 20% strong-wins.`n  - Scenario notification banner added to UI.`n`nYEU CAU 2 - Penalty Shootout:`n  - Removed rating-based conversion rate.`n  - Fixed 72% conversion for all kicks (no bias).`n  - Fallback uses pure coin flip (Math.random() < 0.5)."

$FilesToStage = @(
  "src/utils/random.ts",
  "src/App.tsx"
)

# ── Helpers ────────────────────────────────────────────────
function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}
function Fail($step) {
  Write-Host ""
  Write-Host "[FAIL] $step (exit $LASTEXITCODE)" -ForegroundColor Red
  exit 1
}
function OK($label) { Write-Host "[OK]   $label" -ForegroundColor Green }

# ── Start ──────────────────────────────────────────────────
Set-Location $ProjectRoot
Write-Host "Project : $ProjectRoot" -ForegroundColor DarkGray
Write-Host "Branch  : $FeatureBranch" -ForegroundColor DarkGray

# 1. Create / switch to feature branch
Write-Step "1/6  Checkout feature branch: $FeatureBranch"
$current = (git rev-parse --abbrev-ref HEAD).Trim()
if ($current -eq $FeatureBranch) {
  Write-Host "     Already on $FeatureBranch" -ForegroundColor DarkGray
} else {
  git checkout -b $FeatureBranch 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    git checkout $FeatureBranch
    if ($LASTEXITCODE -ne 0) { Fail "checkout $FeatureBranch" }
  }
}
OK "on branch $FeatureBranch"

# 2. Stage source files
Write-Step "2/6  Staging files"
$staged = 0
foreach ($f in $FilesToStage) {
  if (Test-Path $f) {
    git add $f
    Write-Host "     + $f" -ForegroundColor DarkGray
    $staged++
  } else {
    Write-Host "     ~ skip (not found): $f" -ForegroundColor DarkYellow
  }
}
git diff --cached --stat
OK "$staged file(s) staged"

# 3. Commit
Write-Step "3/6  Commit"
$changedFiles = git diff --cached --name-only
if (-not $changedFiles) {
  Write-Host "     Nothing to commit - working tree already clean." -ForegroundColor Yellow
} else {
  git commit -m $CommitMessage
  if ($LASTEXITCODE -ne 0) { Fail "git commit" }
  OK "committed"
}

# 4. Push feature branch
Write-Step "4/6  Push $FeatureBranch"
git push origin $FeatureBranch --set-upstream
if ($LASTEXITCODE -ne 0) { Fail "git push $FeatureBranch" }
OK "pushed $FeatureBranch"

# 5. Merge into main and push
Write-Step "5/6  Merge into main"
git checkout main
if ($LASTEXITCODE -ne 0) { Fail "git checkout main" }
git pull --rebase --autostash origin main
if ($LASTEXITCODE -ne 0) { Fail "git pull --rebase origin main" }
git merge $FeatureBranch --no-ff -m "merge: $FeatureBranch into main"
if ($LASTEXITCODE -ne 0) { Fail "git merge" }
git push origin main
if ($LASTEXITCODE -ne 0) { Fail "git push main" }
OK "main updated and pushed"

# 6. Deploy to GitHub Pages
Write-Step "6/6  Deploy to GitHub Pages"
npm run deploy
if ($LASTEXITCODE -ne 0) { Fail "npm run deploy" }
OK "Deployed to GitHub Pages"

# Done
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Workflow complete!" -ForegroundColor Green
Write-Host "  Branch: $FeatureBranch -> main -> deploy" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
git log --oneline -6
