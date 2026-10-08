/**
 * upload-logo.js
 * ──────────────
 * Run this script ONCE on the VPS (or locally) to copy the brand logo
 * from the frontend /public directory into the backend /uploads folder.
 * The script then writes/updates a LOGO_URL entry in the backend .env file
 * so the email service picks it up automatically.
 *
 * Usage:
 *   node scripts/upload-logo.js
 *
 * Requirements:
 *   - Run from the MMK_backend directory  (cd MMK_backend)
 *   - The frontend folder must be a sibling directory
 *     e.g.  ../MMK_frontend(13-03)/public/Wode Logo.png
 *
 * What it does:
 *   1. Locates "Wode Logo.png" in the frontend public folder
 *   2. Copies it to  uploads/brand-logo.png  in this backend
 *   3. Prints the full public URL you should set as LOGO_URL in .env
 *   4. Optionally auto-patches .env with LOGO_URL=<url>  (safe upsert)
 */

const fs   = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────────────

// Possible frontend sibling folder names (handles both naming conventions)
const FRONTEND_CANDIDATES = [
  path.join(__dirname, "..", "..", "MMK_frontend(13-03)", "public", "Wode Logo.png"),
  path.join(__dirname, "..", "..", "MMK_frontend",         "public", "Wode Logo.png"),
  path.join(__dirname, "..", "public", "Wode Logo.png"),   // if inside a monorepo
];

const DEST_DIR      = path.join(__dirname, "..", "uploads");
const DEST_FILENAME = "brand-logo.png";
const DEST_PATH     = path.join(DEST_DIR, DEST_FILENAME);
const ENV_PATH      = path.join(__dirname, "..", ".env");

// ── Helpers ──────────────────────────────────────────────────────────────────

function findSourceLogo() {
  for (const candidate of FRONTEND_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function readEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

function upsertEnvKey(envPath, key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const regex = new RegExp(`^${key}=.*$`, "m");
  const newLine = `${key}=${value}`;
  if (regex.test(content)) {
    content = content.replace(regex, newLine);
  } else {
    content = content.trimEnd() + `\n${newLine}\n`;
  }
  fs.writeFileSync(envPath, content, "utf8");
}

// ── Main ─────────────────────────────────────────────────────────────────────

(function main() {
  console.log("\n🖼️   MMMK Wode — Brand Logo Upload Script");
  console.log("─".repeat(50));

  // 1. Find source logo
  const srcPath = findSourceLogo();
  if (!srcPath) {
    console.error("\n❌  Could not find 'Wode Logo.png' in any of these locations:");
    FRONTEND_CANDIDATES.forEach((p) => console.error("    •", p));
    console.error("\n   Please ensure the frontend folder is a sibling of the backend folder.");
    process.exit(1);
  }
  console.log(`\n✅  Found logo at:\n    ${srcPath}`);

  // 2. Ensure uploads dir exists
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log(`📁  Created uploads directory: ${DEST_DIR}`);
  }

  // 3. Copy logo to uploads/brand-logo.png
  fs.copyFileSync(srcPath, DEST_PATH);
  const sizeKB = (fs.statSync(DEST_PATH).size / 1024).toFixed(1);
  console.log(`\n✅  Logo copied to:\n    ${DEST_PATH}  (${sizeKB} KB)`);

  // 4. Determine public URL
  const env = readEnv(ENV_PATH);
  const backendUrl =
    env.BACKEND_URL ||
    env.API_URL ||
    `http://localhost:${env.PORT || 3001}`;

  const logoUrl = `${backendUrl.replace(/\/$/, "")}/uploads/${DEST_FILENAME}`;

  console.log("\n🔗  Public logo URL:");
  console.log(`    ${logoUrl}`);

  // 5. Upsert LOGO_URL into .env
  upsertEnvKey(ENV_PATH, "LOGO_URL", logoUrl);
  console.log(`\n📝  Updated .env  →  LOGO_URL=${logoUrl}`);

  console.log("\n─".repeat(50));
  console.log("✅  Done! Restart your backend server for the change to take effect.\n");
  console.log("   The email service will now read LOGO_URL from .env and embed");
  console.log("   the hosted logo in all order confirmation emails.\n");
})();
