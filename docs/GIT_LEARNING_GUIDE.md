# Git Learning Guide

This guide explains Git from basic to advanced using this repo as the example.

## 1. Mental Model

Git has three main places:

```text
working tree  -> files you edit
staging area  -> files selected for the next commit
repository    -> saved commits
```

GitHub is separate. Your local repo can be connected to GitHub through a remote named `origin`.

```text
local main <-> origin/main on GitHub
```

## 2. Daily Commands

Check what changed:

```bash
git status
git status --short --branchs
```

See file changes:

```bash
git diff
git diff README.md
```

Stage files for commit:

```bash
git add README.md
git add docs/GIT_LEARNING_GUIDE.md
```

Commit staged files:

```bash
git commit -m "Explain Git workflow"
```

Commit many files at once:

```bash

```



Push local commits to GitHub:

```bash
git push
```

Download new GitHub commits:

```bash
git fetch origin
```

Download and merge GitHub commits into your current branch:

```bash
git pull
```

## 3. Review Before Commit

Always check these before committing:

```bash
git status --short
git diff
git diff --cached
```

`git diff` shows unstaged changes.

`git diff --cached` shows what will go into the commit.

If you staged the wrong file:

```bash
git restore --staged path/to/file
```

Example:

```bash
git restore --staged node_modules/.vite/deps/_metadata.json
```

## 4. Files You Usually Should Not Commit

Generated dependency/cache files usually should not be committed:

```text
node_modules/
node_modules/.vite/
dist/
.env
```

Good files to commit:

```text
src/
docs/
README.md
package.json
pnpm-lock.yaml
vite.config.ts
supabase/
```

## 5. Check Remote Connection

See where your repo is connected:

```bash
git remote -v
```

For this repo, the remote is:

```text
origin https://github.com/stiffler56/HustleDashboard.git
```

Check your current branch:

```bash
git branch --show-current
```

Check tracking and ahead/behind state:

```bash
git status --short --branch
git branch -vv
```

## 6. Ahead and Behind

Example:

```text
main...origin/main [ahead 28, behind 2]
```

This means:

- `ahead 28`: you have 28 local commits not on GitHub.
- `behind 2`: GitHub has 2 commits not in your local branch.

A normal fix is:

```bash
git pull
git push
```

But if Git says the histories are unrelated, do not force push without understanding the situation.

## 7. Divergent or Unrelated Histories

You may see errors like:

```text
fatal: refusing to merge unrelated histories
```

This happens when local Git and GitHub look like two separate projects.

Possible fixes:

### Option A: Merge Once

Use this when you want to combine both histories:

```bash
git pull origin main --allow-unrelated-histories
```

Then fix conflicts, stage resolved files, and commit:

```bash
git status
git add resolved-file
git commit
```

### Option B: Push to a New Branch

Use this when you want safety and review on GitHub:

```bash
git switch -c sync-local-work
git push -u origin sync-local-work
```

Then open a pull request on GitHub.

### Option C: Force Push

This overwrites GitHub branch history:

```bash
git push --force-with-lease
```

Only use this if you are sure GitHub should be replaced by your local branch.

Do not use plain `git push --force` unless you know exactly why.

## 8. Common Error: Dubious Ownership

Error:

```text
fatal: detected dubious ownership in repository
```

Fix:

```bash
git config --global --add safe.directory "C:/Users/csame/Videos/the project 01/HustleDashboard"
```

This tells Git the folder is trusted.

## 9. Common Error: Permission Denied in .git

Error:

```text
cannot open '.git/FETCH_HEAD': Permission denied
```

This means Git could not write internal fetch data. Common causes:

- another app is locking files
- permissions are restricted
- sandbox/tool permissions block `.git` writes

Try closing editors or terminals using the repo, then run:

```bash
git fetch origin
```

## 10. Conflict Basics

When Git cannot combine changes automatically, it marks files as conflicted.

Check conflicts:

```bash
git status
```

Open the conflicted file and look for:

```text
<<<<<<< HEAD
your local version
=======
incoming version
>>>>>>> origin/main
```

Edit the file so only the final wanted version remains. Then:

```bash
git add conflicted-file
git commit
```

## 11. Undo Safely

Unstage a file:

```bash
git restore --staged file
```

Discard local edits in one file:

```bash
git restore file
```

See recent commits:

```bash
git log --oneline -10
```

Undo the last commit but keep the file changes:

```bash
git reset --soft HEAD~1
```

Do not use this casually:

```bash
git reset --hard
```

It deletes uncommitted work.

## 12. Recommended Workflow

Use this loop for normal work:

```bash
git status --short --branch
git fetch origin
git diff
git add files-you-want
git diff --cached
git commit -m "Clear commit message"
git status --short --branch
```

If the branch is clean and not behind:

```bash
git push
```

If the branch is behind:

```bash
git pull
git push
```

If Git reports unrelated histories, stop and decide whether to merge once, push a new branch, or replace the GitHub branch.

## 13. Your Current Repo Situation

At the time this guide was written:

```text
origin = https://github.com/stiffler56/HustleDashboard.git
main tracks origin/main
local main is ahead of GitHub
GitHub main also has separate commits
```

The safest next sync option is usually:

```bash
git switch -c sync-local-work
git push -u origin sync-local-work
```

Then review the branch on GitHub before changing `main`.
