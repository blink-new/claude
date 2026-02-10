# Compact Chat — Conversation Compaction Skill

Save a structured compaction of the current conversation to disk for future reference and context continuity.

## When to Use

- At the end of a long coding session to preserve context
- When switching between tasks/branches and want to resume later
- When the user asks to "save", "compact", or "summarize" the chat
- Before closing a conversation that contains important decisions or progress

## Output Location

Save the compaction to the **project root**:

```
.chats/[chat-name]_[ISO-timestamp].md
```

- **chat-name**: Short kebab-case name derived from the primary topic (e.g. `fix-auth-bug`, `add-billing-flow`, `refactor-sidebar`)
- **ISO-timestamp**: Current local device time in format `YYYY-MM-DDTHH-MM-SS` (use hyphens instead of colons for filesystem safety)
- **Timezone**: Use the user's local timezone, not UTC

Example: `.chats/add-team-workspaces_2026-02-10T14-30-00.md`

Create the `.chats/` directory if it doesn't exist.

## Compaction Format

Generate the compaction using this EXACT prompt structure. Fill ALL 9 sections — do not skip any.

```markdown
# [Chat Name]
> Compacted: [ISO timestamp with timezone]
> Project: [project name from root folder]

## Summary

### 1. Primary Request and Intent
[What the user wants to achieve - be specific about their goal, preferences stated, and any constraints mentioned. This is the MOST IMPORTANT section.]

### 2. Key Technical Concepts
[List technical terms and project-specific concepts with brief definitions. Format each as: **Term**: Definition. Include framework names, libraries, patterns discussed.]

### 3. Files and Code Sections
[List ALL files mentioned, created, modified, or read. Format: **path/to/file.ext**: Brief description of what was done or why it's important. This section is CRITICAL - do not omit any file paths.]

### 4. Errors and Fixes
[List any errors encountered and how they were resolved. Format: **Error description**: How it was fixed. Write "None encountered." if no errors.]

### 5. Problem Solving
[Describe the problem-solving approach taken, including reasoning for key decisions. What problems were identified? What solutions were considered?]

### 6. All User Messages
[List EVERY user message in chronological order. Quote important ones directly. Summarize routine ones. This is CRITICAL for preserving user intent and instructions.]

### 7. Pending Tasks
[List tasks that are NOT yet complete. Be specific about what remains. Write "None - all tasks completed." if everything is done.]

### 8. Current Work
[Describe what was being worked on immediately before this summary. What is the current state? What was the last action taken?]

### 9. Optional Next Step
[Suggest what the agent should do next based on the conversation. What is the logical continuation?]
```

## Rules

- Fill ALL 9 sections - do not skip any
- Put MOST IMPORTANT information FIRST within each section
- Be thorough on sections 3 (Files) and 6 (User messages) - these are critical
- Use bullet points for lists
- Keep definitions concise but complete
- Quote user preferences and instructions exactly when stated
- Include exact file paths, function names, IDs, endpoints, and config keys verbatim
- Facts only; if unknown, omit
- Deduplicate repeated info

## Supplementary: Project Memory Block

If the conversation is very long (50+ messages), append a **Project Memory** block after the 9 sections for quick machine-readable context:

```markdown
---

## Project Memory

PROJECT_STATE:
- <facts about what exists/works right now>

USER_INTENT:
- <current user goal(s) + constraints/preferences>

DECISIONS_AND_RATIONALE:
- <key decisions made + why>

FILES_AND_CODE_TOUCHPOINTS:
- <path> :: <what changed / what matters>

COMMANDS_AND_OUTPUTS:
- <command> :: <result (short)>

ERRORS_AND_FIXES:
- <error> :: <fix>

OPEN_ITEMS:
- <next steps / unresolved blockers>
```

Rules for Project Memory:
- Prefer exact file paths, function names, IDs, endpoints, and config keys
- Deduplicate repeated info (history may contain overlap)
- Facts only; if unknown, omit
- Keep bullets short and dense

## Execution Steps

1. Determine the primary topic of the conversation → derive `chat-name` (kebab-case, max 5 words)
2. Get current local time → format as `YYYY-MM-DDTHH-MM-SS`
3. Create `.chats/` directory in project root if it doesn't exist
4. Generate the compaction following the exact format above
5. Write to `.chats/[chat-name]_[timestamp].md`
6. Confirm the file was saved with the full path
