# STAGE 3: HAWK'N CM PAGE-STRUCTURE MODERNIZATION

## Objective

Continue the existing Hawk'N CM frontend modernization on branch `feat/UI-updates`.

**The existing visual theme is frozen. Do not redesign, replace, reinterpret, or change the theme.** We are modernizing the STRUCTURE and PRESENTATION of pages, not introducing a new design system.

Use the current Hawk'N CM screenshot of Admin → People Management as a reference for the application's existing appearance. Preserve its established visual identity while improving how information is organized, displayed, navigated, and used.

Do not return only a plan, mockup, checklist, or sample components. Inspect the real repository and begin implementing the actual page-layout improvements in code during this task.

## 1. Mandatory constraints

Preserve the current:

- Navy-blue sidebar and existing Hawk'N logo presentation.
- Existing primary blue, background, surface, border, text, and status colors.
- Existing typography and overall corporate visual identity.
- Existing navigation, routes, role-based access, and permissions.
- Existing APIs, request methods, endpoints, payloads, response handling, and backend contracts.
- Existing business logic, form validation, filters, sorting, pagination, actions, and workflow transitions.
- Existing authentication, logout, notifications, and profile-menu behavior.
- Existing data sources and loading, empty, error, and success states.

Do not change the backend.

Do not add a new color theme, dark mode, glassmorphism, neumorphism, gradients, decorative animations, a replacement component library, or a new visual framework.

Do not change theme tokens simply because another palette looks better. Stage 2 already established shared styling foundations. Reuse those foundations and the actual styling conventions already present in the repository.

Do not replace real API-driven data with mock data. Do not remove features, buttons, fields, table columns, permissions, or user actions just to make the layout look cleaner.

## 2. Start with repository verification

Before editing:

1. Confirm the current directory, branch, and Git working-tree status.
2. Confirm the latest Stage 2 changes are present.
3. Read `AUDIT.md` completely.
4. Inspect the actual current implementation of the relevant pages, layouts, styles, shared components, routes, and services.
5. Check `package.json` and identify the real build and lint commands.
6. Inspect existing page data flows and component props before changing their structure.
7. Identify files that are empty, incomplete, or unused. Do not invent their intended behavior or silently fill them in as part of a visual redesign.
8. Record the baseline build and focused lint results if the environment permits.

The ZIP audit is background evidence only. The current working tree is authoritative.

If Git or local tooling is broken, report the exact issue. Continue with safe source inspection and implementation where possible, but do not claim that changes were committed, pushed, or tested when they were not.

## 3. What “modernize the UI” means

Improve the actual page composition using the existing theme.

Focus on:

- Clear page headers with title, concise supporting text, and correctly positioned existing primary actions.
- Better alignment, spacing, grouping, and responsive content width.
- Logical grouping of related information into sections.
- More readable data-heavy pages and tables.
- Better positioning of existing search fields, filters, tabs, and action controls.
- Improved information hierarchy for page titles, section headings, metadata, labels, and supporting details.
- Consistent card layouts where cards are appropriate, without wrapping everything in unnecessary cards.
- Clearer empty, loading, error, and no-results layouts using existing states and components.
- Better responsive behavior for laptop, tablet, and narrow mobile widths.
- Accessible labels, keyboard navigation, focus visibility, semantic HTML, and adequate contrast using the existing theme.
- Consistent positioning of profile actions, notification controls, and page-level navigation.
- Practical improvements to long tables, wide content, forms, task queues, and Kanban layouts.

Do not add visual complexity for its own sake. The result should look like a more carefully designed version of the existing Hawk'N CM product.

## 4. Use the supplied People Management screenshot correctly

The screenshot shows the current Admin → People Management page.

Preserve its existing identity:

- Dark navy sidebar.
- Existing blue active-navigation treatment.
- White top navigation bar.
- Light gray page background.
- White data surfaces.
- Existing blue primary action styling.
- Existing typography, status colors, and border treatment.

Improve the page structure where useful:

- Make the page heading and its description align cleanly with the primary action.
- Arrange search and any existing filters in a clear toolbar above the table.
- Improve table readability, column alignment, spacing, and responsive overflow.
- Keep user name and email information easy to scan.
- Keep role, employee classification, and status visually distinguishable using existing colors and meanings.
- Align Profile and Edit actions consistently.
- Preserve every existing row, field, action, search behavior, permission check, and data source.
- Preserve the existing sidebar and top-navbar behavior.

Do not reproduce the screenshot as a static mockup. Implement the improvements in the real React page and its actual shared components.

## 5. Implement in a safe sequence

### Step A: Shared page structure

Inspect and improve existing shared layout components only where needed:

