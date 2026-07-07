# MyKalakar Premium Quality Audit

## Current Cross-Site Issues

- Category and subcategory routing was inconsistent between event selection, event requirements, artist search, and Spotlight Search.
- Location context from the event flow was being dropped on the artists page.
- Event cards and filter controls could overlap because the event filter dock used negative spacing and sticky behavior together.
- The UI has strong visual tokens, but several pages still mix older cinematic/glass styles with the newer solid light-orange system.
- Several labels expose implementation language such as Firebase instead of customer-facing product language.
- Footer spacing was too compressed for a premium product close.
- Admin pages are functionally dense but still visually inconsistent across cards, tables, modals, and empty states.
- Some legacy encoded icon/text artifacts remain in older files and should be cleaned.

## Page Issues

- Home: hero is visually strong, but the stacked preview cards need continuous responsive QA so they never collide at intermediate widths.
- Artists/Search: category group selection must show subcategory chips, preserve event/location context, and avoid false "No results" during loading.
- Events: public brief section needs generous spacing, no overlap, no internal implementation copy, and clearer brief-to-artist flow.
- Event Requirements: event IDs must match event selection, and category cards must expose subcategories for precise artist discovery.
- Location Selection: flow works, but state/district controls need stronger loading/error states and clearer selected-location confirmation.
- Artist Profile: video/gallery structure is solid; next upgrade is a more editorial profile hierarchy and stronger booking CTA states.
- Event Details: matching and application errors should explain why an artist can or cannot apply.
- Auth/Register/Login: forms need visual simplification, better step progress, and consistent premium input spacing.
- User Profile: needs dashboard-grade information hierarchy, saved artist/event affordances, and empty-state polish.
- Artist Dashboard: needs more compact pro tooling, status visibility, onboarding completeness, and booking pipeline clarity.
- Admin Dashboard: tables and modals need one unified admin visual system with fixed row heights, searchable filters, and safer destructive actions.
- Footer: needs spacious brand closure, stronger link hierarchy, and newsletter treatment that feels intentional rather than squeezed.

## UI And Design Tasks

- Build one design-token layer for surfaces, text, borders, shadows, spacing, buttons, inputs, cards, tables, and badges.
- Replace page-specific visual drift with shared primitives for hero, section heading, filter dock, card grid, list row, empty state, and footer.
- Create fixed card contracts per object type: artist card, event card, category card, admin stat card, profile panel.
- Make every media container aspect-ratio locked with no image-driven layout shift.
- Improve scroll rhythm: no dead zones, no sticky overlap, and section spacing in the 32-48px range depending on page type.
- Add responsive QA at mobile, tablet, desktop, and wide desktop for nav, cards, filters, profile video, and admin tables.
- Use product-facing copy everywhere; avoid internal words like Firebase in customer UI.
- Create premium empty, loading, error, and offline states for every data-driven page.

## Backend And Data Tasks

- Normalize event documents around `category`, `requiredCategories`, `artType`, `location`, `state`, and `district`.
- Normalize artist documents around `mainCategory`, `category`, `subcategory`, `artsList`, `state`, and `district`.
- Add a single matching utility used by search, event application, notifications, and admin review.
- Add tests for event-to-artist matching, location filtering, category aliases, and legacy artist records.
- Add Firestore indexes for common discovery queries once the final data contract is stable.
- Add admin validation to prevent creating events with empty or mismatched art requirements.
- Add migration scripts to clean legacy spelling issues and malformed category fields without changing live behavior unexpectedly.

## Priority Roadmap

1. Stabilize discovery: category, subcategory, location, and event matching.
2. Finish visual system: shared components and page-level spacing contracts.
3. Upgrade event flow: choose event, location, category, subcategory, artist results, inquiry.
4. Upgrade profile and booking: trust signals, portfolio, availability, and CTA clarity.
5. Upgrade admin: compact tables, clear review queues, validation, and safer operations.
6. Add QA automation: build, unit tests, visual screenshots, and mobile/desktop layout checks.
