# CC’s Kitchen

A static, dependency-free kitchen paperwork hub for GitHub Pages. Open `index.html` or serve this folder with any static web server.

## Publish on GitHub Pages

Copy `index.html`, `style.css`, `app.js`, `menu.js`, `menu-text.js`, `menu-cycles.js`, `receipts.js`, `inventory-aliases.js`, `mileage-routes.js`, `deliveries.js`, `compliance-guide.js`, `substitutions.js`, and `theme.js` to your repository root. In the repository’s Settings → Pages, select **Deploy from a branch**, your branch, and **/(root)**. All asset paths are relative, so project Pages URLs work too. No build command is required. An existing website should be preserved: these files can instead go in a `kitchen` subfolder and be visited at `/kitchen/`.

## Included

- Select a calendar day to see its tasks. Weekday templates start on first use; add custom tasks to any date.
- Green: all tasks completed. Yellow: outstanding tasks up to seven calendar days old. Red: outstanding tasks older than seven days. Future days and days without tasks are neutral. Completed days remain green; completion dates identify late work.
- Daily notes and PDF/image attachments, inventory and reorder indicators, shopping records, mileage calculated from odometers, manual CN/PFS review records, and a paperwork library.
- JSON backup and restore, including attachments.
- Menu workspace: 5 weekday columns × 3 meal rows, editable weekly menus, and photo-to-text import.

## Menu photo import

Select Menu, choose a week, and upload a PNG, JPEG, or WebP photo (up to 10 MB). The browser runs Tesseract.js 6.0.1 OCR in English, detects ruled tables and reads each meal cell separately, or uses word positions for unruled layouts to attempt to map foods into Monday–Friday columns and Breakfast/Lunch/Snack rows. Use a clear, upright photo of one week with those headings. Multiple-week pages, rotated or handwritten menus, and other layouts may require manual entry. Missing or ambiguous headings leave existing meal entries unchanged and show the extracted text for reference. Review every cell and click Save menu.

The reader downloads its code/model from external CDNs on demand; an internet connection is needed for the first read. The photo itself is processed locally, not sent to an OCR service. No API key or backend is required. The original photo preview is session-only; saved menus and backups contain the grid, source filename, and extracted text. Preserve original photos separately. Import is not nutritional or CACFP compliance verification. Old backups without menus remain compatible; restoring any backup replaces current records, including menus.

## Storage and scope

Records stay in this browser’s local storage, scoped to the site address. They do not sync across devices or users. Clearing browser data removes them. Back up regularly. Browser storage limits apply; each attachment is limited to 2 MB. Use a dedicated site origin if other apps on the same domain are not trusted. Do not store child names, health information, or sensitive personal records.

This is a local recordkeeping app, not a certification engine or a complete substitute for sponsor forms. Default tasks are editable through their record notes, and custom objectives can be added. The seven-day schedule is the requested workflow rule, not a CACFP regulatory deadline. Confirm required forms, infant/child meal patterns, retention practices, and review procedures with your sponsor or state agency.

Product-documentation reference: https://www.fna.usda.gov/cn/manufacturer-documentation (reviewed September 2026). CN labels and manufacturer PFS are distinct; PFS documents are not USDA approved. A user-recorded review does not automatically verify a CN number or establish meal eligibility.

The app opens in dark mode by default. Use the header’s Light mode / Dark mode button to switch; the appearance preference is remembered on this device separately from record backups.

## Import menu text

Under Upload menu photo, select Import menu text. Paste a day-first or meal-first list with explicit headings (for example, Monday followed by Breakfast: Milk and waffles), or a tab/pipe-separated table. Select Import to fill recognized cells. Entries without a known day and meal are not guessed. Existing cells without matching imported entries remain unchanged; replacing nonempty cells requires confirmation. Review the imported draft and select Save menu. Text import works offline and retains the pasted source in the saved menu and backup.

## Saved menu cycles

Save menu cycle posts the selected weekly menu to the local cycle library. Each menu week has one saved cycle; saving that week again updates it. New cycles default to “Cycle Week of [Monday of the week saved]”. Existing weekly records automatically appear in the library. Preview & rename opens the full meal grid, an editable name, and a source text body. Source edits do not change the meal grid. Use this cycle copies its meals into the currently selected week as a draft, leaving the original saved cycle intact. Save the draft to post it for that week. Cycles and names are included in backups; posting is local, not public sharing.

