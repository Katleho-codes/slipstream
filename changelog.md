# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2026-09-14

### Added

- shared plan config (`lib/plans.ts`) used by onboarding, settings, and upgrade screens
- `PATCH /api/employer/plan` endpoint — owner-only plan switching
- `/dashboard/upgrade` page with plan selection and real-time switch
- backend route modules split into `onboarding`, `employer`, `employees`, `payPeriods`, `payslips`, `members`, `public` (routes/index.ts aggregator)
- `lib/plans.ts` (backend) shared plan constants, `middleware/asyncHandler.ts`, `utils/auditRequest.ts`
- `sendInviteEmail` helper in `email.service.ts` with HTML template
- `tests/changePlan.test.ts` — 6 tests for the new endpoint
- frontend `lib/api/` domain modules (`client`, `types`, `auth`, `employer`, `onboarding`, `employees`, `payPeriods`, `payslips`, `members`, `invites`)
- shared UI components: `Spinner`, `EmptyState`, `SectionCard`, `PlanUsageBar`, `StepHeading`, `InlineError`, `InlinePrimaryButton`
- onboarding components: `OnboardingSidebar`, `OrganisationsStep`, `CreateOrganisationStep`, `PlanStep`, `CompleteStep`
- members modals: `InviteModal`, `ChangeRoleModal`, `RemoveMemberModal`
- payslips modal: `CreatePayslipModal`

### Changed

- settings and dashboard "Upgrade" buttons now route to `/dashboard/upgrade`
- `onboarding/page.tsx` refactored from 650 lines to 180 lines (components extracted)
- `members/page.tsx` refactored (3 modals extracted to `components/members/`)
- `payslips/page.tsx` refactored (create modal extracted)
- `members.controller.ts` refactored to use `sendInviteEmail`, `auditFromRequest`, `sendNotFound`/`sendError`
- `employee.controller.ts` uses shared `PLAN_LIMITS` from `lib/plans`
- `payslip.controller.ts` and `payPeriod.controller.ts` use `auditFromRequest`
- `email.service.ts` consolidated payslip email to use `EMAIL_SHELL`
- old monolithic `frontend/lib/api.ts` deleted; replaced by `lib/api/` domain modules
- `lib/utils.ts` re-exports `PLAN_LIMITS`/`PLAN_PRICE` from `lib/plans` for backwards compatibility

### Fixed

- removed ~30 lines of commented-out dead code in `middleware/auth.ts`

## 2026-09-12

### Added

- password reset: `sendResetPassword` config + `/forgot-password` and `/reset-password` pages
- email verification: `sendVerificationEmail` config, `/verify-email` page, resend banner on login
- public payslip verification portal (`/verify/[token]`)
- QR code on generated payslip PDFs pointing at the verify link
- `Dockerfile.dev` for the backend dev container
- pay period validation (start before end) and delete-guard returning `409` when payslips exist
- branded `from` address on invite emails, `MEMBER_ACCEPTED` audit action
- real HMAC `verifyToken` on seeded payslip

### Changed

- payslip `verifyToken` now uses the real payslip id and is verified in constant time against the issued payload
- invite page cleans up its debug logging; lint warnings in dashboard/onboarding pages removed

### Fixed

- seed net-pay reconciliation (deductions now included in totals)
- stale `employer.test.ts` rewritten as onboarding tests; vitest config points at the shared setup
- removed debug `console.log`s across backend and frontend
- removed duplicated `invite`/`invites` API namespaces and repeated types in `frontend/lib/api.ts`
- `/reset-password` wrapped in a Suspense boundary for the `useSearchParams` CSR bailout

## 2026-08-17

### Added

- select employer profile along with the actual user's details (owner)
- audit on `employee.contoller`, `payPeriod.controller`, `payslip.controller`, functions and `lib/auth.ts`
- members.controller.ts
- `middleware/requireRole` function
- `members` page in dashboard
- `invite/[token]` page for when user has clicked the invite link in their mail
- `onboarding` page
-

### Fixed

- `requireAuth` function in `middleware/auth.ts` now checks for membership
- login now redirects to `/dashboard' if onboarding is complete else `/onboarding`
- Signup now requires user's name instead of company name
- `Account` in dashboard sidebar is now `Organisation`

### Removed

- `employer.controller.ts`

## 2026-08-07

### Added

- vitest
- `tests` dir in `backend/`

### Fixed

- frontend/lib/api.ts restructured reusable api functions
