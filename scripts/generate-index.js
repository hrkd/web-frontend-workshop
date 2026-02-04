const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const rootDir = path.join(__dirname, '..');

// vol_*ディレクトリを取得
const volDirs = fs.readdirSync(rootDir)
  .filter(name => name.startsWith('vol_') && fs.statSync(path.join(rootDir, name)).isDirectory())
  .sort();

// 各回のタイトルを取得
const slides = volDirs.map(dir => {
  const slidesPath = path.join(rootDir, dir, 'slides.md');
  if (!fs.existsSync(slidesPath)) return null;

  const content = fs.readFileSync(slidesPath, 'utf-8');
  const titleMatch = content.match(/^title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1] : dir;

  return { dir, title };
}).filter(Boolean);

// HTMLを生成
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Frontend Workshop</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #1a1a1a;
      color: #fff;
    }
    h1 {
      border-bottom: 2px solid #444;
      padding-bottom: 0.5rem;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      margin: 1rem 0;
    }
    a {
      color: #6db3f2;
      text-decoration: none;
      font-size: 1.2rem;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>Web Frontend Workshop</h1>
  <p>マークアップエンジニア／フロントエンドエンジニア向けステップアップワークショップ</p>
  <ul>
${slides.map(s => `    <li><a href="${s.dir}/">${s.title}</a></li>`).join('\n')}
  </ul>
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index.html'), html);
console.log('Generated dist/index.html');
