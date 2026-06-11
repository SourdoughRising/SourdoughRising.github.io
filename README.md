# Linecraft Prototype

A static browser prototype for an industrial kitchen simulator. It includes:

- Station navigation
- Hotel pan layout builder
- Correct full / half / shotgun pan footprint logic
- Flexible food textures clipped into any pan size
- Inventory panel
- Expo ticket generator
- Thermometer checks and safety log

## Deploy on GitHub Pages

1. Create a new GitHub repository, for example `linecraft-prototype`.
2. Upload these files to the root of the repository:
   - `index.html`
   - `styles.css`
   - `game.js`
   - `README.md`
3. In GitHub, open **Settings** → **Pages**.
4. Under **Build and deployment**, set the source to **Deploy from a branch**.
5. Choose the `main` branch and `/root` folder.
6. Save. GitHub will publish the project as a website.

## Pan sizing system

Each full hotel-pan bay is a 6×6 grid.

- Full pan: 6×6
- Half pan: 3×6, two fit side-by-side across the long side
- Shotgun pan: 6×3, two fit stacked across the short side

Food is not baked into the pan image. It is a repeatable top-down texture clipped inside the selected pan.
