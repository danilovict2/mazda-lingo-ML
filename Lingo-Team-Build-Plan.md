# BEAT — Four-person hackathon build plan

**Target:** a working release in 12 focused hours, with remaining time before the 24-hour deadline reserved for fixes and submission.
**Planning basis:** one person comfortable with React, one comfortable with Python, and two able to work on content/data and integration. Assign the roles by strengths.
**Status:** proposed tasks to copy into your GitHub repository and board. Software capabilities have been checked against documentation; the complete speech stack has not yet been installed or validated for this project.

## 1. Define the release

**Product:** a minimal daily speech game, with Explore and Expert tracks sharing the same interface.

### Required flow

Choose a track → five short rounds → explanation after each answer → results → share.

| Round | Explore | Expert | Implementation |
|---|---|---|---|
| Hear the stress | Tap the strongest syllable in a familiar recorded word. | Identify the stress in a less obvious pronunciation. | Curated audio, syllable choices, stored answer. |
| Find the pattern | Choose a word with the same stress pattern. | Infer a pattern from word families or identify an exception. | Same choice component; dictionary-assisted content preparation. |
| Hear the meaning | Choose the correction implied by emphasis. | Choose the most plausible conversational context. | Curated recordings and answer options. |
| Match the rhythm | Match a recording to a simple dot pattern. | Match the timing of unrelated recorded sentences. | Stored beat times and a small SVG dot display. |
| Say it | Repeat a short phrase with indicated emphasis. | Infer emphasis from a communicative goal. | Recorder, replay, and a narrowly tested audio analyzer. |

Ship one daily set per track: ten questions total. A second set is optional. Keep the dated manifest explicit; show that the next puzzle is not available when prepared content runs out.

### Scope decisions

- Keep the radar chart small: word stress, rhythm, meaning, speaking. Display assessed question counts. Leave speaking unassessed when the recording cannot be scored.
- Label results as today's performance. Keep Explore and Expert histories separate.
- Make live emphasis scoring conditional on the hour-six evaluation. If it fails, the fifth round becomes unscored record-and-replay practice; the score displays four assessed questions.
- Stretch: one real spectrogram question replacing an existing Expert round, and a second daily set.
- Later: mouth tracking, accounts, cross-device progress, a large content bank, generalized speech assessment, and adaptive practice.

## 2. Assign one owner to each workstream

Use A–D until you replace them with GitHub usernames.

| Owner | Main work | Concrete deliverables | Reviews |
|---|---|---|---|
| A — Frontend/game | Screens, question component, daily game state, recorder UI | Explore/Expert selector; audio player; answer selection; feedback; progress; microphone states | D reviews A |
| B — Speech/backend | Audio decoding, alignment, prominence analysis, scoring endpoint | A working local audio experiment; FastAPI endpoint; success/uncertain/error handling; tested model dependencies | C checks linguistic behavior; D checks API integration |
| C — Content/product/QA | Question bank, recordings, explanations, difficulty, content validation, user testing | Ten reviewed questions; reference audio; stress-pattern preparation script; content checks; demo script | B reviews audio labels; A checks readability |
| D — Platform/integration/results | Repository bootstrap, shared contracts, deployment, local history, radar/share, release | Initial deployed app; documented contracts; results screen; GitHub checks; final release and setup instructions | A reviews results; B reviews runtime setup |

**Suggested role for Paula:** C, including writing the dictionary/content-validation scripts and leading acceptance testing. This is a coding and product role. Swap if your team's technical strengths suggest a better assignment.

Everyone tests and helps fix their own area during the final phase. D coordinates merges but should not become the only person allowed to review or merge.

## 3. Recommended tools

### Shared application stack

