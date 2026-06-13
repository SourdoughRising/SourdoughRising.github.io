# Linecraft: Hotel Kitchen Prototype

A GitHub Pages-ready static prototype for a browser-based industrial hotel kitchen simulator.

## What changed in this reform

- Rebuilt the kitchen around professional hotel-kitchen flow:
  - Receiving Dock
  - Dry Storage
  - Walk-In Cooler
  - Protein Prep
  - Vegetable Prep
  - Sauce/Starch Prep
  - Cold Line
  - Hot Line
  - Expo / Pass
  - Banquet Holding
  - Dish Pit
- Added a single top-down virtual kitchen map.
- Added clean food flow and dirty dish return separation.
- Added a hotel-pan table builder.
- Correct pan proportions:
  - Full pan: 6 x 6
  - Half pan: 3 x 6
  - Shotgun pan: 6 x 3
- Added flexible food texture fills that clip inside any pan size.
- Added station actions, inventory, expo tickets, thermometer checks, safety/service log, and inspection score.

## How to deploy on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `game.js`, and `README.md` to the root of the repo.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and `/root` folder.
6. Save.

Your prototype should publish as a GitHub Pages website.

## Notes

This is a static frontend prototype. It does not need a server or database yet. The next major step would be adding save/load through LocalStorage and splitting the data into JSON files for ingredients, recipes, stations, equipment, and pan layouts.
