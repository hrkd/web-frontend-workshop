// init-db.js
const Database = require('better-sqlite3');

const db = new Database('app.db');

// テーブルを作成
db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pokemon_id INTEGER NOT NULL,
    pokemon_name TEXT NOT NULL,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// サンプルデータを投入
const insert = db.prepare(
  'INSERT INTO bookmarks (pokemon_id, pokemon_name, note) VALUES (?, ?, ?)'
);

insert.run(25, 'pikachu', 'でんきタイプの代表格');
insert.run(6, 'charizard', 'かっこいいドラゴン風');
insert.run(150, 'mewtwo', '最強の伝説ポケモン');

console.log('データベースを初期化しました');
db.close();