| Need | Pick | Purpose / limit | Owner |
|---|---|---|---|
| Web app | React + TypeScript + Vite | One reusable question screen and a small amount of shared state. | A |
| Styling | Plain CSS and a few reusable components | Use the existing minimal mockups as guidance. | A |
| Reference audio playback | Browser audio element | Plays pre-recorded clips; user initiates playback. | A |
| Microphone capture | Browser MediaRecorder | Captures a supported browser audio format; backend decodes it. | A |
| Audio API | FastAPI + Uvicorn + python-multipart | Receives audio and puzzle ID as multipart form data. | B |
| Audio format conversion | FFmpeg | Converts uploaded browser audio into the analysis format. | B |
| Word timing | WhisperX | Supplies estimated word boundaries. It does not directly grade emphasis. | B |
| Prominence | Wavelet Prosody Toolkit | Combines acoustic features and timed annotations to estimate prominence. | B |
| Timing annotation files | Python tgt | Converts alignment output into TextGrid input for the prosody toolkit. | B |
| Dictionary stress | Python pronouncing | Finds expected pronunciations and stress patterns in the CMU dictionary. Use during content preparation. | C |
| Rhythm intervals | NumPy | Compare manually checked beat intervals, normalized for speaking speed. | C/B |
| Radar chart | Recharts RadarChart | Render only assessed skill results. | D |
| Progress | Browser localStorage | Persist date, track, puzzle IDs, first attempts, and completion. | D |
| Collaboration | GitHub Issues, Projects, pull requests | One repository and one board. | D/all |
| Checks | Existing frontend typecheck/lint/build + pytest | Validate meaningful contracts, scoring bookkeeping, and error handling. | D/B/C |
| Hosting | Vercel for the frontend; Render web service for Python | Prove backend model loading and RAM requirements early. | D/B |

### Optional tools

- **wavesurfer.js:** waveform, Record, and Spectrogram plugins when those visuals improve a game. Native audio and MediaRecorder are sufficient for the first working loop.
- **librosa + Matplotlib:** prepare real pitch/energy/spectrogram images offline for Read the Sound. These are not replacements for word alignment.
- **MediaPipe Face Landmarker (@mediapipe/tasks-vision):** a later mouth-shape exercise. It provides landmarks; the team would implement and validate the coaching logic.
- **GitHub Desktop:** suitable for teammates who prefer a GUI. It uses the same branches and pull requests.

A owns frontend dependency changes; B owns Python dependency changes. Commit working lockfiles or pinned dependency versions once the first clean setup succeeds. The proposed speech stack is a candidate until B proves it runs together.

## 4. Agree on interfaces before parallel coding

Spend at most 30 minutes on these decisions. D writes them down; A, B, and C approve the examples.

### Question format

Document a small discriminated format in contracts/puzzle.schema.json.

| Field | Meaning |
|---|---|
| id | Stable unique puzzle ID. |
| track | explore or expert. |
| type | word_stress, pattern, meaning, rhythm, or speak. |
| skill | word_stress, rhythm, meaning, or speaking. |
| prompt | Player-facing instruction. |
| audioUrl | Optional reference clip path. |
| choices | Choice IDs and display text or audio/dot data, for choice games. |
| correctChoiceId | Required for a choice game; absent for a speaking task. |
| explanation | One brief explanation shown after answering. |
| targetWordIndex | For speaking tasks: zero-based target in the approved word sequence. |
| referenceText | The exact approved phrase for speaking tasks. |
| referenceBeatTimes | Optional seconds measured in the actual reference clip. |

Keep the source content in content/. D adds a documented build step copying the public assets into the frontend output; the backend loads the same manifest for speaking prompts. Avoid editing two independent copies of the answer key.

### Audio API

- GET /api/health: reports whether the service is running and whether analysis is ready.
- POST /api/analyze: multipart fields audio and puzzle_id.
- The backend looks up reference text and target emphasis from the approved content.
- Successful output includes puzzle_id, status, target_word_index, detected_word_index, match, and words.
- Each item in words contains text, start_s, end_s, and prominence.
- status is ok, uncertain, or invalid. For uncertain/invalid, match and detected_word_index may be null.
- HTTP failures such as service unavailable remain distinct from a linguistic mismatch.
- The frontend supports recording, uploading, analyzing, success, uncertain, failed, and skipped states.

Proposed upload limit: 10 seconds and 5 MB, enforced in both UI and backend. Define a client timeout, then tune it after measuring real hosted latency. Delete temporary user recordings after processing. Keep developer fixtures clearly labeled and disabled in the public scoring path.

## 5. Repository ownership

