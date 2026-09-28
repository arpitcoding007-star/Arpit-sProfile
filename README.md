# arpit-portfolio-site

Static portfolio for Arpit Singh Rajput, deployed on Vercel.

- `data/content.json` holds every piece of copy. Edit it directly or through the CMS at `/admin`.
- `npm run build` pre-renders `content.json` into `index.html` (the browser also re-renders if the JSON is newer than the build).
- `npm run check` verifies anchors, local assets and that the pre-render is current.
- `npm run dev` serves the site at http://localhost:4321.

Photo originals go in `Pictures/` (git-ignored); optimized versions live in `assets/img/`.
