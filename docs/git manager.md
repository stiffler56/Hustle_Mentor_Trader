# Git Manager & Branching Mastery Guide

This guide breaks down the real mistakes that broke your repository builds, followed by a complete practical lesson on how to manage, test, merge, pull, and resolve conflicts like a senior developer.

---

## Part 1: Post-Mortem — Mistakes Made in This Repository

### 1. Popping Stashes Across Divergent Branches
* **What happened:** You saved changes on one branch using `git stash`, switched to an entirely different branch (`trade-copier`), and ran `git stash pop`.
* **Why it broke:** Stashes capture uncommitted diffs relative to a specific commit. When applied onto a branch with a completely different file structure, Git cannot cleanly guess which lines belong where. It injected merge conflict markers directly into `src/app/components/Layout.tsx` and `src/app/routes.tsx`.
* **Rule:** Never use `git stash` to move code between branches that have diverged. Use dedicated feature branches, `git merge`, or `git cherry-pick`.

---

### 2. Ignoring Conflict Markers (`<<<<<<<`, `=======`, `>>>>>>>`)
* **What happened:** When Git fails an automatic merge or stash pop, it writes literal text conflict markers into your source files:
  ```tsx
  <<<<<<< Updated upstream
    { to: '/accounts', label: 'Accounts', icon: Building2 },
  =======
    { to: '/accounts', label: 'Accounts', icon: Layers },
  >>>>>>> Stashed changes
  ```
* **Why it broke:** Vite and TypeScript treat `<<<<<<<` as invalid syntax (`Unexpected "<<"`), immediately crashing both production builds and the dev server.
* **Rule:** An unmerged file is not usable code. You must open the file, search for `<<<<<<<`, decide which code stays or combine both, delete the markers, and test immediately.

---

### 3. Asymmetric File Deletions (Ghost Imports)
* **What happened:** `src/app/pages/AdvancedAnalytics.tsx` was deleted on `main`, but `trade-copier` or your stash was still attempting to `import AdvancedAnalytics from './pages/AdvancedAnalytics'`.
* **Why it broke:** Even if conflict markers are gone, Vite fails if an import points to a non-existent file path on disk.
* **Rule:** Whenever deleting a page or utility, trace all references across the repo (`grep` or IDE find) and replace obsolete routes with redirects (`loader: () => redirect('/analytics')`).

---

### 4. Not Running Build Verification Before Staging
* **What happened:** Conflicts and broken imports went unnoticed until runtime or CI failed.
* **Rule:** Never stage or commit code without running `npm run build`. If the build fails, the code cannot be shipped.

---

### 5. Dangling Upstream Remote Tracking
* **What happened:** `git status` warned: `Your branch is based on 'origin/trade-copier', but the upstream is gone.`
* **Why it happened:** The remote branch on GitHub was deleted or merged into PR, but local Git still tried tracking it.
* **Fix:** `git branch --unset-upstream` or delete the local branch if work is merged.

---

## Part 2: Step-by-Step Git Management Workflow

```
[origin/main] ───────► (git pull) ───────► [local main]
                                               │
                                       (git checkout -b feat/xxx)
                                               │
                                               ▼
                                      [feature branch]
                                               │ (code + npm run build)
                                               ▼
                                        (git commit)
                                               │
                         (git fetch origin && git merge origin/main)
                                               │
                                        (verify build)
                                               │
                                               ▼
                                      (git push to GitHub)
```

---

### Step 1: Start Fresh (Pull Remote Changes)
Always start any new task by pulling the latest clean code from `main`:

```bash
# 1. Switch to main
git checkout main

# 2. Fetch all changes from remote
git fetch origin

# 3. Pull clean changes without messy merge commits
git pull --ff-only origin main
```

---

### Step 2: Create an Isolated Branch
Never write code directly on `main`:

```bash
# Format: feat/<name>, fix/<name>, refactor/<name>
git checkout -b feat/trade-copier
```

---

### Step 3: Write Code, Stage Carefully, and Test
Do not run `git add .` blindly. Check what changed:

```bash
# Check modified files
git status

# Inspect the exact lines you changed
git diff

# Run production build to guarantee syntax, types, and imports work
npm run build
```

Only stage when `npm run build` exits with code 0 (clean build):

```bash
git add src/app/components/Layout.tsx src/app/routes.tsx
git commit -m "feat(routes): register trade copier and add redirects"
```

---

### Step 4: Keep Branch Updated with Main (Prevent Merge Debt)
If others pushed to `main` while you worked, merge `main` into your feature branch before opening a PR:

```bash
# 1. Fetch remote updates
git fetch origin

# 2. Merge origin/main into your current branch
git merge origin/main
```

If conflicts occur:
1. Run `git status` to see `Unmerged paths:`.
2. Open each unmerged file.
3. Search for `<<<<<<<` and resolve each section.
4. Run `npm run build`.
5. Stage the resolved files: `git add <file>`.
6. Complete the merge commit: `git commit`.

---

### Step 5: Clean Up Local Branches
After a feature is merged to GitHub:

```bash
# Switch to main
git checkout main
git pull origin main

# Delete merged local branch
git branch -d feat/trade-copier

# Prune stale tracking references
git remote prune origin
```

---

## Part 3: Emergency Troubleshooting Cheat-Sheet

| Problem | Root Cause | Command to Fix |
| :--- | :--- | :--- |
| `Unexpected "<<"` in build | Merge conflict markers left in file | Grep `<<<<<<<`, edit file, remove markers, run `npm run build` |
| Merge went wrong, want to cancel | Mid-merge conflict state | `git merge --abort` |
| Stash pop created conflicts | Stashed changes conflicted with current branch | Fix files, or run `git reset --merge` to cancel stash pop |
| Accidentally modified wrong file | Unstaged unwanted edits | `git restore <file>` |
| Staged file accidentally | Staged wrong file | `git restore --staged <file>` |
| Check if any conflict markers exist | Automated repo scan | `git diff --check` |
| Upstream branch deleted on GitHub | Local still tracks dead remote branch | `git branch --unset-upstream` |