| Path | Primary owner |
|---|---|
| web/src/components/, web/src/features/game/ | A |
| web/src/features/recording/ | A, consuming B's endpoint |
| web/src/features/results/, web/src/lib/progress.ts | D |
| server/app/, server/tests/audio/ | B |
| content/, tools/content/ | C |
| contracts/, deployment configuration, GitHub workflows | D, with affected owners reviewing |
| README.md | D for setup; C for product/demo sections |
| docs/qa.md, docs/demo.md | C |

D creates the initial skeleton and merges it before everyone branches. Route changes to shared application entry files through A. Coordinate schema changes with all consumers before merging.

## 6. Full lifecycle and checkpoints

Times are elapsed working time from kickoff.

| Phase | Time | Team activity | Exit condition |
|---|---|---|---|
| Define | 0:00–0:30 | Agree on the five rounds, two tracks, owners, and fallback. | Everyone can describe the same release. |
| Design and setup | 0:30–1:00 | D scaffolds repo/contracts; A defines component layout; C drafts content; B begins dependency setup. | App and API skeleton run; example question/response agreed. |
| Prove and build | 1:00–3:00 | A builds choices; B proves real audio pipeline; C records and labels clips; D deploys the shell and health endpoint. | One full question works, audio experiment returns word prominence. |
| Integrate | 3:00–6:00 | Connect content, game loop, recorder/API, and results. Run the full speech stack on the intended host. | Both tracks playable end-to-end. Decide whether speaking is scored. |
| Validate | 6:00–8:00 | All four test; C runs short tests with people outside the team if available. | No blockers in answer flow, audio, scoring, or saved progress. |
| Polish and release | 8:00–10:00 | Fix usability, improve explanations, complete documentation and sharing. | Clean install and deployed smoke test pass. |
| Demonstrate and submit | 10:00–12:00 | Freeze features; rehearse; record backup; prepare submission. | Working URL, repository, demo, and accurate capability statement ready. |
| Follow up | After submission | Log feedback, limitations, bugs, and next experiment. | Clear backlog and one priority for the next iteration. |

### Stop rules

- If the audio dependencies cannot be made to run after a 60-minute focused attempt, B and D make an explicit fallback decision. Do not let the entire team wait.
- By hour three, B must show different emphasis readings producing meaningfully different outputs.
- By hour six, B and C evaluate fresh recordings from multiple speakers. Fit any decision threshold on earlier examples, then check new examples.
- If the hosted analyzer is unreliable, keep the daily game available and use unscored speaking practice. Explain any local-only demonstration accurately.
- After hour eight, all new ideas go to the Later column. Exception: completing a required missing part of the agreed release.

## 7. GitHub setup and daily workflow

### Initial setup — D, with the team

1. Create one shared repository and add the three teammates as collaborators.
2. Create a GitHub Project with Backlog, Ready, In progress, Review, and Done.
3. Use priority labels P0 (required), P1 (stretch), and bug. Assign one owner to every issue.
4. Use one milestone: Hackathon MVP.
5. Keep main deployable. Require a teammate review and passing checks where repository settings allow; otherwise follow the same rule as a team.
6. Commit the initial frontend/backend skeleton, configuration example, source content example, and interface documents.
7. All four confirm they can clone and run the skeleton.
8. Store credentials through local environment configuration and hosting settings. Keep model downloads, generated caches, and player recordings out of Git.

### One issue → one short branch → one pull request

Use descriptive names such as feat/question-screen, feat/audio-analysis, content/day-one, or fix/mic-denied.

Example commands, run from a clean working tree:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/question-screen

