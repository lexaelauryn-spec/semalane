# Pre-submission gate

Nothing in this checklist authorizes contest submission, merge to `main`, production deployment, DNS changes, secret changes, or destructive data operations.

## Engineering
- [x] Mission Contracts implemented
- [x] Verified Relay implemented
- [x] Resident-agent lifecycle implemented
- [x] Separation-of-powers enforcement implemented
- [x] Semantic conflict detection retained
- [x] Candidate Futures implemented
- [x] Judge-facing read-only Control Room implemented
- [x] Deterministic organization demo implemented
- [x] CI validates install, syntax, tests, deterministic demo, and public preflight
- [x] Repeated organization demo determinism has regression coverage

## Final live verification, after deliberate deployment
- [ ] Deploy reviewed contest build to the intended Cloudflare demo target (isolated `semalane-contest-demo` workflow prepared; execution still pending)
- [ ] Verify `/health`
- [ ] Verify `/state`, `/missions`, `/agents`, `/relay`, `/composition`, and `/futures`
- [ ] Verify Control Room on desktop
- [ ] Verify Control Room on a narrow/mobile viewport
- [ ] Verify mutation route rejects missing/invalid operator authorization
- [ ] Verify synthetic demo reset/seed path if used in recording
- [ ] Verify no private context, secrets, or internal XAEL.L material appears publicly
- [ ] Record final live URL and deployed commit SHA

## Media
- [x] Demo narration/script prepared
- [ ] Record 7–8 minute demo from final verified deployment
- [ ] Watch recording end to end
- [ ] Confirm no credentials/private material visible
- [ ] Confirm every spoken factual claim matches final build
- [ ] Upload video and record final URL

## Application
- [x] Application draft prepared
- [x] Reconcile draft with exact current contest form fields and requirements
- [ ] Add final live URL
- [ ] Add final video URL
- [ ] Owner review with ChatGPT
- [ ] Owner explicitly approves submission
- [ ] Submit

## Stop line
**STOP before the final Submit action.** The owner requested a discussion/review before anything is submitted.


## Current external form verification
Cloudflare's public competition page/form was rechecked on October 5, 2026. The application draft now mirrors the current team, project, demo-video, repository, run-instructions, and confirmation fields. The public page requests a 5–10 minute demo; the prepared script targets 7–8 minutes.

## Deployment preparation
An explicit manual-only GitHub Actions workflow, `.github/workflows/contest-preview.yml`, is prepared for an isolated Worker name, `semalane-contest-demo`. It reruns install, syntax checks, tests, and public preflight before invoking Wrangler. It is intentionally not automatic and does not replace or mutate the existing legacy live demo unless deliberately dispatched.
