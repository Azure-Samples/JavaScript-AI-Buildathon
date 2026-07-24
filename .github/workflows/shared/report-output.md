---
import-schema:
  quest-id:
    type: number
    required: true
  quest-slug:
    type: string
    required: true
  quest-title:
    type: string
    required: true
  quest-label:
    type: string
    required: true
safe-outputs:
  jobs:
    emit-weekly-report:
      description: Materialize one validated staged weekly quest report artifact
      runs-on: ubuntu-latest
      needs: agent
      if: always()
      output: The structured weekly quest report artifact was prepared
      permissions:
        contents: read
      inputs:
        result:
          description: The exact discovery result
          required: true
          type: choice
          options:
            - material-change
            - no-material-change
            - blocked
        report_json:
          description: A JSON string matching the weekly quest report contract
          required: true
          type: string
      steps:
        - name: Checkout repository
          uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        - name: Materialize structured quest report
          env:
            EXPECTED_PRIOR_WEEK_KEY: ${{ inputs.prior_week_key }}
            EXPECTED_QUEST_SLUG: ${{ github.aw.import-inputs.quest-slug }}
            EXPECTED_WEEK_KEY: ${{ inputs.week_key }}
          run: |
            node scripts/weekly-refresh-report.mjs materialize \
              --agent-output "$GH_AW_AGENT_OUTPUT" \
              --output "/tmp/weekly-refresh/${EXPECTED_QUEST_SLUG}.json" \
              --week "$EXPECTED_WEEK_KEY" \
              --prior-week "$EXPECTED_PRIOR_WEEK_KEY" \
              --quest "$EXPECTED_QUEST_SLUG"
        - name: Upload structured quest report
          if: always()
          uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
          with:
            name: weekly-refresh-${{ inputs.week_key }}-${{ github.aw.import-inputs.quest-slug }}
            path: /tmp/weekly-refresh/${{ github.aw.import-inputs.quest-slug }}.json
            if-no-files-found: error
            retention-days: 30
---

Apply this staged weekly reporting contract for quest
`${{ github.aw.import-inputs.quest-slug }}`:

- Quest identity is `${{ github.aw.import-inputs.quest-id }}`,
  `${{ github.aw.import-inputs.quest-title }}`, and
  `${{ github.aw.import-inputs.quest-label }}`.
- The reporting week is `${{ inputs.week_key }}` and the prior report locator is
  `weekly-refresh:${{ inputs.prior_week_key }}:${{ github.aw.import-inputs.quest-slug }}`.
- Compare current allowed-source evidence, current Buildathon content, and any
  prior finding keys available from the exact prior locator. Never broaden the
  search to unrelated issues or repositories.
- Call `emit_weekly_report` exactly once, including blocked runs. The `result`
  argument and `report_json.result` must match.
- Do not write a report file yourself. The deterministic safe-output job validates
  the JSON and creates the run-scoped artifact.

The `report_json` value must encode exactly this version 1 shape:

```json
{
  "schemaVersion": 1,
  "weekKey": "${{ inputs.week_key }}",
  "priorWeekKey": "${{ inputs.prior_week_key }}",
  "questSlug": "${{ github.aw.import-inputs.quest-slug }}",
  "result": "material-change | no-material-change | blocked",
  "executiveSummary": "short summary",
  "currentQuestStatus": "current status",
  "learnerImpact": "high | medium | low | none",
  "officialSourceDeltas": [
    {
      "fact": "source fact",
      "lifecycle": "GA | Public preview | Private preview | Not stated by allowed sources",
      "evidenceUrl": "allowlisted URL",
      "evidenceLocation": "heading or section",
      "observedWording": "short factual wording",
      "fingerprint": "source fingerprint"
    }
  ],
  "contentDrift": [
    {
      "path": "owned Buildathon path",
      "section": "section reference",
      "observation": "repository observation"
    }
  ],
  "proposedChanges": [
    {
      "repository": "Azure-Samples/JavaScript-AI-Buildathon",
      "path": "owned Buildathon path",
      "description": "bounded proposed change"
    }
  ],
  "assetImpact": "asset impact or empty string",
  "codeTourImpact": [
    {
      "repository": "exact external report-only repository",
      "path": "exact observed CodeTour path",
      "mode": "report-only",
      "handoff": "manual-maintainer",
      "observation": "bounded observation"
    }
  ],
  "validationPlan": ["validation step"],
  "risks": ["risk or uncertainty"],
  "humanDecisions": ["decision required from Julia"],
  "sourceFingerprints": ["source fingerprint"],
  "priorFindingKeys": ["finding:<64 lowercase hex characters>"],
  "blockedReason": null
}
```

For `material-change`, include at least one proposed Buildathon change and use
`high`, `medium`, or `low` learner impact. For `no-material-change`, leave
`proposedChanges` empty. For `blocked`, set a concise `blockedReason`, leave
`proposedChanges` empty, and use `none` learner impact.