- `src/layouts/DashboardLayout.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/TopNavbar.jsx`
- `src/components/layout/PageHeader.jsx`, if it exists and is appropriate
- Existing shared containers, section wrappers, and page-level toolbar patterns

Do not create duplicate components if equivalent ones already exist.

Do not invent missing shared components until you have verified their consumers, required props, and intended behavior.

### Step B: Admin pages

Start implementation with the Admin role, using the screenshot's People Management page as the first real implementation target.

Inspect the route configuration and locate the exact People Management page component. Modernize its structure while preserving its functionality.

Then continue with other implemented Admin pages, prioritizing:

1. Overview/dashboard.
2. People Management.
3. Company Profile and Company Policies.
4. Roles & Responsibilities and Employee Hierarchy.
5. HRMS and Client Management.
6. Project Management and Operations.
7. BRD Approval, Deployment Planning, Development Monitoring, Delivery & Handover, and Notifications.

Use the actual existing route and component names. The list above is a priority guide, not permission to invent missing pages.

### Step C: Remaining roles

After the Admin pages, continue through all existing implemented role pages:

- HR.
- BDE.
- Project Lead.
- Developer.
- Tester.
- Client.

Prioritize pages with high information density and repeated workflows.

Use consistent shared layout conventions across roles, while respecting the different purposes of dashboards, employee records, project planning, Kanban boards, testing queues, bug lists, approvals, and client-facing pages.

Do not make every role's dashboard identical. Consistency should come from shared spacing, hierarchy, controls, and layout conventions, not from forcing different workflows into one template.

### Step D: Page-level implementation rules

For every page being changed:

1. Read the entire existing page component.
2. Trace the data and callbacks passed to its children.
3. Identify all existing visible fields, controls, states, and actions.
4. Preserve those features and their behavior.
5. Restructure the JSX and existing styling to improve the page composition.
6. Reuse existing shared components where appropriate.
7. Avoid unrelated refactors.
8. Avoid duplicating global CSS or adding broad, brittle selectors.
9. Avoid changing API or business logic.
10. Inspect the diff immediately after each logical group of changes.

If a page has an existing bug or incomplete API integration, document it separately. Do not disguise it with hardcoded data or expand the scope into a backend fix.

## 6. Zero-byte and incomplete files

`AUDIT.md` records several files that were zero-byte in an earlier inspection, including service, data, styling, and page modules.

Verify their current state before making assumptions.

Do not automatically populate zero-byte files merely to complete the visual task. Determine whether each is imported, referenced, required by a route, or intentionally unused.

If a missing module blocks a page implementation:

- Trace its imports and expected consumers.
- Determine the intended contract from existing code.
- Implement only what is supported by that evidence.
- Preserve API contracts and workflow behavior.
- If the intended behavior cannot be established safely, leave the file unchanged and report the blocker.

Never create speculative permissions, mock services, fake project records, or invented API response structures.

## 7. Testing and verification

After implementation:

- Run the production build using the environment configuration required by the repository.
- Run focused ESLint on all modified JavaScript/JSX files.
- Run the repository's available tests, if any.
- Inspect the final Git diff and check for whitespace errors.
- Verify imports and route references.
- Check that no backend files were changed.
- Check that no API endpoint, payload, business rule, role permission, or validation was modified.
- Check that no controls or table fields were accidentally removed.
- Check responsive layout behavior where browser tooling is available.
- Report any test or lint failures accurately, distinguishing pre-existing failures from regressions introduced by these changes.

Do not claim browser-level verification unless it was actually performed.

Do not attempt to silence the entire existing ESLint backlog through unrelated bulk edits.

## 8. Implementation and Git rules

Stay on `feat/UI-updates`.

Do not switch to `staging`, merge into `staging`, or push directly to `staging`.

Do not commit or push automatically. Leave the implementation available for review.

Do not use `git add .`. Preserve unrelated working-tree changes and stage only explicitly reviewed files if a commit is requested later.

## 9. Final report

When you have implemented the work, report:

1. The exact pages and components changed.
2. What structural improvements were made.
3. Which existing functionality was preserved.
4. Build results.
5. Focused lint and test results.
6. Known pre-existing failures and unresolved blockers.
7. Any pages not completed and why.
8. The next most useful implementation step.
9. Also tell me what to view, after running, what to verify manually.

Do not report a page as completed if it was only inspected or planned.

## Begin now

Verify the current branch and Stage 2 state, then start implementing the real People Management page structure. Continue to the next suitable Admin pages and then the other roles as time and repository state permit.

**Final reminder: THE THEME MUST NOT CHANGE. Improve how the existing UI is structured and presented, not its visual identity. Write the actual code, verify it, and leave all changes uncommitted for review.**
