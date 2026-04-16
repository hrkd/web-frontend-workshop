---
title: 第六回：Webアプリケーションと外部接続 2
---

# Webアプリケーションと外部接続 2

フロントエンドエンジニア・マークアップエンジニア向け<br>ステップアップワークショップ 第六回

---

## 前回のおさらい

---

- **API**はソフトウェア同士がデータをやり取りするための窓口
- **CSR**ではブラウザがAPIを叩いてHTMLを生成する
- CSRには適さないケースがある
  - **機密性**：APIキーやDB接続情報をブラウザに渡せない
  - **SEO**：検索エンジンやOGPクローラーにコンテンツを見せられない

---

今回はこれらの課題を解決する**SSR**を、<br>Next.jsを使って理解します。

さらに**データベース（DB）**という<br>外部接続についても学びます。

---

## 目次

1. Next.jsとSSR
2. SSRが活きるポイント
3. データベースへの接続
4. 演習：Next.jsでポケモン図鑑を作る

---

## 1. Next.jsとSSR

---

### Next.jsとは

ReactベースのWebフレームワーク。

**SSR・SSG・CSRをページごとに使い分けられる**のが特徴。<br>第四回で学んだレンダリング手法をすべてカバーしている。

---

### サーバーコンポーネント

Next.jsでは、コンポーネントを `async function` で定義すると<br>**サーバーコンポーネント**になる。

サーバーコンポーネント内の `fetch` は<br>**サーバー上で実行**される。

---

```jsx
// これがサーバーコンポーネント
export default async function Home() {
  // この fetch はサーバーで実行される（ブラウザではない）
  const response = await fetch(
    'https://pokeapi.co/api/v2/pokemon?limit=20'
  );
  const data = await response.json();

  return <div>{/* データを使ってHTMLを生成 */}</div>;
}
```

---

### CSR版との違い

CSR版では、「読み込み中...」を先に表示しておいて<br>fetch後に `ReactDOM.createRoot().render()` でReactをマウントする<br>という段取りが必要だった。

SSRではデータ取得が表示**前**に完了する。<br>だから関数の中で直接 `await fetch()` するだけで済む。

---

### CSR版 vs SSR版

| | CSR版（前回） | SSR版（Next.js） |
|---|---|---|
| `fetch` の実行場所 | ブラウザ | サーバー |
| データ取得のタイミング | ページ表示**後** | ページ表示**前** |
| 「読み込み中...」 | ある | ない |
| HTMLソースにデータが含まれるか | 含まれない | 含まれる |

---

### App Router：ファイルベースルーティング

`app/` フォルダのファイル構造がそのままURLに対応する。

```
app/page.js              → /
app/about/page.js        → /about
app/pokemon/page.js      → /pokemon
app/pokemon/[id]/page.js → /pokemon/1, /pokemon/25, ...
```

---

### 動的ルーティング

`[id]` のように角括弧で囲んだフォルダ名は<br>URLの一部をパラメータとして受け取れる。

```jsx
// app/pokemon/[id]/page.js
export default async function PokemonDetail({ params }) {
  const { id } = await params;
  // /pokemon/25 にアクセスすると id = "25"
}
```

1つのテンプレートで無数のページを生成できる。

---

## 2. SSRが活きるポイント

---

前回、CSRの課題として<br>「機密情報の露出」と「SEOの問題」を挙げました。

SSRはこれらに加えて、<br>「リクエスト時に決まる内容」にも対応できます。

---

### 機密情報の保護

SSRではAPI通信がサーバー上で完結する。

APIキーやDB接続情報はサーバーにだけ存在し、<br>ブラウザには**完成したHTMLだけ**が返る。

---

### SEOとOGP

SSRで返されるHTMLには<br>最初からコンテンツが含まれている。

検索エンジンやSNSのOGPクローラーが<br>正しくコンテンツを認識できる。

---

### generateMetadata

Next.jsではページごとに<br>動的なOGP情報を設定できる。

```jsx
export async function generateMetadata({ params }) {
  const { id } = await params;
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const pokemon = await response.json();

  return {
    title: `No.${pokemon.id} ${pokemon.name}`,
    openGraph: {
      title: `No.${pokemon.id} ${pokemon.name}`,
      images: [pokemon.sprites.other['official-artwork'].front_default],
    },
  };
}
```

