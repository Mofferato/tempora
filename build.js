// Builds Tempora from src/ into one self-contained file.
//   node build.js   ->  index.html              (full document, open locally)
//                      dist/tempora-artifact.html (body-only, for hosted publishing)
// The Tempora platform server (server/server.js) serves index.html as-is.
const fs = require('fs');
const path = require('path');

const src = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const JS_ORDER = [
  'data-core.js', 'data-prehistory.js', 'data-eras1.js', 'data-eras2.js', 'data-eras3.js', 'data-eras4.js', 'data-world.js',
  'data-stats.js', 'data-countries.js', 'data-countries2.js', 'data-regions.js', 'data-extra.js', 'data-life.js',
  'engine.js', 'engine-player.js', 'genetics.js', 'engine-world.js', 'personality.js', 'settlements.js', 'society.js', 'politics.js',
  'ui.js', 'ui2.js', 'ui3.js', 'ui4.js', 'delta.js', 'places.js', 'places2.js', 'household.js', 'auto.js', 'profile.js', 'introduce.js', 'lifedock.js', 'phone.js', 'sports.js',
  'legacy.js', 'ai.js', 'sound.js', 'fusion.js', 'platform.js', 'community.js', 'tree.js', 'late.js', 'main.js',
];

function bundle() { return JS_ORDER.filter(f => fs.existsSync(path.join(__dirname, 'src', f))).map(f => `/* ---- ${f} ---- */\n${src(f)}`).join('\n'); }

function build() {
  const css = src('style.css') + (fs.existsSync(path.join(__dirname, 'src', 'style2.css')) ? '\n' + src('style2.css') : '');
  const js = bundle();
  const shell = src('shell.html').replace('/*CSS*/', () => css).replace('/*JS*/', () => js);

  const [head, rest] = shell.replace('<!--DOC-->', '').split('<!--BODY-->');
  const body = rest.replace('<!--END-->', '');

  const full = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`;
  fs.writeFileSync(path.join(__dirname, 'index.html'), full);
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  // Hosted viewers block file downloads, so that build hides the Download button (Copy still works)
  const hosted = body.replace('<script>', '<script>\nwindow.TEMPORA_HOSTED = true;');
  fs.writeFileSync(path.join(__dirname, 'dist', 'tempora-artifact.html'), `${head.trim()}\n${hosted.trim()}\n`);
  console.log(`index.html ${(full.length / 1024).toFixed(1)} KB`);
}

module.exports = { JS_ORDER, bundle };
if (require.main === module) build();
