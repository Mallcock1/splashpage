import { execSync } from "node:child_process";
import { mkdirSync, rmSync, cpSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const variants = ["preview-0", "preview-1", "preview-2", "preview-3", "preview-4", "preview-5"];

const rootOutDir = "preview-dist";
const previewsOutDir = join(rootOutDir, "previews");

rmSync(rootOutDir, { recursive: true, force: true });
mkdirSync(previewsOutDir, { recursive: true });

for (const variant of variants) {
  console.log(`\nBuilding ${variant}...`);
  execSync(`npm run build -- --base /previews/${variant}/`, {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_PREVIEW_VARIANT: variant
    }
  });

  const targetDir = join(previewsOutDir, variant);
  mkdirSync(targetDir, { recursive: true });
  cpSync("dist", targetDir, { recursive: true });
  cpSync("assets", join(targetDir, "assets"), { recursive: true });
}

const links = variants
  .map((variant) => `<li><a href="/previews/${variant}/">${variant}</a></li>`)
  .join("");

writeFileSync(
  join(rootOutDir, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NEOWATT website previews</title>
    <style>
      body {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        margin: 2rem;
        line-height: 1.5;
      }
      h1 { margin-bottom: 0.75rem; }
      ul { padding-left: 1.25rem; }
      li { margin: 0.35rem 0; }
    </style>
  </head>
  <body>
    <h1>NEOWATT website previews</h1>
    <ul>${links}</ul>
  </body>
</html>`,
  "utf8"
);

console.log(`\nDone. Built previews to ${rootOutDir}/previews/*`);
