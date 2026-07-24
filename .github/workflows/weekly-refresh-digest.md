---
name: Build Weekly Refresh Digest Preview
description: Deterministically assembles staged quest reports into parent and child issue previews
on:
  workflow_call:
    inputs:
      week_key:
        description: ISO week key for this reporting run
        required: true
        type: string
      prior_week_key:
        description: ISO week key used to locate prior findings
        required: true
        type: string
permissions:
  actions: read
  contents: read
  copilot-requests: write
strict: true
network: {}
tools:
  bash:
    - "cat /tmp/gh-aw/agent/weekly-refresh-preview/*"
    - "find /tmp/gh-aw/agent/weekly-refresh-preview *"
    - "jq * /tmp/gh-aw/agent/weekly-refresh-preview/*"
    - "wc * /tmp/gh-aw/agent/weekly-refresh-preview/*"
steps:
  - name: Download staged quest reports
    continue-on-error: true
    uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
    with:
      pattern: weekly-refresh-${{ inputs.week_key }}-*
      path: /tmp/gh-aw/agent/weekly-refresh-reports
      merge-multiple: true
  - name: Build deterministic digest preview
    run: |
      node scripts/weekly-refresh-report.mjs digest \
        --reports-dir /tmp/gh-aw/agent/weekly-refresh-reports \
        --output-dir /tmp/gh-aw/agent/weekly-refresh-preview \
        --week "${{ inputs.week_key }}" \
        --prior-week "${{ inputs.prior_week_key }}"
  - name: Upload staged digest preview
    uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
    with:
      name: weekly-refresh-${{ inputs.week_key }}-preview
      path: /tmp/gh-aw/agent/weekly-refresh-preview
      if-no-files-found: error
      retention-days: 30
safe-outputs:
  activation-comments: false
  missing-data: false
  missing-tool: false
  noop: false
  report-failure-as-issue: false
  report-incomplete: false
  staged: true
  threat-detection: false
timeout-minutes: 10
---

# Phase 2A Weekly Refresh Digest Audit

Audit the deterministic preview for `${{ inputs.week_key }}` without changing it.

1. Read `/tmp/gh-aw/agent/weekly-refresh-preview/digest.json`.
2. Confirm it contains exactly five quest results and that every result is
   `material-change`, `no-material-change`, or `blocked`.
3. Confirm `parent-issue.md` covers all five quests.
4. Confirm a child preview exists only for each material-change result.
5. Report any missing, malformed, or inconsistent preview as blocked.

Return a concise GitHub-flavored Markdown audit starting nested headings at
`###`. Do not create or update issues, comments, branches, pull requests,
workflows, or repository content.
