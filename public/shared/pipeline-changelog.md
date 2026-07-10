# Pipeline change log

Every behavioral change to the pipeline gets one entry here, newest first.
This file is the reversibility record: each entry names its commit and its revert path.
Append an entry in the same commit as the change itself.

## 2026-07-10 — Ted's weekly voice-watch automated; proposals surfaced on dashboard; doc sync extended to all key documents with email redaction
- What changed: (1) New `vince/pipelines/evolve/gauge_voice_ted.js` (`npm run gauge-voice-ted`) + `.github/workflows/weekly-voice-watch-ted.yml` (Sundays 19:00 UTC): Ted's weekly voice self-check now runs from this repo's Actions, fully segregated per brother — reads only Ted's diary (ted-workspace, via TED_DIARY_TOKEN) and his own `-ted.md` letters (shared/correspondence), and PUTs `voice-watch.md` back into ted-workspace where his diary/correspondence skills read it. Run records append to shared/voice-log.jsonl with `agent:"ted"`. `gauge_voice.js` exports its scan helpers (normalize/watchListCounts/repeatedTrigrams, watch-list now parameterized) and gained a direct-execution guard so importing it doesn't run Vince's gauge. (2) `build_log.js` gains a "Proposals awaiting review" panel: when `vince/style-state.proposed.json` or `vince/preoccupations.proposed.md` exists, the dashboard shows a banner with the proposal summary and exact approve/reject steps — the operator no longer has to remember to check the repo. (3) `sync-ted-docs.yml` replaced by `sync-agent-docs.yml`: now also mirrors VINCEUPBRINGING.md (vince-workspace), Vince's preoccupations/style-state/corpus-memo/voice-watch and the pipeline changelog (this repo), plus Ted's two refs/ playbooks, into the showcase's public/ted|vince|shared folders; every copy passes an email-redaction step (name@domain → name (at) domain) so no plaintext address is scrapable.
- Why: operator decisions — Ted's self-check must run on schedule with no manual step; pending proposals must be visible to the human who has to approve them; all key documents should be readable on the site without exposing harvestable email addresses.
- Files: `vince/pipelines/evolve/gauge_voice_ted.js` (new), `vince/pipelines/evolve/gauge_voice.js`, `vince/pipelines/image/build_log.js`, `package.json`, `.github/workflows/weekly-voice-watch-ted.yml` (new), `.github/workflows/sync-agent-docs.yml` (new), `.github/workflows/sync-ted-docs.yml` (deleted).
- Commit: (this commit)
- Revert: `git revert <hash>` — voice-log rows with `agent:"ted"` are inert; ted-workspace voice-watch.md commits are separate and harmless.
- Verified: `node --check` on all touched scripts; `npm run build-log` regenerates the dashboard cleanly (proposals panel renders empty when no .proposed files exist); both new workflows dispatched manually after push (results in commit thread).

## 2026-07-10 — Voice-watch covers letters; correspondence reads the note; evolve scripts scheduled; Ted docs synced to showcase
- What changed: (1) `gauge_voice.js` now also loads Vince's last ~6 letters to Ted from `shared/correspondence/` (local read, no token): the deterministic phrase/trigram scan runs over diary + letters combined, the Opus critique sees both registers and is asked about letter-specific formula (openers, closing moves), and the voice-log row gains a `letters` count. (2) `write_correspondence.js` now reads `vince/voice-watch.md` (optional, graceful fallback, HTML comment header stripped) and folds it into the system prompt as Vince's own awareness — closing the loop so the letter writer actually applies the letter critique. (3) New `.github/workflows/weekly-evolve.yml` (Mondays 16:00 UTC): runs `npm run gauge` then `npm run propose-style`, committing `newness-log.jsonl` and any `.proposed`/`STYLE-PROPOSAL.md` output. (4) New `.github/workflows/monthly-evolve.yml` (1st of month 16:30 UTC): runs `npm run propose-preoccupations`, committing `preoccupations.proposed.md`. Both proposal scripts keep their proposal-only contract — nothing auto-applies; a human still reviews and applies by hand. (5) New `.github/workflows/sync-ted-docs.yml` (daily 21:15 UTC): mirrors Ted's five bootstrap docs (TEDUPBRINGING, SOUL, IDENTITY, AGENTS, MEMORY) from ted-workspace into vince-art-showcase `public/ted/` for the Atelier's read-only doc viewer, reusing `TED_DIARY_TOKEN` (read) and `SHOWCASE_DEPLOY_TOKEN` (write). SECURITY/USER/TOOLS/refs/diary/drafts/memory are deliberately not synced.
- Why: operator decision — the voice self-check should cover both of Vince's registers, not just the diary; the seasons scripts should run on a schedule instead of never; and Ted's bootstrap documents should be publicly readable on the site.
- Files: `vince/pipelines/evolve/gauge_voice.js`, `vince/pipelines/diary/write_correspondence.js`, `.github/workflows/weekly-voice-watch.yml` (comment/step name only), `.github/workflows/weekly-evolve.yml` (new), `.github/workflows/monthly-evolve.yml` (new), `.github/workflows/sync-ted-docs.yml` (new), `CLAUDE.md`.
- Commit: (this commit)
- Revert: `git revert <hash>` — voice-log rows with the new `letters` field are inert; deleting the three new workflow files alone disables the crons.
- Verified: `node --check` on both touched scripts passes; gauge-voice run without API keys logs counts and leaves voice-watch.md untouched (existing contract); workflow YAML mirrors the existing weekly-voice-watch.yml patterns. Live LLM passes not run here (no API keys in this environment).