---

### リクエスト時に決まる内容に対応できる

第四回で学んだSSG（Static Site Generation）を思い出そう。<br>SSGはビルド時に全ページのHTMLを作ってしまう手法。

**事前に全パターンを作れる**ならSSGで十分、<br>SSRを使う必要はない。

---

動的ルーティングの `/pokemon/[id]` も、<br>IDの範囲が固定なら全IDぶんを事前に生成してSSGにできる。<br>（Next.jsの `generateStaticParams`）

---

SSRが本当に活きるのは、<br>**リクエスト時にしか内容が確定しないケース**。

たとえばポケモン図鑑の場合、新作が出るたびにポケモンは増える。<br>SSGだと新作が出るたびにビルドし直す必要があるが、<br>SSRならリクエスト時にPokéAPIから最新データを取得するので、<br>常に最新の内容を返せる。

---

## 3. データベースへの接続

---

### データベースとは何か

データを構造的に保存・管理するためのソフトウェア。

ユーザー情報、投稿データ、注文履歴など、<br>アプリケーションが扱うデータを**永続的に記録**する。

---

### 第一回の分布図を思い出そう

分布図ではソフトウェアを<br>「ブラウザ」「Webサーバー」「ランタイム」「ネイティブアプリ」<br>に分類しました。

データベースはこのどれにあたるでしょうか？

---

### データベース ≒ Webサーバーと似た存在

| | Webサーバー | データベースサーバー |
|---|---|---|
| 役割 | HTTPリクエストを受けて<br>レスポンスを返す | データの読み書きリクエストを<br>受けて結果を返す |
| 動作 | サーバー上で常に起動し<br>接続を待ち受ける | サーバー上で常に起動し<br>接続を待ち受ける |
| 操作方法 | ブラウザやプログラムから接続 | CLIやプログラムから接続 |
| 例 | nginx, Apache | MySQL, PostgreSQL |

---

どちらも**サーバー上で常駐し、<br>他のプログラムからの接続を受け付ける**ソフトウェア。

操作はCLI（コマンドラインインターフェース）が基本。

```bash
# MySQLの例
mysql -u root -p
mysql> SELECT * FROM users WHERE id = 1;
```

---

### MySQL/PostgreSQL と SQLite

MySQL/PostgreSQLは**独立したソフトウェア**として<br>サーバー上で常駐し、ネットワーク経由で接続する。

SQLiteは独立したソフトウェアではなく、<br>**Next.jsのプログラムの一部として動作**する。<br>npmでインストールしたライブラリがDBファイルを直接読み書きする。

接続の形態は異なるが、**SQLでデータを操作する点は同じ**。

---

### APIの裏にDBがある

前回扱ったAPIは、データのやり取りをする**通信の手段**。<br>APIの向こう側にデータベースがあることが多い。

```
ブラウザ → API → サーバー → データベース  ← よくある構成
            サーバー → データベース         ← 直接操作（今回やること）
```

たとえばPokéAPIも裏側では<br>ポケモンのデータをDBに保存している。

---

### なぜDBへの接続はサーバーサイドで行うのか

DB接続にはホスト名・ユーザー名・パスワードなどの<br>**機密情報**が必要。ブラウザに渡すべきではない。

DB接続情報がブラウザに露出すると、<br>誰でもデータの読み書きができてしまう。

だからこそ**SSR**がDB連携と相性がよい。

---

### 今回使うSQLite

ファイルベースの軽量なデータベース。

- **サーバープロセス不要**：DBファイル1つで動作
- **セットアップ簡単**：npmパッケージをインストールするだけ
- **SQL対応**：MySQL/PostgreSQLと同じSQLで操作

```sql
SELECT * FROM bookmarks ORDER BY created_at DESC;
INSERT INTO bookmarks (pokemon_id, pokemon_name, note)
  VALUES (25, 'pikachu', 'でんきタイプの代表格');
```

---

## 4. 演習：Next.jsでポケモン図鑑を作る

---

### 演習の全体像

前回CSRで作ったポケモン図鑑を<br>Next.js（SSR）で作り直す。

さらにSQLiteを使った**お気に入り機能**を追加する。

