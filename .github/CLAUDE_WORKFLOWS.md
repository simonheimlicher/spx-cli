# Claude Code GitHub Workflows Configuration

This repository uses two GitHub Actions workflows to integrate Claude Code:

1. **`claude.yml`** - Interactive Claude assistant triggered by `@claude` mentions
2. **`claude-code-review.yml`** - Automatic code review on pull requests

## Security

Both workflows include authorization checks to prevent unauthorized access to the `CLAUDE_CODE_OAUTH_TOKEN`. Only trusted contributors can trigger Claude workflows.

## Configuration Variables

Configure these workflows via **Settings → Secrets and variables → Actions → Variables** in your repository.

### Shared Security Settings

#### `CLAUDE_AUTHORIZED_ROLES` (claude.yml)

- **Type:** JSON array
- **Default:** `["OWNER", "MEMBER", "COLLABORATOR"]`
- **Description:** GitHub author associations allowed to trigger `@claude` mentions
- **Example:** `["OWNER", "MEMBER"]` (restrict to owners and members only)
- **Security:** This is the primary security control. Only change if you understand the implications.

#### `CLAUDE_REVIEW_AUTHORIZED_ROLES` (claude-code-review.yml)

- **Type:** JSON array
- **Default:** `["OWNER", "MEMBER", "COLLABORATOR"]`
- **Description:** GitHub author associations allowed to trigger auto-reviews
- **Example:** `["OWNER"]` (only repository owners)

### Claude Assistant Settings (claude.yml)

#### `CLAUDE_MENTION_TRIGGER`

- **Type:** String
- **Default:** `@claude`
- **Description:** Text that triggers the Claude workflow
- **Example:** `@bot`, `@ai`, or any custom trigger word

#### `CLAUDE_CONCURRENCY_CANCEL`

- **Type:** String (boolean)
- **Default:** `false`
- **Description:** Whether to cancel in-progress Claude runs when new mention arrives
- **Values:** `true` or `false`
- **Use case:** Set to `true` if you want latest request to cancel previous ones

#### `CLAUDE_CUSTOM_PROMPT`

- **Type:** String (multiline supported)
- **Default:** Empty (Claude follows instructions from the comment)
- **Description:** Override default behavior with a custom prompt
- **Example:**
  ```
  You are a helpful code assistant. Always:
  - Reference CLAUDE.md for project standards
  - Run validation before committing
  - Be concise in responses
  ```

#### `CLAUDE_ALLOWED_TOOLS`

- **Type:** String
- **Default:** Empty (unrestricted access)
- **Description:** Restrict which tools Claude can use
- **Example:** `--allowed-tools "Bash(gh pr:*),Read,Edit"`
- **Security:** Restrict to specific commands to limit what Claude can do
- **See:** [Claude Code tool documentation](https://code.claude.com/docs/en/cli-reference)

### Code Review Settings (claude-code-review.yml)

#### `CLAUDE_REVIEW_CONCURRENCY_CANCEL`

- **Type:** String (boolean)
- **Default:** `false`
- **Description:** Whether to cancel in-progress reviews on new PR updates
- **Values:** `true` or `false`
- **Use case:** Set to `true` to cancel old review when PR is updated

#### `CLAUDE_REVIEW_CUSTOM_PROMPT`

- **Type:** String (multiline supported)
- **Default:** Pre-configured review prompt (see workflow file)
- **Description:** Custom review instructions for Claude
- **Example:**
  ```
  Review this PR focusing on:
  - TypeScript type safety
  - Test coverage for new features
  - Security vulnerabilities

  Reference CLAUDE.md for coding standards.
  Use gh pr comment to post your review.
  ```

#### `CLAUDE_REVIEW_ALLOWED_TOOLS`

- **Type:** String
- **Default:** `--allowed-tools "Bash(gh issue view:*),Bash(gh search:*),Bash(gh issue list:*),Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Bash(gh pr list:*)"`
- **Description:** Restrict which tools Claude can use during reviews
- **Security:** Default restricts to read-only gh commands + commenting
- **Example:** To make read-only: Remove `Bash(gh pr comment:*)` from the list

## Configuration Examples

### Example 1: Restrict to Repository Owners Only

```
CLAUDE_AUTHORIZED_ROLES = ["OWNER"]
CLAUDE_REVIEW_AUTHORIZED_ROLES = ["OWNER"]
```

### Example 2: Use Custom Trigger Word

```
CLAUDE_MENTION_TRIGGER = @bot
```

### Example 3: Cancel In-Progress Runs

```
CLAUDE_CONCURRENCY_CANCEL = true
CLAUDE_REVIEW_CONCURRENCY_CANCEL = true
```

### Example 4: Restrict Claude Tools (High Security)

```
CLAUDE_ALLOWED_TOOLS = --allowed-tools "Read,Grep,Glob,Bash(gh pr:*)"
CLAUDE_REVIEW_ALLOWED_TOOLS = --allowed-tools "Read,Grep,Glob,Bash(gh pr view:*),Bash(gh pr diff:*)"
```

### Example 5: Custom Review Prompt

```
CLAUDE_REVIEW_CUSTOM_PROMPT =
REPO: ${{ github.repository }}
PR NUMBER: ${{ github.event.pull_request.number }}

Focus your review on:
1. Code matches docs/code/typescript.md standards
2. All changes have test coverage
3. No security vulnerabilities (SQL injection, XSS, etc.)
4. Performance implications

Reference CLAUDE.md for full project context.
Post review using: gh pr comment $PR_NUMBER --body "..."
```

## How to Set Variables

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click the **Variables** tab
4. Click **New repository variable**
5. Enter the variable name (e.g., `CLAUDE_AUTHORIZED_ROLES`)
6. Enter the value
7. Click **Add variable**

## Testing Configuration Changes

After changing variables, test by:

1. **For `claude.yml`:** Create a test issue or PR and mention your trigger word (e.g., `@claude`)
2. **For `claude-code-review.yml`:** Open a new PR or push to an existing PR

Check the **Actions** tab to see if workflows triggered correctly.

## Security Best Practices

1. **Always configure `CLAUDE_AUTHORIZED_ROLES`** - Never allow `CONTRIBUTOR` or `FIRST_TIME_CONTRIBUTOR`
2. **Restrict `CLAUDE_ALLOWED_TOOLS`** - Only give Claude the tools it needs
3. **Review workflow logs** - Periodically check Actions logs for suspicious activity
4. **Rotate tokens** - If you suspect token compromise, regenerate `CLAUDE_CODE_OAUTH_TOKEN`
5. **Use concurrency controls** - Prevents workflow spam attacks

## Troubleshooting

### Claude isn't responding to mentions

- Check that your GitHub author association matches `CLAUDE_AUTHORIZED_ROLES`
- Verify the trigger word matches `CLAUDE_MENTION_TRIGGER`
- Check workflow logs in the Actions tab for errors

### Reviews aren't running automatically

- Confirm PR author's association matches `CLAUDE_REVIEW_AUTHORIZED_ROLES`
- Check if workflow is enabled in **Settings → Actions**
- Look for workflow runs in the Actions tab

### "Unrecognized named-value" warnings in IDE

These are expected linter warnings. Variables are resolved at runtime by GitHub Actions.

## Additional Resources

- [Claude Code Documentation](https://code.claude.com/docs)
- [GitHub Actions Variables](https://docs.github.com/en/actions/learn-github-actions/variables)
- [GitHub author_association values](https://docs.github.com/en/graphql/reference/enums#commentauthorassociation)
