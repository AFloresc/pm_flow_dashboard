# Security Specification & Threat Model (TDD)

This document maps data invariants and threat vectors against Pro-Flow's Firestore Rules, defining testing targets to ensure a zero-trust posture.

## 1. Data Invariants

- **Users**: A user can only access or modify their own user document matching their `request.auth.uid`. They must select a valid role (`manager` or `member`).
- **Projects**: Only authenticated users can read campaigns. Managers can build/edit/delete project campaigns. Budget values must remain non-negative.
- **Tasks**: Tasks must have associated valid IDs. Progress levels must stay strictly within range 0-100.
- **Resources**: Cost rate values must remain non-negative, and types must be strictly constrained to `member` or `material`.

## 2. The "Dirty Dozen" Threat Payloads

The following payloads represent malicious access attempts that our rules mathematically block:

1. **Spoofed User Registration**: Attempt to register user settings for an arbitrary `userId` differing from `auth.uid`.
2. **Invalid Account Role Injection**: Attempt to write a role like `super_admin` instead of allowed `manager` or `member`.
3. **Budget Deletion/Underflow**: Setting a project's budget to a negative value.
4. **Task Progress Overflow**: Updating a task with progress of `150` percent.
5. **Resource Cost Underflow**: Registering a resource with a negative cost rate.
6. **Project Identity Poisoning**: Creating a project with a 2MB binary string as its Document ID.
7. **Task State Shortcutting**: Creating a task with an unsupported state string like `completed_early`.
8. **Resource Type Poisoning**: Creating a resource with type `robot`.
9. **Unauthenticated Read Queries**: Scraping projects without an active Auth session.
10. **Unauthenticated Write Queries**: Attempting to inject entries to the backlog without logging in.
11. **Client-side Claim Elevation**: Setting user profile claims without verification.
12. **Foreign Profile Modification**: Updating another user's display name or email.

## 3. Rule Integrity Test Suite

These assertions are encoded within `firestore.rules` and verified via client testing paradigms:
- `users/{uid}` updates are rejected if `userId != request.auth.uid`.
- `projects` writes are blocked if fields do not match strict types or values are underflowed.
- `tasks` updates are rejected if progress exceeds standard limits.