```
/              → ポケモン一覧（SSR + PokéAPI）
/pokemon/25    → ポケモン詳細（SSR + PokéAPI）
/bookmarks     → お気に入り一覧（SSR + SQLite）
```

---

### Step 1：プロジェクトの作成

```bash
# Next.jsプロジェクトを作成
npx create-next-app@latest pokemon-app

# 設問には以下のように回答
# ✔ Would you like to use TypeScript? → No
# ✔ Would you like to use ESLint? → Yes
# ✔ Would you like to use Tailwind CSS? → Yes
# ✔ Would you like your code inside a `src/` directory? → No
# ✔ Would you like to use App Router? → Yes
# ✔ Would you like to use Turbopack for next dev? → Yes
# ✔ Would you like to customize the import alias? → No

# プロジェクトに移動して開発サーバーを起動
cd pokemon-app
npm run dev
```

`http://localhost:3000` にアクセスすると、<br>Next.jsの初期画面が表示されます。

---

プロジェクトの構成を確認しましょう。

```
pokemon-app/
├── app/
│   ├── layout.js      ← 全ページ共通のレイアウト
│   ├── page.js        ← トップページ（ / ）
│   └── globals.css    ← グローバルCSS
├── public/            ← 静的ファイル（画像など）
├── package.json
└── next.config.mjs
```

---

### Step 2：ポケモン一覧ページ

`app/page.js` を以下の内容に置き換えます。

---

```jsx
// app/page.js

export default async function Home() {
  // サーバーでPokéAPIからデータを取得
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20');
  const data = await response.json();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">ポケモン図鑑</h1>
      <div className="grid grid-cols-4 gap-4 mt-4">
        {data.results.map((pokemon, index) => {
          const id = index + 1;
          return (
            <a
              key={pokemon.name}
              href={`/pokemon/${id}`}
              className="border border-gray-300 rounded-lg p-4 text-center
                         no-underline text-inherit hover:bg-gray-50"
            >
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                alt={pokemon.name}
                width={96}
                height={96}
              />
              <p>No.{id}</p>
              <p className="font-bold capitalize">{pokemon.name}</p>
            </a>
          );
        })}
      </div>
    </main>
  );
}
```

---

ブラウザで確認したら、**ページのソースを表示**してみましょう。<br>CSR版と違い、HTMLの中にポケモンのデータが含まれているはずです。

---

### Step 3：ポケモン詳細ページ

動的ルーティングを使って、各ポケモンの詳細ページを作ります。

```bash
# ディレクトリを作成
mkdir -p app/pokemon/[id]
```

`app/pokemon/[id]/page.js` を作成します。

---

```jsx
// app/pokemon/[id]/page.js

export async function generateMetadata({ params }) {
  const { id } = await params;

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const pokemon = await response.json();

  return {
    title: `No.${pokemon.id} ${pokemon.name}`,
    description: `${pokemon.name}のステータス・タイプ情報`,
    openGraph: {
      title: `No.${pokemon.id} ${pokemon.name}`,
      images: [pokemon.sprites.other['official-artwork'].front_default],
    },
  };
}
```

---

```jsx
export default async function PokemonDetail({ params }) {
  const { id } = await params;

  // サーバーでPokéAPIからデータを取得
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const pokemon = await response.json();

  return (
    <main className="p-8 max-w-xl mx-auto">
      <a href="/" className="text-blue-600 hover:underline">← 一覧に戻る</a>

      <div className="text-center mt-4">
        <img
          src={pokemon.sprites.other['official-artwork'].front_default}
          alt={pokemon.name}
          width={300}
          height={300}
        />
        <h1 className="text-2xl font-bold capitalize mt-2">
          No.{pokemon.id} {pokemon.name}
        </h1>
      </div>
```

---

```jsx
      <table className="w-full border-collapse mt-4">
        <tbody>
          <tr className="border-b border-gray-300">
            <th className="p-2 text-left">タイプ</th>
            <td className="p-2">
              {pokemon.types.map(t => t.type.name).join(', ')}
            </td>
          </tr>
          <tr className="border-b border-gray-300">
            <th className="p-2 text-left">高さ</th>
            <td className="p-2">{pokemon.height / 10} m</td>
          </tr>
          <tr className="border-b border-gray-300">
            <th className="p-2 text-left">重さ</th>
            <td className="p-2">{pokemon.weight / 10} kg</td>
          </tr>
          <tr className="border-b border-gray-300">
            <th className="p-2 text-left">基本経験値</th>
            <td className="p-2">{pokemon.base_experience}</td>
          </tr>
        </tbody>
      </table>
```

