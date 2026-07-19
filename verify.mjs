import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "README.md",
  "PLAYBOOK.md",
  "research/SOURCES.md",
  "scripts/REHEARSAL-SCRIPTS.md",
  "assets/audio/01-positioning-rehearsal.mp3",
  "assets/audio/02-innovation-story.mp3",
  "assets/audio/03-executive-exchange.mp3",
  "assets/audio/04-event-day-reset.mp3"
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  throw new Error(`Missing required files:\n- ${missing.join("\n- ")}`);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");

const screens = ["command", "quick-card", "rehearse", "roleplay", "people", "network", "sources"];
for (const screen of screens) {
  if (!html.includes(`data-screen="${screen}"`)) throw new Error(`Missing screen: ${screen}`);
  if (!html.includes(`data-nav="${screen}"`)) throw new Error(`Missing navigation target: ${screen}`);
}

const requiredIds = [
  "profileForm", "scriptText", "timerDisplay", "recordButton", "scenarioPrompt",
  "coachPanel", "connectionForm", "connectionList", "printQuickCard", "toast"
];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing required element id: ${id}`);
}

for (const audio of requiredFiles.filter((file) => file.endsWith(".mp3"))) {
  const absolute = path.join(root, audio);
  const size = fs.statSync(absolute).size;
  if (size < 1_000) throw new Error(`Audio file is unexpectedly small: ${audio} (${size} bytes)`);
  if (!html.includes(audio)) throw new Error(`Audio file is not referenced by index.html: ${audio}`);
}

new vm.Script(js, { filename: "app.js" });

const cssOpen = (css.match(/{/g) || []).length;
const cssClose = (css.match(/}/g) || []).length;
if (cssOpen !== cssClose) throw new Error(`CSS brace mismatch: ${cssOpen} opening vs ${cssClose} closing`);

const externalScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]).filter((src) => /^https?:/i.test(src));
const externalStyles = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((match) => match[1]).filter((href) => /^https?:/i.test(href));
if (externalScripts.length || externalStyles.length) {
  throw new Error(`Unexpected external runtime dependencies: ${[...externalScripts, ...externalStyles].join(", ")}`);
}

console.log(JSON.stringify({
  status: "pass",
  files: requiredFiles.length,
  screens: screens.length,
  requiredIds: requiredIds.length,
  javascript: "syntax-valid",
  cssBraces: cssOpen,
  externalRuntimeDependencies: 0
}, null, 2));
