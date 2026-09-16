# CCS kitchen sync server on Render

The repository root contains the Node backend. The existing root game and ccs-kitchen static website remain unchanged.

- Branch: linecraft
- Root directory: leave blank
- Runtime: Node 24+
- Build command: npm ci
- Start command: npm start
- Health check: /health

Before enabling shared sync, attach a persistent disk at /var/data and set DATA_DIR=/var/data. Set two different random PROD_SYNC_KEY and DEBUG_SYNC_KEY values of at least 32 characters. Set SYNC_ORIGINS=https://sourdoughrising.github.io (add the exact Render service origin if using the app served by Render). Configure these privately in Render, never in this repository. Without keys, database API access returns 503 and remains disabled.

A free Render service cannot retain SQLite data through restarts. Leave sync disabled until durable storage is configured. The app remains available on GitHub Pages; enter the Render HTTPS service origin in Reports & backup after setup.

Use one instance with its attached local disk. Make database-consistent backups to a separate protected location. Shared keys authorize read/write access to their respective databases; individual account authentication is not included in this prototype.