---

```jsx
      <h2 className="text-xl font-bold mt-6">ステータス</h2>
      <div className="mt-2">
        {pokemon.stats.map(stat => (
          <div key={stat.stat.name} className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="capitalize">{stat.stat.name}</span>
              <span>{stat.base_stat}</span>
            </div>
            <div className="bg-gray-200 rounded h-2">
              <div
                className="bg-green-500 rounded h-full"
                style={{ width: `${Math.min(stat.base_stat / 255 * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
```

---

#### SSRであることを確認しよう

`http://localhost:3000/pokemon/25` にアクセスして、<br>以下を確認してみましょう。

1. **ページのソースを表示**（右クリック →「ページのソースを表示」）
   - HTMLの中にポケモンの情報が含まれている → SSR
   - CSRなら `<div id="root"></div>` のような空のHTMLが返る

---

2. **ブラウザのネットワークタブ**
   - PokéAPIへのリクエストが**見えない** → サーバーで通信が完結

3. **「読み込み中...」が表示されない**
   - CSR版では一瞬「読み込み中...」が見えたが、SSRでは最初から完成したページが表示される

---

### Step 4：SQLiteでお気に入り機能

ここからDBとの連携を体験します。

---

#### 4-1. セットアップ

```bash
# better-sqlite3をインストール
npm install better-sqlite3
```

---

#### 4-2. データベースの初期化

プロジェクトのルートに `init-db.js` を作成し、初期データを投入します。

---

```javascript
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
```

---

```bash
# 初期化スクリプトを実行
node init-db.js
```

---

#### 4-3. お気に入り一覧ページ

`app/bookmarks/page.js` を作成します。

---

```jsx
// app/bookmarks/page.js
import Database from 'better-sqlite3';

export const dynamic = 'force-dynamic';

export default function BookmarksPage() {
  // サーバーでSQLiteからデータを取得
  const db = new Database('app.db');
  const bookmarks = db.prepare(
    'SELECT * FROM bookmarks ORDER BY created_at DESC'
  ).all();
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
            className="flex items-center gap-4 p-4 border-b border-gray-200
                       no-underline text-inherit hover:bg-gray-50"
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
```

---

#### ポイント

このページでは外部APIではなく、<br>**自分のDB（SQLite）**からデータを取得しています。

- `Database('app.db')` — SQLiteファイルに直接接続
- この接続は**サーバー上でのみ実行**される（ブラウザにDB接続情報は渡らない）
- SQLを使ってデータを取得し、HTMLに反映してからブラウザに返す

APIから取得する場合もDBから取得する場合も、<br>**サーバーが外部からデータを取得し、HTMLを生成して返す**<br>という点で同じSSRの構造です。

---

### チャレンジ課題

---

#### 課題1：表示数を増やす

一覧ページの表示数を20件から**151件**に変更。<br>ヒント：`fetch` のURLパラメータを変更。

---

#### 課題2：タイプ別ページ

`/type/[name]` で特定タイプのポケモン一覧を表示。

```
/type/fire      → ほのおタイプ
/type/water     → みずタイプ
/type/electric  → でんきタイプ
```

ヒント：`https://pokeapi.co/api/v2/type/fire`

---

#### 課題3（発展）：お気に入り追加機能

詳細ページに「お気に入りに追加」ボタンを設置。<br>ヒント：Next.jsの **Server Actions** を使う。

---

## まとめ

---

- **SSR**はサーバーがデータを取得し、HTMLを生成して返す手法
- **Next.js**ではサーバーコンポーネントの `fetch` やDB接続がサーバー上で実行される
  - ブラウザにはAPIキーやDB接続情報は渡らない
  - 完成したHTMLが返るのでSEO・OGPに有利
- 今回はサーバーからの外部接続として**API**と**DB**を扱った
- いずれもSSRで扱うことで、機密情報をブラウザに露出させずに済む

---

## 次回予告

第七回：大規模開発の実例

チーム編成やメンバーの役割分担など、<br>実際のプロジェクトがどのように進むのかを学びます。