## 2026-06-28 — Dashboard: surface content-filter story refusals as incidents
- What changed: (1) `assemble_prompt.js` now calls `logIncident` (imported from `lib/llm.js`) for each story the content filter refuses, writing a `type: 'story-refused'` entry to `shared/incident-log.jsonl`. (2) `build_log.js` normalises existing `llm.js` entries whose field is named `severity` rather than `type`, fixing a pre-existing bug where provider fallbacks were silently invisible on the dashboard. (3) `renderIncidentSection` now handles the `story-refused` type: a blue info banner when only refusals are present ("run completed normally — pipeline fell back to next candidate"), with the refused story title shown in the incident table. CSS added for `.incident-banner.info` and `.badge-info`.
- Why: a content-filter refusal that causes the pipeline to skip a story was logged only to stderr (invisible on review). The operator needs to see which story was refused and why without digging into Actions logs.
- Files: `vince/pipelines/image/assemble_prompt.js`, `vince/pipelines/image/build_log.js`
- Commit: (this commit)
- Revert: `git revert <hash>` — incident-log entries already written are inert; dashboard re-renders on next build.

## 2026-06-28 — Story-level fallback on content-filter refusal (assemble_prompt.js)
- What changed: (1) `generateDivergentScenes` now detects `stop_reason === 'refusal'` or `'content_filter'` immediately after the API call and throws a typed error (`err.isRefusal = true`) with no retry — retrying an identical prompt against the same filter is pointless. (2) `rankStories` now returns an ordered list of up to 5 candidates (ranked best-to-worst by Claude Haiku) instead of a single story. (3) `main()` walks the ranked list: if a story's scene generation is refused, it logs the refusal and tries the next candidate. The run only fails if every candidate is refused.
- Why: run 28332863751 showed `stop_reason: refusal, content length: 0` — the bird flu story's anchor vocabulary ("dead petrel", "carcass", "suckling seal pup beside a dead mother") triggered Claude's content filter at scene generation, and the retry loop wasted three attempts before throwing. Without a story-level fallback, one ungenerable story kills the whole run regardless of how many other good stories are in the digest.
- Files: `vince/pipelines/image/assemble_prompt.js`
- Commit: (this commit)
- Revert: `git revert <hash>` — no data files affected.

## 2026-06-28 — Fix crash when scene generator returns empty list (assemble_prompt.js)
- What changed: `generateDivergentScenes` now retries the API call (up to 2 extra attempts) when the response is empty or unparseable as a non-empty scene list, then throws a clear error if all attempts fail — never silently substitutes a generic template. The safety net in `assembleScenes` likewise throws rather than falling back to a template.
- Why: daily run on 2026-06-28 crashed at `scenes[primaryIndex].scene` (TypeError: Cannot read properties of undefined) because `generateDivergentScenes` returned `[]`, the evaluation loop processed nothing, and `evaluated[0]` was undefined. Correct behaviour on API failure is a loud, skippable run, not silent generic art.
- Files: `vince/pipelines/image/assemble_prompt.js`
- Commit: (this commit)
- Revert: `git revert <hash>` — no data files affected.

Entry template (copy, fill, keep newest first below this line):

```
## YYYY-MM-DD — Short title (Phase N of plans/2026-06-12-upgrade-plan.md)
- What changed: one or two plain sentences.
- Why: one sentence.
- Files: the files touched.
- Commit: <hash or "(this commit)">
- Revert: `git revert <hash>` — plus any generated data files that may be deleted (all new data files are inert; deleting them is always safe).
- Verified: which tests were run (standard test block? script smoke runs?) and their result.
```

---

## 2026-06-27 — Neighborhood name corrected to South LA in setting blocks
- What changed: the fixed SETTING blocks (noon / goldenHour) and related prompt text now name the place "South LA" instead of the outdated name, in both the scene-writer's fixed-block reference and the technical-validator phrasing.
- Why: canon correction (DECISIONS 2026-06-27, deyaanga-ops); the project uses "South LA" exclusively, never the old name.
- Files: `vince/pipelines/image/assemble_prompt.js`, `vince/pipelines/image/generate_image.js`, `vince/style-state.json`, `vince/pipelines/image/upscale.js`, `vince/pipelines/image/upscale_hires.js` (alongside a project-wide text correction in docs, sessions, research, corpus-index, and the generated artwork metadata).
- Commit: (this commit)
- Revert: `git revert <hash>` — no data deleted; this is a text-only rename inside prompt strings.
- Verified: text-only string substitution inside prompt blocks; no control flow changed. Not executed (no API keys in this environment).

## 2026-06-27 — Voice-watch becomes auto-apply + weekly cron (drops the human review step)
- What changed: `gauge_voice.js` no longer writes a proposal for human review. It now AUTO-WRITES the active `vince/voice-watch.md` directly (the same auto-apply contract as `corpus-memo.md` / `build_memo.js`), so the weekly review implements itself: the critique it generates is the note the diary reads the same week. Dropped `vince/voice-watch.proposed.md`. If no API key is available it logs counts to `shared/voice-log.jsonl` and leaves the existing `voice-watch.md` untouched (never clobbers with an empty note). New `.github/workflows/weekly-voice-watch.yml` runs it Sundays 20:00 UTC (1 PM PDT, before the evening diary), then commits the regenerated `voice-watch.md` + `voice-log.jsonl` back to main — mirroring the corpus-memo commit-back step in `daily-run.yml`.
- Why: operator decision — no human gate wanted on the diary voice feedback; the weekly job should generate the feedback and apply it. voice-watch is descriptive self-awareness from Vince's own entries (like the corpus memo), not a behavioral rule change (like style/preoccupations), so auto-apply is the right contract.
- Files: `vince/pipelines/evolve/gauge_voice.js`, `.github/workflows/weekly-voice-watch.yml` (new), `CLAUDE.md`, `vince/CLAUDE.md`.
- Commit: (this commit)
- Revert: `git revert <this commit>`. `voice-watch.md` / `voice-log.jsonl` are inert; the diary falls back to prior behavior if `voice-watch.md` is absent. Disabling the cron alone = delete `.github/workflows/weekly-voice-watch.yml`.
- Verified: `node --check vince/pipelines/evolve/gauge_voice.js` passes; YAML workflow lints by eye against the existing `daily-run.yml` pattern. (Live run needs API keys + `GITHUB_TOKEN`, not run here.)

