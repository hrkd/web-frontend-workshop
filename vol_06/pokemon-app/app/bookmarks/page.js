// app/bookmarks/page.js
import Database from 'better-sqlite3';

export const dynamic = 'force-dynamic';

export default function BookmarksPage() {
  // サーバーでSQLiteからデータを取得
  const db = new Database('app.db');
  const bookmarks = db.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC').all();
  db.close();

  return (
    <main className="p-8 max-w-xl mx-auto">
      <a href="/" className="text-blue-600 hover:underline">← 図鑑に戻る</a>
      <h1 className="text-2xl font-bold mt-4">お気に入りポケモン</h1>

      <div className="mt-4">
        {bookmarks.map(bookmark => (
          <a
            key={bookmark.id}
            href={`/pokemon/${bookmark.pokemon_id}`}
            className="flex items-center gap-4 p-4 border-b border-gray-200 no-underline text-inherit hover:bg-gray-50"
          >
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${bookmark.pokemon_id}.png`}
              alt={bookmark.pokemon_name}
              width={64}
              height={64}
            />
            <div>
              <p className="font-bold capitalize">{bookmark.pokemon_name}</p>
              <p className="text-gray-500 text-sm">{bookmark.note}</p>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
