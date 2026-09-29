# CC’s Kitchen

A static kitchen workflow app for Head Start and Early Head Start. Runs on GitHub Pages without a server or build step. Data stays in the current browser; it is not uploaded to GitHub.

## Start here

1. Download a full backup with **Backup** before changing devices.
2. Open **Kitchen setup**. Add rooms, age groups and usual expected counts. Enter your sponsor’s form references and facility checklists.
3. Check **Inventory & stock batches**. Existing quantities become opening balances; confirm batch dates and locations.
4. Add **Recipes & food portions**. Include simple foods as one-ingredient recipes. Enter ingredients in inventory units, yield, age-group portions and verified component contributions.
5. Choose **Menus**, insert recipes or use matching names, and save the weekly cycle. Photo/text imports and the bottom cycle library remain available.
6. Build a reviewed shopping list from saved menus. Review shortages, quantities and package sizes.
7. Use **Today’s Kitchen** for room counts, preparation, actual service records, infant feedings, safety checks and closeout.

## Connected workflow

- Today / Calendar: selected-day meal cards, stock due for use, receiving drafts, prep reminders and missing records.
- Plan: menus, recipe/food portion library, and room-linked substitutions.
- Supplies: stock batches, shopping/trips, receiving, and mileage.
- Records & Help: monthly records, corrections, product documentation, paperwork, Compliance Guide and setup.

Recipes link to menu names ignoring case and repeated spaces. The menu has a recipe insertion tool. Each recipe has a base serving description, yield, ingredient purchase quantities, instructions, per-age serving multipliers, component contributions and evidence references. Actual service records snapshot recipes and room plans. Editing a recipe does not rewrite previous service records. Use **Refresh plan** explicitly to update a service plan; this returns it to draft and preserves saved actual usage/counts.

Food color checks and recorded recipe reviews are separate from whole-meal checks. Basic component totals use entered quantities. Allowed alternatives, milk type, whole grain-rich foods, sugar, juice and modifications need human review. This is not automated certification or a claim submission system. The Compliance Guide links to USDA sources; configure records to your sponsor’s accepted forms.

## Stock and purchasing

Stock batches track quantity, received/use-by/opened/thawed dates, location, lot and notes. Earliest unexpired batches appear first. Expired batches are excluded from preparation and shopping availability. Record disposal by adjusting a batch with a reason. Manual aggregate edits reconcile into batch adjustments; items with stock history or recipe links cannot be deleted.

Shopping plans allocate existing stock chronologically against each service date, excluding expired stock. Unlinked menu foods and missing menus are reported. Pending deliveries are shown, but are not subtracted until posted. Review the list for package sizes and adjust before adding it. A second outstanding generated list for the same week is blocked.

Receipt OCR groups repeated line items and applies aliases, then creates a receiving draft with a compressed receipt image and extracted text. All lines start on hold. Review names, quantities, temperatures, dates and condition; mark accepted items before posting. Stock is added only at posting. The same draft cannot be posted twice. Duplicate supplier/invoice combinations are blocked, and matching scanned line sets on the same date are flagged. These checks cannot identify every differently-scanned duplicate: compare the original receipt before posting.

Held items can be resolved through a linked follow-up receiving record, preserving the original. Package conversion creates a draft, e.g. 2 cases × 6 cans = 12 inventory cans. Front and nutrition label images remain available per inventory item; receipt/receiving imports can precede those photos.

Purchase trips link shopping items, a receiving/receipt record and an existing mileage entry. Routes retain the existing Maps link + saved-distance + starting-odometer workflow. New links require manual route distance confirmation; no live routing API is used.

## Daily records

Expected children scale preparation; actual attendance and meals served remain separate, manually recorded counts. Enter actual menu, production quantities with units, leftovers, waste, substitution outcomes and actual stock pulled. Saving actual usage deducts it once. Correcting a service restores its previous usage before applying revised usage atomically; insufficient stock or save failure rolls the change back.

A complete service needs actual room counts, menu, production amounts, recorder, review checks and stock usage or an explanation. Infant feeding is separate, with a facility-approved child identifier, time, instructions reference, offered and consumed amounts. Safety records capture readings, times, corrective actions and next-day preparation reminders.

New service/safety records are due on the service date: yellow today and red after that date. Historic checklists retain their previous seven-day rule. Custom calendar tasks have due dates. Closeout checks missing records and records the reviewer. Editing service, safety or room-count records invalidates the closeout.

## Review, print and recover

Records & closeout offers month/date navigation, record search, infant corrections and change history. Core workflow corrections include reasons and before/after snapshots. This is a local edit history, not an access-controlled or tamper-proof audit system.

- **Print kitchen sheet** downloads printable HTML with room/substitution details for kitchen use.
- **Download public menu** contains only food names and weekday/meal headings.
- **Printable monthly summary** includes service and safety summaries.
- **Export month with evidence** downloads a JSON review packet with detailed records and supporting images/documents. This is not a recovery backup or sponsor claim file.
- **Backup / Full recovery backup** downloads all saved records and attachments. Restore validates the format and replaces current records after confirmation. Old backups remain compatible.

Use facility-approved identifiers and keep medical statements in the approved confidential system. Records do not sync across devices. Clearing browser data removes them. Browser storage limits apply; failed workflow saves roll back. Back up regularly and retain original documentation according to facility procedures.

## Deployment and verification

Copy all top-level `.js` files (excluding test `.cjs` files), `index.html` and `style.css` into the app folder. Keep relative paths. The deployed app is in `ccs-kitchen/`; preserve the separate repository-root website. No package installation or build is needed. `sw.js` retires the old prototype cache.

`node check.cjs` checks existing menu OCR/text parsing, aliases, receiving, routes, labels and calendar behavior. `node workflow-check.cjs` checks scaling, batch migration/expiry, atomic usage correction, receipt drafts and backup validation. `workflow-browser-check.cjs` is an isolated end-to-end smoke test using a locally available Playwright installation (adjust its import path for your machine).