# Make and check your changes.
git add web/src/features/game/
git commit -m "Add reusable question screen"
git push -u origin feat/question-screen
```

Open a pull request into main, link the actual issue number, and request the paired reviewer. Keep changes small enough to review in a few minutes.

If main changes while your branch is open:

```bash
git fetch origin
git merge origin/main
# Resolve any conflicts, run the relevant checks, then push.
git push
```

After the PR merges, switch to main and pull before starting another branch. Coordinate changes to shared files; ask the other file owner to help resolve a conflict when necessary. Avoid overwriting their work or force-pushing shared branches.

### Pull request checklist

- Linked issue and one-sentence description.
- Screenshot for UI changes or a sample request/result for API changes.
- Relevant checks completed and any remaining limitation stated.
- Content/API format changes called out.
- One teammate has reviewed it.

Check in for five minutes every two hours: what works, what is blocked, and what needs to merge next. Flag a blocker after 15–20 minutes of being stuck.

## 8. Copy-ready GitHub issues

These are planning IDs; GitHub will assign its own issue numbers. Each row is intended to become one issue. Close it only when its acceptance check passes.

| ID | Issue title | Owner | Priority | Depends on | Acceptance check |
|---|---|---|---|---|---|
| SET-01 | Bootstrap shared repo, app, API, and board | D | P0 | Kickoff | Four teammates run the skeleton; board and ownership exist. |
| SET-02 | Agree question schema and audio API examples | D + A/B/C review | P0 | SET-01 | One choice question, one speaking prompt, and all response states are documented. |
| UI-01 | Build reusable choice question and audio player | A | P0 | SET-02 | A real question can be heard, answered once, and explained; no pre-answer stress spoilers. |
| DATA-01 | Prepare dictionary stress helper and ten-question bank | C | P0 | SET-02 | Five valid questions per track; pronunciation variants are reviewed. |
| DATA-02 | Record references, label emphasis, and mark rhythm beats | C | P0 | DATA-01 draft | All referenced clips exist; another teammate confirms each answer. |
| AUD-01 | Prove alignment and prominence on contrasting recordings | B | P0 | SET-02 | Same sentence with different emphasis produces inspectable word timings and prominence. |
| OPS-01 | Deploy frontend shell and API health endpoint | D | P0 | SET-01 | HTTPS URLs load from a second device; backend health is reachable. |
| UI-02 | Implement track selection and daily five-round navigation | A | P0 | UI-01, DATA-01 draft | Both tracks complete through feedback and results using real content. |
| AUD-02 | Expose audio analysis endpoint and failure states | B | P0 | AUD-01, SET-02 | Uploaded browser audio decodes; response follows contract; invalid audio is handled. |
| UI-03 | Connect recording, replay, upload, and analysis feedback | A | P0 | UI-02; contract sufficient to start | Real browser upload reaches API; denied mic, timeout, uncertainty, and retry work. |
| DATA-03 | Validate content and provide clear explanations | C | P0 | DATA-01, DATA-02 | Unique IDs, resolvable asset paths, valid choice answers, and explanations pass checks. |
| RESULT-01 | Persist progress and build results, radar, and sharing | D | P0 | SET-02, UI-02 interface | Refresh preserves first attempts; track histories separate; unknown skills unscored; share text works. |
| OPS-02 | Add build and targeted validation checks to PRs | D | P0 | SET-01 | Frontend build/typecheck and lightweight backend/content checks run without downloading speech models. |
| AUD-03 | Evaluate fresh clips and decide scored vs practice mode | B + C | P0 | AUD-02, UI-03 | Record results for correct emphasis, wrong emphasis, and silence from multiple speakers; make hour-six decision. |
| OPS-03 | Run full speech pipeline on intended host | D + B | P0 | AUD-02, OPS-01 | Model loading, memory, audio decoding, CORS, and measured latency work on the live URL; otherwise fallback selected. |
| QA-01 | Test both tracks and edge cases on deployed build | C + all | P0 | UI-02, UI-03, RESULT-01, OPS-03 | Release checklist below passes; blockers become owned bug issues. |
| RELEASE-01 | Finish README, freeze release, and capture backup demo | D + C | P0 | QA-01 | Setup instructions reproduced; known limits stated; last working commit tagged; backup recording clearly labeled. |
| DEMO-01 | Rehearse and submit project | C + all | P0 | RELEASE-01 | Demo fits event limit; URLs open for a new viewer; attribution and requirements checked. |
| EXTRA-01 | Add one real Read the Sound question | C + A | P1 | All P0 core flow works | Image generated from actual clip; answer validated; question replaces an existing Expert round. |
| EXTRA-02 | Add a second prepared daily set | C | P1 | QA-01 | Date/track mapping and all assets validated. |
| FOLLOW-01 | Summarize user feedback and choose next experiment | C + all | After demo | DEMO-01 | List observed confusion, audio errors, and the highest-value next step. |

## 9. What B actually builds for speech

1. Install a working pinned combination of WhisperX and Wavelet Prosody Toolkit in an isolated Python environment.
2. Load alignment models once and retain them between requests where runtime resources permit.
3. Decode the browser recording to WAV using FFmpeg.
4. Estimate word timing; check the phrase and alignment quality before trusting word-level results.
5. Write timed annotations with tgt.
6. Run the toolkit's headless prominence analysis and parse its output.
7. Apply a narrow rule calibrated for the chosen phrase and intended contrast. Return uncertainty for ambiguous cases.
8. Package analysis as the documented API and test with A's actual browser recording format.

Scope the first experiment to one short phrase and two or three intended emphasis readings. Dictionary stress and transcription alone cannot establish what a player emphasized. General syllable-level production scoring would require additional alignment and validation work.

The phrase is known in the game, but an aligner can still attempt to fit the wrong spoken words; include wrong/missing-word examples in evaluation. Do not equate a successfully generated timestamp file with correct speech.

## 10. Release checklist

### Content and gameplay

- [ ] Both tracks finish with the intended number of questions.
- [ ] Audio starts when requested and stops when leaving a question.
- [ ] Questions have one defensible intended answer for the selected recording.
- [ ] Perception questions do not reveal the answer through capital letters or highlighted beats.
- [ ] Each answer gets a short explanation.
- [ ] Refresh and replay do not silently improve the stored first-attempt result.
- [ ] Daily IDs and track selection are stable; prepared-content exhaustion has a clear state.

### Audio and scoring

- [ ] Correct emphasis, deliberately wrong emphasis, silence, and wrong words have been tried.
- [ ] Microphone denial and unsupported/failed capture have clear recovery paths.
- [ ] The API accepts the browser's real recording format.
- [ ] No uncertain or skipped attempt is displayed as a correct answer.
- [ ] Practice-only speaking is excluded from the denominator and speaking radar value.
- [ ] Hosted response time is measured; loading and timeout states fit the observed result.
- [ ] Temporary player recordings are removed after processing.

### Delivery

- [ ] App works in the demo browser and at a phone-width layout.
- [ ] A person outside the original setup can open the deployed URL.
- [ ] Frontend origin is permitted by backend CORS configuration.
- [ ] Model files and system dependencies are available on the host.
- [ ] README covers setup, environment variables, running, and limitations.
- [ ] Demo uses the final deployed commit; a last-working release can be restored.
- [ ] Backup video is labeled as recorded.
- [ ] Submission URLs, team names, and event-specific requirements are complete.

## 11. Demo and follow-up

### Suggested 2–3 minute demo

- 20 seconds: the communication problem and daily-game concept.
- 30 seconds: complete one Explore question.
- 30 seconds: show how Expert requires more inference.
- 40–60 seconds: demonstrate the speaking feature with two emphasis patterns, if it passed evaluation.
- 20 seconds: show actual results and share output.
- 20 seconds: explain what the prototype measures and the next validation step.

Show a live, working path. If the analyzer is in practice mode, describe it that way. A microphone or backend failure should lead to the normal fallback, then the clearly labeled recorded example.

After submission, review actual user mistakes and acoustic failures. Prioritize validating stress feedback across speakers before expanding to paragraph analysis or broad pronunciation claims. Consider a separate mouth-shape prototype only after the core game is reliable.

## 12. Documentation links

Verified documentation for the proposed tools; these links establish capabilities, not project-specific accuracy.

- [React with Vite](https://react.dev/learn/build-a-react-app-from-scratch)
- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [FastAPI forms and files](https://fastapi.tiangolo.com/tutorial/request-forms-and-files/)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [Browser MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [WhisperX](https://github.com/m-bain/whisperX)
- [Wavelet Prosody Toolkit](https://github.com/asuni/wavelet_prosody_toolkit)
- [Prosody toolkit headless tools](https://github.com/asuni/wavelet_prosody_toolkit/blob/master/tools.rst)
- [TextGridTools (tgt)](https://github.com/hbuschme/TextGridTools)
- [pronouncing tutorial](https://pronouncing.readthedocs.io/en/latest/tutorial.html)
- [WaveSurfer](https://wavesurfer.xyz/)
- [Recharts RadarChart](https://recharts.github.io/en-US/api/RadarChart/)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [FastAPI on Render](https://render.com/docs/deploy-fastapi)
- [Docker on Render](https://render.com/docs/docker)
- [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js)