---

## 2026-06-27 — Diary voice freshness: model upgrade, anti-tic rules, voice-watch loop
- What changed: (1) Diary generation model moved `claude-sonnet-4-6` → `claude-opus-4-8` in `write_diary.js`. (2) Added anti-tic voice rules to the diary system prompt (no count/tally bookkeeping on the page, vary the worn attention verbs "coming back to / sitting with / circling," vary the "true / earned / honest" verdicts, vary the draft-rejection vocabulary, don't run the same opener→draft-walk→unresolved-ending template every night, French is a rare reflex not a sign-off). (3) Re-framed how `corpus-memo.md` enters the diary so its ledger phrasing ("X out of Y," "wallpaper," "furniture") stops being recited. (4) New optional input `vince/voice-watch.md` read at runtime (graceful fallback, same contract as preoccupations/corpus-memo) folded in as Vince's own awareness of recent prose habits. (5) New `vince/pipelines/evolve/gauge_voice.js` (`npm run gauge-voice`) — proposal-only weekly review: reads the last ~14 diary entries back from vince-workspace, scans for watch-list phrases + repeated trigrams, runs an Opus critique, writes `vince/voice-watch.proposed.md` and appends `shared/voice-log.jsonl`. Never writes the active `voice-watch.md`.
- Why: 13 diary entries had calcified into a template (same openers, "the thing I keep coming back to," "true/earned/honest" as the only verdicts, a "golden hour X out of Y images" tally in seven straight entries). The image pipeline had five freshness mechanisms; the diary had none. See plans/diary-voice-review.md in deyaanga-ops.
- Files: `vince/pipelines/diary/write_diary.js`, `vince/pipelines/evolve/gauge_voice.js` (new), `vince/voice-watch.md` (new, seeded human-approved), `package.json`.
- Commit: (this commit)
- Revert: `git revert <this commit>`. Data files (`vince/voice-watch.md`, `vince/voice-watch.proposed.md`, `shared/voice-log.jsonl`) are inert; deleting them is safe and the diary falls back to its prior behavior when `voice-watch.md` is absent.
- Verified: `node --check` on `write_diary.js` and `gauge_voice.js` pass. (Live generation needs API keys + GITHUB_TOKEN, not run here.)

---

## 2026-06-25 — Fix build_log.js SyntaxError: template literals inside outer template literal
- What changed: `build_log.js` lines 760–770 — the `openLightbox` inline script (inside the `buildHtml` HTML template literal) used template literals whose backticks closed the outer template string, causing `SyntaxError: Invalid or unexpected token` at parse time. Converted those seven template literals to string concatenation.
- Why: pipeline was failing at Step 4 (build_log.js) on every run; the error was introduced in the 2026-06-20 lightbox commit.
- Files: `vince/pipelines/image/build_log.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`. No pipeline data affected; purely a JS syntax fix in the dashboard generator.
- Verified: `node --check vince/pipelines/image/build_log.js` passes.

---

## 2026-06-20 — Dashboard usability pass: overview/glossary, sticky nav, lightbox for hero images, viewport-clamped tooltips
- What changed: `build_log.js` (the dashboard generator) gains (1) a top **Overview** section — lead paragraph, a 6-step "how a run works" flow, and a collapsible glossary defining anchor / divergence-convergence / judges / trace score / blind read / fidelity / fallback; (2) the nav bar is now **sticky** with smooth-scroll and `scroll-margin-top` so jump links land below it (added an `#overview` link); (3) the **selected (hero) image** in each artwork card is now click-to-enlarge in the existing lightbox, not just the small iteration thumbnails; (4) hover **tooltips** were re-implemented as a single shared JS-positioned element clamped to the viewport, replacing the CSS `::after` tooltips that clipped off-screen on edge stat-cards and table headers. Overview counts are derived from sessions + total renders (robust) rather than the `selected` flag (which legacy single-render records lack), so the headline figures are not misleading.
- Why: the dashboard is the human window into the pipeline; a first-time reader had no orientation and the jargon was undefined, jump links required scrolling back to the top, the main image couldn't be enlarged, and edge tooltips clipped.
- Files: `vince/pipelines/image/build_log.js`, `docs/index.html` (regenerated). Deploys to deyaanga.art/dashboard.html via `publish-portfolio.yml` on push.
- Commit: (this commit)
- Revert: `git revert <this commit>`. Pure presentation change; no pipeline data is read or written differently.
- Verified: `npm run build-log` succeeds (93 artworks / 41 sessions); section/details/dialog tags balanced; all six nav anchors resolve to exactly one target; embedded `iter-data` JSON parses (93 entries, no `</script>` injection); inline browser script parses under `vm.Script`; all 92 referenced render images present in the deployed `public/renders/`.

---

## 2026-06-18 — Atelier anchoring: verify draft-image anchors verbatim; stop diary "notes" leak
- What changed: (1) `publish_project.js` now snaps every LLM-returned anchor to a verbatim span of the diary (`snapAnchor`) and drops any draft/selected anchor that can't be found verbatim, so a paraphrased or hallucinated anchor can never silently fail to render in the Atelier (which places thumbnails by `paragraph.includes(anchor)`). The matching prompt was hardened to demand word-for-word copies from the diary (with good/bad examples) and to omit drafts the diary doesn't actually discuss. Added `REMATCH_DATES` env (wired to a `rematch_dates` input on `publish-project.yml`) to force re-matching of already-published dates. (2) `write_diary.js` reframes the corpus-memo injection as Vince's own internal awareness (not "notes") and adds a voice rule forbidding references to notes/logs/lists — fixes entries like "My notes say I haven't made an image with interiority yet."
- Why: the 2026-06-17 entry showed zero thumbnails (the LLM returned image descriptions as anchors); 2026-06-16 dropped one (a one-word corruption, "underscore" vs "undersized"). And Vince was breaking voice by citing "notes."
- Files: `vince/pipelines/diary/publish_project.js`, `vince/pipelines/diary/write_diary.js`, `.github/workflows/publish-project.yml`.
- Commit: (this commit)
- Revert: `git revert <this commit>`. No data files affected (the live project.json is regenerated by the next publish-project run).
- Verified: `node --check` on both scripts; unit-tested `snapAnchor` against the real June-16 corruption (recovers "bucket on top from draft three"), exact anchors (preserved), whitespace/comma drift (recovered), and an image-description (correctly dropped to null). Live repair dispatched via publish-project.yml with `rematch_dates=2026-06-16,2026-06-17`.

---

## 2026-06-17 — Diary: Ted appears at most 1-2 times per week, not every entry
- What changed: system prompt rule updated so Vince only thinks about Ted when the day genuinely calls for it — at most once or twice per week across entries, not as a default closing move.
- Why: Ted was appearing in every diary entry, which felt mechanical and diluted the moments when he actually matters.
- Files: `vince/pipelines/diary/write_diary.js`
- Commit: (this commit)
- Revert: restore the previous Ted rule in `buildSystemPrompt`.
- Verified: `node --check`.

---

## 2026-06-17 — Diary: fall back to blindGuess.literal when draft analysis is empty
- What changed: `write_diary.js` now uses `blindGuess.literal` (the blind viewer's description of what they saw) as a fallback when a draft image's `analysis` field is empty. Previously a draft with no analysis was silently omitted from the diary context, so Claude never wrote about it and it never appeared as a thumbnail in the published diary.
- Why: vision analysis occasionally fails for a draft image (network error, API timeout) leaving `analysis: ""`. The draft still exists and matters — dropping it from the diary hides an entire creative direction Vince explored.
- Files: `vince/pipelines/diary/write_diary.js`
- Commit: 3b5d48f
- Revert: remove the `blindGuess.literal` fallback line in `write_diary.js`. Re-run the affected diary dates.
- Verified: `node --check`; confirmed against the 2026-06-15 run where draft 002 had empty analysis.

---

## 2026-06-17 — Fix daily-diary cron to avoid LA midnight rollover
- What changed: `daily-diary.yml` cron moved from `0 2 * * *` to `0 22 * * *` (22:00 UTC = 3 PM PDT). GitHub Actions was firing the `0 2 * * *` job ~5 hours late (landing at ~07:00 UTC = midnight PDT), which flipped the LA calendar date before `write_diary.js` could find that day's artworks.
- Why: Diary was silently skipping every day because `slugCount === 0` — the LA date at midnight PDT is already "tomorrow" but the artworks are dated "yesterday."
- Files: `.github/workflows/daily-diary.yml`
- Commit: (this commit)
- Revert: change cron back to `0 2 * * *` in `daily-diary.yml`.
- Verified: confirmed by inspecting GitHub Actions run timestamps and LA timezone arithmetic.

---

## 2026-06-15 — Split diary from image run; move all dates to Los Angeles timezone
- What changed: (1) Separated the daily automation into two scheduled workflows — `daily-run.yml` (image pipeline + corpus memo, 14:00 UTC / 7 AM PDT) and the new `daily-diary.yml` (diary + publish-project, 02:00 UTC / 7 PM PDT). The morning run no longer writes the diary; the end-of-day run writes a single entry covering every session that day, so a two-image day yields one reflective entry about both works. (2) Moved every pipeline "today" derivation from UTC to the America/Los_Angeles date (`todayString` in fetch_news.js, assemble_prompt.js, generate_image.js; `today` in run_pipeline.js; default date in write_diary.js). Without this, the 7 PM PDT diary (past midnight UTC) would compute tomorrow's date and find no artworks.
- Why: let Vince reflect on a full day of work at day's end, and keep artwork filenames, digest, meta, and the diary lookup on one shared calendar regardless of when in the day a run fires.
- Files: `.github/workflows/daily-run.yml`, `.github/workflows/daily-diary.yml`, `vince/pipelines/image/run_pipeline.js`, `vince/pipelines/image/fetch_news.js`, `vince/pipelines/image/assemble_prompt.js`, `vince/pipelines/image/generate_image.js`, `vince/pipelines/diary/write_diary.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`. No data files affected.
- Verified: `node --check` on all five touched scripts; unit-tested the LA-date computation at the 02:00 UTC boundary (returns the correct previous LA day). Not yet run end-to-end on the runner (needs API keys + secrets); first live exercise is the next scheduled diary.

---

## 2026-06-13 — Reconcile gifted-meitner diary robustness onto main
- What changed: ported the unique improvements from the parallel `claude/gifted-meitner-mlkv4e` diary branch onto main's current `write_diary.js` (which already has the `createLLMClient` fallback + corpus-memo). Added: (1) legacy-schema handling in `formatSession` — records without a `phase` field render as refinement passes instead of vanishing; (2) `max_tokens` 1200 → 1600; (3) truncation guard — if the model stops at `max_tokens` the entry is incomplete and is NOT pushed; (4) `stripEmDashes` post-processing to enforce the no-em-dash voice rule; (5) empty-day skip — no sessions → no diary entry written. Also surfaced `stop_reason` from `lib/llm.js`'s OpenAI path (mapped from `finish_reason`) so the truncation guard works on either provider.
- Why: gifted-meitner branched from a 2026-06-08 base and evolved real robustness fixes in parallel; main evolved different infra. This combines both rather than choosing one. Done on a branch with a PR for human review (not auto-merged) per the conflicting-merge.
- Files: `vince/pipelines/diary/write_diary.js`, `vince/pipelines/lib/llm.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`.
- Verified: `node --check` on both files. NOTE: not run end-to-end (needs API + same-day artworks + GITHUB_TOKEN push); the diary voice rules on main already cover the older-brother/French content gifted-meitner also added, so only the mechanical robustness was ported — reviewer should confirm no voice-rule regressions.

---

## 2026-06-13 — Extend OpenAI fallback to memo, evolve, and diary scripts
- What changed: routed the remaining Anthropic call sites through `createLLMClient` (`vince/pipelines/lib/llm.js`): `memo/build_memo.js` (stage `memo`), `evolve/gauge_newness.js` (`gauge-newness`), `evolve/propose_style.js` (`propose-style`), `evolve/propose_preoccupations.js` (`propose-preoccupations`), and `diary/write_diary.js` (`diary`). Each script's "no API key → skip" guard now checks both providers. The diary's bespoke Anthropic→OpenAI fallback (`callAnthropic`/`callOpenAI`/`generateEntry`) was replaced by a single `generateEntry` using the shared wrapper, so it now also gets transient-error retries and incident logging. With this, the whole project shares one resilient LLM path; the only intentional exceptions remain the two independent selection judges (`claudeVote`/`gptVote`).
- Why: complete the provider-resilience work so every Anthropic-dependent script fails over to OpenAI and reports degradation on the dashboard, not just the image-generation core.
- Files: `vince/pipelines/memo/build_memo.js`, `vince/pipelines/evolve/gauge_newness.js`, `vince/pipelines/evolve/propose_style.js`, `vince/pipelines/evolve/propose_preoccupations.js`, `vince/pipelines/diary/write_diary.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`. The diary's previous inline fallback is restored by the revert.
- Verified: `node --check` on all five files; `npm run memo`/`gauge`/`propose-style` run cleanly (memo generated from the existing 1-work corpus index via the wrapper — confirming a live call succeeds; the generated memo was a smoke-test artifact and was not committed).

---

## 2026-06-13 — OpenAI fallback for every Anthropic call + dashboard Incidents panel
- What changed: new shared `vince/pipelines/lib/llm.js` exports `createLLMClient(stage)` — a drop-in for `new Anthropic()` that retries transient Anthropic errors (2×, exponential backoff) then fails over to OpenAI (gpt-4o; gpt-4o-mini for Haiku-tier), returning the Anthropic response shape so call sites are unchanged. Wired into every generative Anthropic call: `assemble_prompt.js` (one shared client → story ranking, anchor, scenes, fidelity, blind test, trace label) and `generate_image.js` (analyzeIteration, analyzeBlindImage, reviseContentBlock, finalFidelityCheck, generateTitle, scoreTraceability, both legacy selectors). Guards changed from "Anthropic key required" to "either provider", and `useDivergence` now enables under OpenAI-only. The two selection judges `claudeVote`/`gptVote` are intentionally NOT wrapped (panel must stay two independent providers). Fallbacks and hard failures append to new `shared/incident-log.jsonl`; new dashboard "Incidents & Fallbacks" panel (top of page) shows a red banner on hard failure, amber on fallback, green when clean. `run_pipeline.js` commits the incident log.
- Why: previously, if Anthropic erred mid-run with a key set, the image pipeline crashed the run (no generative fallback) — only the diary pipeline had OpenAI fallback. This makes the whole image pipeline resilient and makes any degradation visible on review.
- Files: `vince/pipelines/lib/llm.js` (new), `vince/pipelines/image/assemble_prompt.js`, `vince/pipelines/image/generate_image.js`, `vince/pipelines/image/run_pipeline.js`, `vince/pipelines/image/build_log.js`, `CLAUDE.md`.
- Commit: (this commit)
- Revert: `git revert <this commit>`; the incident log is inert data.
- Verified: `node --check` on all changed files; **live fallback test** — bad `ANTHROPIC_API_KEY` + real `OPENAI_API_KEY` → wrapped call failed over to gpt-4o-mini, returned the expected text, and logged a `fallback` incident (401 captured). Dashboard renders the incident + amber banner when present and the green clean state when empty (test incident removed before commit). `claudeVote` confirmed to still use `new Anthropic()` directly. NOTE: not yet wired into the memo/evolve scripts (`build_memo.js`, `propose_*`, `gauge_newness.js`) or the diary pipeline (diary already has its own Anthropic→OpenAI fallback) — those can adopt `lib/llm.js` next.

---

## 2026-06-13 — Direction selection: king-of-the-hill → round-robin panel
- What changed: replaced the champion-tournament in `selectDirection`/`selectBestAmong` with `panelSelect` — a full round-robin (every pair) tallied by Copeland score (count of pairwise wins) for ≤ 5 candidates, with a bounded champion tournament beyond that (cost guard, O(n²)). Copeland ties are broken by `tiePref`: `'first'` (incumbent/primary, index 0) for direction selection, `'last'` (most-refined) for convergence selection. If every pair is undecided, all scores are 0 and the tiePref default is chosen (so an all-undecided panel deterministically keeps the primary/most-refined). Legacy single-call fallback retained on error or missing key.
- Why: king-of-the-hill is order/seed-dependent, can't detect non-transitive (Condorcet) preferences, skips comparisons (draft 2 was never compared with draft 3), and produces biased, sparse preference data. Round-robin removes the seeding bias, surfaces ties/cycles, and yields the full pairwise matrix the future taste model needs. Cheap at current n=3 (3 pairs vs 2).
- Files: `vince/pipelines/image/generate_image.js`, `vince/CLAUDE.md`.
- Commit: (this commit)
- Revert: `git revert <this commit>` restores the champion tournament; ledger entries already written are inert.
- Verified: `node --check generate_image.js` passes; Copeland tally + tie-break math reviewed; legacy fallback path unchanged.

---

## 2026-06-13 — Abstain-pair logging + dashboard Judge Reliability panel
- What changed: `judgePair` now returns full diagnostics instead of `'A'|'B'|null` — `{winner, votesA, votesB, judges (voted), abstained (order-flip), unavailable (no key / API error), disagreement, agreed, reason}`. `panelSelect` writes EVERY pair (decided and undecided) to `shared/preference-ledger.jsonl` with these fields, so undecided/abstained outcomes are no longer dropped. New `build_log.js` panel "Judge Reliability" computes, over the logged pairs: % decided, inter-judge agreement (when both judges voted), % judges split, % no-stable-vote, and a per-judge voted/abstained/unavailable table — with an explanation of what they mean (whether selection tracks real signal vs. a coin flip). Old-schema ledger lines (no `decided` field) are ignored; the panel shows an empty state until upgraded-selection pairs exist.
- Why: we could not measure whether the panel was choosing the better image or effectively flipping a coin, because undecided pairs were never recorded. This instruments it.
- Files: `vince/pipelines/image/generate_image.js`, `vince/pipelines/image/build_log.js`, `CLAUDE.md`.
- Commit: (this commit)
- Revert: `git revert <this commit>`; the ledger and dashboard are inert/regenerated.
- Verified: `node --check` passes on both files; `build_log.js` runs and renders the empty-state panel correctly against the current (old-schema) ledger; reliability stat math unit-tested against synthetic pairs (decided/disagreement/no-stable/inter-judge/per-judge counts all correct).

---

## 2026-06-13 — Silence keywords follow the story subject, not headline word-order
- What changed: covered-stories silence keys were `slug.replace('-', ', ')` — the first four significant headline words — so the actual subject could be truncated away (e.g. "Philippines picks up the pieces after strongest earthquake…" yielded `philippines, picks, pieces, strongest` and dropped "earthquake"). Added a sixth anchor field `topicKeywords` (place + event type + proper nouns; proper nouns are wanted here, unlike `symbolField`) and the silence entry now uses it. Fallback when the anchor is absent/degraded: ALL significant headline words (via new `significantWords` helper), not just the first four. `makeSlug` is unchanged (still first-4) so artwork filenames stay stable.
- Why: silence should track the news event, not headline word order; the old heuristic both missed the subject (false negatives — could re-pick the same event) and could over-match generic words like "pieces"/"strongest".
- Files: `vince/pipelines/image/assemble_prompt.js`, `vince/CLAUDE.md` (anchor now six fields).
- Commit: (this commit)
- Revert: `git revert <this commit>`. Anchor records written with `topicKeywords` are harmless to all readers; covered-stories.md entries are inert text.
- Verified: `node --check assemble_prompt.js` passes; fallback derivation tested (now retains "earthquake"); anchor path tested to prefer `["philippines","earthquake","mindanao"]`-style keys. Note: `checkRecentlyCovered` still matches on ANY keyword (OR), so a place name alone (e.g. "philippines") silences other stories from that place for 7 days — unchanged, pre-existing breadth.

---

## 2026-06-13 — Run commit now includes agent/covered-stories.md
- What changed: added `agent/covered-stories.md` to `COMMIT_PATHS` in `run_pipeline.js`. `assemble_prompt.js` appends a silence entry to this file every run, but it was absent from the commit path list, so the silence-tracker update was left uncommitted after each run (had to be committed by hand).
- Why: the silence tracker is run output and must be part of the run's own commit, or the next run can re-pick a just-covered story (and the working tree is left dirty).
- Files: `vince/pipelines/image/run_pipeline.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>` — restores the previous path list; harmless (covered-stories.md would simply need manual commits again).
- Verified: `node --check run_pipeline.js` passes; confirmed the file is tracked and always present after `assemble_prompt.js` runs, so no existsSync guard is needed.

---

## 2026-06-12 — Docs updated to match upgraded pipeline (Phase 11 of plans/2026-06-12-upgrade-plan.md)
- What changed: `vince/CLAUDE.md` updated to describe the upgraded pipeline (anchor v2 five fields, fidelity-check gate, pairwise judging, new record fields, new shared files, new pipeline directories, changelog rule). Root `CLAUDE.md` directory map extended to show all new shared and vince/ files; npm scripts section updated; `OPENAI_API_KEY` note updated to mention second-judge role; key decisions updated to note propose-only rule and deferred features; pipeline-changelog rule added to both files.
- Why: docs should describe the machine as it is.
- Files: `vince/CLAUDE.md`, `CLAUDE.md`.
- Commit: (this commit)
- Revert: `git revert <this commit>` (documentation only; no behavior changes).
- Verified: read-through only.

---

## 2026-06-12 — Seasons: newness gauge + style/preoccupations proposal scripts (propose-only; human applies) (Phase 10 of plans/2026-06-12-upgrade-plan.md)
- What changed: three new standalone scripts — `gauge_newness.js` (appends newness score to `shared/newness-log.jsonl`), `propose_style.js` (writes `vince/style-state.proposed.json` + `vince/STYLE-PROPOSAL.md` when triggered; never touches live `vince/style-state.json`), `propose_preoccupations.js` (writes `vince/preoccupations.proposed.md`; reads recent diary from vince-workspace via GitHub API; exits with "no proposal warranted" when evidence is thin). All three exit 0 gracefully when inputs are absent. Four new `package.json` scripts: `gauge`, `propose-style`, `propose-preoccupations`.
- Why: instruments the pipeline to detect when the work is repeating itself and surfaces proposals a human can review and apply.
- Files: `vince/pipelines/evolve/gauge_newness.js` (new), `vince/pipelines/evolve/propose_style.js` (new), `vince/pipelines/evolve/propose_preoccupations.js` (new), `package.json`.
- Commit: (this commit)
- Revert: `git revert <this commit>`; delete any generated proposal/log files (all inert).
- Verified: syntax check passed on all three; each exits 0 with skip message when no inputs present; `propose_style.js` contains no write to live `vince/style-state.json`.

---

## 2026-06-12 — Final-image fidelity check; single demotion path; result recorded on the winner (Phase 9 of plans/2026-06-12-upgrade-plan.md)
- What changed: added `finalFidelityCheck` to `generate_image.js`. After winner is determined, one vision call checks vocabulary and register against the anchor. If it fails and other candidates exist, winner is demoted and re-picked once (no second demotion, no loop). `finalFidelity` is written onto the winner JSON. Result is non-fatal (skipped when no API key or anchor).
- Why: adds a final constraint check at the end of the run without gating or rewriting — demotion only, and only once.
- Files: `vince/pipelines/image/generate_image.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`.
- Verified: syntax check passed; no-key template-fallback exits 0; read-through confirms exactly one demotion possible (no loop).

---

## 2026-06-12 — Corpus memo: build script; scene-writer and diary read it when present (Phase 8 of plans/2026-06-12-upgrade-plan.md)
- What changed: new `vince/pipelines/memo/build_memo.js` reads `shared/corpus-index.jsonl` and generates a 250–400 word prose memo at `vince/corpus-memo.md` (skips gracefully if index absent or no API key). `assemble_prompt.js` loads the memo optionally and injects it into `generateDivergentScenes`. `write_diary.js` loads the memo optionally and appends it to the user prompt. `package.json` gains a `memo` script.
- Why: lets Vince's scene-writer and diary voice reference his own body of work without hard-coding prior works.
- Files: `vince/pipelines/memo/build_memo.js` (new), `package.json`, `vince/pipelines/image/assemble_prompt.js`, `vince/pipelines/diary/write_diary.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`; optionally delete `vince/corpus-memo.md`.
- Verified: syntax check passed on all three changed/new files; `npm run memo` with no index exits 0 with skip message; no-key assemble test exits 0.

---

## 2026-06-12 — Formal descriptors per record; corpus-index.jsonl line per keeper (Phase 7 of plans/2026-06-12-upgrade-plan.md)
- What changed: `analyzeIteration` prompt gains a fifth `DESCRIPTORS` section (inline JSON: figures, focalObject, scaleViolated, signature); parsed and written into each artwork record. `max_tokens` raised to 750. After the winner JSON is stamped, one line is appended to `shared/corpus-index.jsonl` with date, slug, title, register, settingVariant, traceScore, descriptors, accident, selectionNote.
- Why: makes the artwork archive machine-readable for the corpus memo and seasons scripts.
- Files: `vince/pipelines/image/generate_image.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`; the corpus-index file is inert data.
- Verified: standard test block — syntax check passed; no-key template-fallback exits 0.

---

## 2026-06-12 — Selection calls upgraded: pairwise, order-swapped, Claude+GPT panel with legacy fallback (Phase 6 of plans/2026-06-12-upgrade-plan.md)
- What changed: added `parseJsonLoose`, `pairPromptText`, `claudeVote`, `gptVote`, `judgePair` to `generate_image.js`. Existing `selectDirection` renamed to `selectDirectionLegacy`; new `selectDirection` runs a champion tournament via pairwise order-swapped judging (Claude + optional GPT) with full fallback to legacy. Existing `selectBestAmong` renamed to `selectBestAmongLegacy`; new `selectBestAmong` uses `judgePair` for 2 candidates and a champion tournament for >2, with legacy fallback. Phase 5's after-the-fact `draft-choice` ledger block removed; pairwise loop now logs `draft-pair` entries directly. Both `selectBestAmong` call sites updated to pass `anchor` and `storyTitle`.
- Why: order-swapped, two-company judging removes positional bias and adds a second opinion when OpenAI API key is available.
- Files: `vince/pipelines/image/generate_image.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>` restores legacy functions byte-identically.
- Verified: standard test block — syntax check passed; no-key template-fallback exits 0; `grep -c Legacy generate_image.js` = 6.

---

## 2026-06-12 — Preference ledger: in-pipeline verdicts recorded to shared/preference-ledger.jsonl (record-only) (Phase 5 of plans/2026-06-12-upgrade-plan.md)
- What changed: `generate_image.js` appends one JSONL line to `shared/preference-ledger.jsonl` at each existing decision point: draft-choice (after `selectDirection`), pass-improve (each convergence pass), and final-choice (after `selectBestAmong` at the end). Ledger writes are non-fatal. `run_pipeline.js` git-add/status calls now dynamically include the ledger and corpus-index files when they exist.
- Why: recording all comparative verdicts enables future preference analysis without changing any judging logic.
- Files: `vince/pipelines/image/generate_image.js`, `vince/pipelines/image/run_pipeline.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`; optionally delete `shared/preference-ledger.jsonl` (inert data).
- Verified: standard test block — syntax check passed; no-key template-fallback exits 0; `grep -c appendLedger generate_image.js` = 4.

---

## 2026-06-12 — Image-stage judges receive the anchor (irreducible + register) instead of headline-only (Phase 4 of plans/2026-06-12-upgrade-plan.md)
- What changed: `analyzeIteration` gains an `anchor = null` param; its prompt now shows the anchor's `irreducible` and `register`, and the ARTIST/ART CRITIC lens instruction references the anchor. `selectDirection` gains `anchor = null`; its prompt replaces the bare headline with the anchor's irreducible and register, and the weighing instruction now says "how strongly it grows from the anchor" rather than "how traceable its connection to the real story is". Both call sites updated.
- Why: judges were assessing against the story headline; giving them the anchor grounds assessment in the specific irreducible tension the work must grow from.
- Files: `vince/pipelines/image/generate_image.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`.
- Verified: standard test block — syntax check passed; no-key template-fallback exits 0.

---

## 2026-06-12 — Scene gate: trace-score threshold + feedback rewrite replaced by anchor-fidelity discard-and-redraw; blind test kept as label (Phase 3 of plans/2026-06-12-upgrade-plan.md)
- What changed: removed `TRACE_THRESHOLD` constant, `scenePasses`, and `critiqueScene` from `assemble_prompt.js`. Added `fidelityCheck` (three yes/no questions: vocabulary/register/timing) and `scoreTraceLabel` (blind-guess trace score as a label, never a gate). Failing scenes are discarded and redrawn fresh without critique feedback; rejected compositions are listed in the redraw prompt without reasons. `divergentScenes` in meta now carries `fidelity`, `blindGuess`, `traceLabel` per scene. The image-level `TRACE_THRESHOLD` in `generate_image.js` is untouched.
- Why: corrective feedback looped scenes toward literal guessability; the new fidelity check discards failures cleanly and lets the blind trace score be recorded without gating on it.
- Files: `vince/pipelines/image/assemble_prompt.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>` restores the trace gate exactly.
- Verified: standard test block — syntax check passed; no-key template-fallback exits 0; `grep TRACE_THRESHOLD assemble_prompt.js` returns nothing; `grep TRACE_THRESHOLD generate_image.js` returns the image-level constant (3 hits, untouched).

---

## 2026-06-12 — Anchor + story URL persisted into artwork records (Phase 2 of plans/2026-06-12-upgrade-plan.md)
- What changed: `assemble_prompt.js` writes `storyUrl` (Guardian web URL) into `assemble-meta-<date>.json`. `generate_image.js` reads `anchor` and `storyUrl` from the meta file and writes them into every artwork `.json` record when present.
- Why: anchor and story URL previously lived only in the ephemeral meta file; this makes them part of the permanent artwork record.
- Files: `vince/pipelines/image/assemble_prompt.js`, `vince/pipelines/image/generate_image.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`. Records already written with the new fields are harmless to all readers.
- Verified: standard test block — syntax check passed; no-key template-fallback path exits 0; `grep -n "storyUrl" generate_image.js` shows five additions.

---

## 2026-06-12 — Anchor v2: full-article input; register/timing/notAbout fields (Phase 1 of plans/2026-06-12-upgrade-plan.md)
- What changed: `storyContext()` now feeds up to 6000 characters of article body to the anchor extractor (was 700). `extractVisualAnchor` prompt upgraded from 2-part to 5-part; `max_tokens` raised from 350 to 600. Return value gains three optional fields: `register` (emotional key), `timing` (before/during/after), `notAbout` (adjacent story-types to stay distinct from).
- Why: richer article context and explicit register/timing fields give downstream scene generation and judges more to anchor against.
- Files: `vince/pipelines/image/assemble_prompt.js`.
- Commit: (this commit)
- Revert: `git revert <this commit>`.
- Verified: standard test block — syntax check passed; no-key template-fallback path exits 0; `grep -n "slice(0, 6000)"` returns one hit.

---

## 2026-06-12 — Change log created (Phase 0)
- What changed: this file exists; the upgrade plan (`plans/2026-06-12-upgrade-plan.md`) is committed.
- Why: every subsequent pipeline change must be individually recorded and revertible.
- Files: `agent/pipeline-changelog.md`, `plans/2026-06-12-upgrade-plan.md`.
- Commit: (this commit)
- Revert: `git revert` this commit (removes the plan and this log; no behavior changes to revert).
- Verified: n/a — documentation only; no pipeline behavior changed.
