# CCS Alaska kitchen prototype

Open https://sourdoughrising.github.io/ccs-kitchen/

Static HTML, CSS and JavaScript, with a service worker and browser-local IndexedDB records. No records, photos, backups, credentials or operational data are included in this repository. Evaluate with fictional data: role selection is not authentication. Reports & backup includes manual Production/Debug sync controls; these require a separately hosted Node 24+ backend and its workspace access key.

This app is added alongside the existing Linecraft site. GitHub Pages serves this folder directly from the linecraft branch. The separate Express server provides the database API; GitHub Pages itself cannot run it.

After the first successful visit, the application shell is cached for offline use. Source links require internet. Export backups from Reports & backup. Localhost data does not automatically move to the published origin.

To update the shell, increment CACHE in sw.js and close/reopen existing app tabs after the new deployment.