Inventory items require a production label image when created or edited: PNG, JPEG, or WebP, up to 2 MB. Existing records without images remain available and show a missing-label message. Saved labels have thumbnails, full-image previews, replacement uploads, and backup support. Uploading a label does not automatically verify its compliance.

Inventory now has separate required Front label and Nutrition label image fields (PNG, JPEG, or WebP, up to 2 MB each). Each image has its own preview and download. Existing single production-label images are preserved as front labels; add a nutrition label when editing those items. Replacing one image keeps the other. Both images are included in backups.

## Receipt scanning

Inventory → Scan receipt accepts PNG, JPEG, and WebP receipt images up to 10 MB. On-device English OCR attempts to identify priced item rows and quantities, including common quantity × price and weight lines. Totals, tax, payment and discount lines are filtered where recognized. If no quantity is printed, the review screen suggests 1 and marks it assumed. OCR is imperfect: review names, quantities and units, uncheck unwanted rows, or add missing rows before selecting Add selected items to inventory.

Repeated receipt lines are combined by item name and unit. An exact existing name/unit match (ignoring case and repeated spaces, with common unit aliases normalized) increases that item’s stock and preserves its label photos; unmatched items create new records. Multiple existing matches block import until the matching names/units are made unique. Scanning and importing the same receipt twice will count the purchase twice; review the stock change before importing. Imported records intentionally allow missing front/nutrition photos and show missing-label prompts. Add those through Edit. Inventory records retain the receipt filename and matched source line, included in backups. The full receipt photo and raw receipt text are used only in the review session and are not saved. The reader uses the same on-demand Tesseract.js dependency as menu scanning; no photo is sent to an OCR service.

## Inventory aliases

Select Aliases on the Inventory page. Add the receipt item name and preferred inventory name; save the table to apply it to future receipt imports. Names match ignoring case and repeated spaces, while package sizes and other wording must match. Each lookup applies one mapping, without following chains. Receipt review shows the alias and proposed stock change. Matching names/units increment existing stock and preserve label images; new items use the alias. Original receipt names remain in receipt metadata. Existing stock is not changed just by saving the alias table. Aliases are included in backups; older backups without aliases remain supported.

## Routes and mileage

Add trip now supports reusable Google Maps routes. Paste a Maps link, name the route, and enter its total driving mileage once. Enter a starting odometer; the ending odometer and mileage total are calculated when you save. New routes are saved along with the trip. Saved routes can be edited or reused via Log trip. Each trip retains a snapshot of its route and mileage, so editing a saved route does not rewrite historical trips. Route data is included in backups; older mileage entries remain readable/editable.

The user-provided Fairview Center → Carrs → Fred Meyer → Fairview Center route is available as a preset. Its 35.1-mile driving distance was checked on Google Maps on September 23, 2026: https://maps.app.goo.gl/xpiiSi13LxtZc2Fh8?g_st=ac . Pasting this known link prefills that verified distance. It is not live routing data. Other links must have their distance entered from Maps once; this static GitHub Pages app does not resolve arbitrary Google short links or fetch live distances. Calculated ending odometers are labeled as calculated; adjust trip mileage for detours and check against actual vehicle readings.


## Receiving deliveries

Receiving deliveries has Awaiting review and Delivery history sections. Use Receive delivery to record the supplier, date, invoice number, receiver, ordered and received quantities, temperatures, expiration dates, storage locations, and condition notes. Choose existing inventory items or enter new names. An optional PDF or image delivery document (up to 2 MB) is saved with the record.

Save draft keeps stock unchanged. Post & update stock adds only accepted quantities, applies inventory aliases, and increments matching inventory names and units while preserving label photos. Held and rejected items remain out of stock. New items can have their front and nutrition label images added in Inventory. Posted delivery records are read-only to prevent posting the same record twice. Delivery records and their attachments are included in backups.


## Compliance Guide

The workspace includes a static CACFP reference reviewed September 24, 2026: child meal portions, infant patterns, component rules, and substitutions with source links. It includes the June 8, 2026 milk-option update and October 2025 added-sugar limits. It is not an automatic compliance checker and does not refresh itself. Review current sponsor and state-agency guidance before relying on the snapshot.


## Substitutions

Add and edit rows containing Name, Room Number, Component, Avoid, and Substitute. Click any column heading to sort ascending, then again for descending; room numbers sort naturally (2 before 10). Rows persist locally and are included in backups. Older backups without substitutions remain compatible. Follow facility rules for identifying information and keep medical documents in the approved confidential system.
