# 各種フレームワーク・ライブラリの選定基準

## 前回のおさらい

前回は「マークアップとプログラミングの違い」について整理しました。

| | マークアップ | プログラミング |
|---|---|---|
| 記述するもの | **何であるか**（構造・意味） | **何をするか**（手順・振る舞い） |
| 性質 | 宣言的 | 手続き的 |

この2つは全く別のスキルです。しかし現代のフロントエンド開発では、この両方を扱う必要があります。

今回は皆さんからリクエストのあったフレームワーク（React / Bootstrap / Tailwind）について紹介していきます。フレームワークはこの2つの合流をスムーズにしてくれるはずです。

---

## 各種フレームワークの誕生の経緯

フレームワークやライブラリは、それぞれ異なる課題を解決するために生まれました。「なぜ作られたか」を知ることで、どの場面で使うべきかが見えてきます。

### React：宣言的UIの誕生

#### Webアプリケーションの登場

元々HTMLは静的な文書のための言語でした。しかし2000年代後半から、Gmail、Googleマップなど、ページ遷移なしでUIが変化する **Webアプリケーション** が登場しました。

これにより、JavaScriptでDOMを操作してUIを動的に変える必要が出てきました。

#### jQuery時代の課題

2010年代初頭、jQueryなどで手続き的にDOMを操作するのが主流でした。

```html
<!-- HTML -->
<p id="count">0</p>
<button id="button">+1</button>
<p id="message" style="display: none;">10に達しました！</p>
```

```javascript
// jQuery: 手続き的にDOMを操作する
$('#button').on('click', function() {
  const count = parseInt($('#count').text());
  $('#count').text(count + 1);
  if (count + 1 >= 10) {
    $('#message').show();
  }
});
```

このコードは「ボタンがクリックされたら、カウントを取得して、1を足して、表示を更新して、10以上なら...」と **手順** を記述しています。

アプリケーションが複雑になると、「どのDOM要素を」「どう更新するか」の管理が困難になります。状態（データ）とUI（DOM）の整合性を手動で保つ必要があったのです。

#### Reactの革新（2011年、Facebook）

Reactは2011年にFacebookのJordan Walkeによって開発されました。発想の転換がありました。

```jsx
// React: 宣言的にUIを記述する
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      {count >= 10 && <p>10に達しました！</p>}
    </div>
  );
}
```

このコードは「カウントがこの値のとき、UIはこうあるべき」と **状態** を宣言しています。DOMをどう更新するかはReactが自動で処理します。

- **宣言的UI**: DOMを直接操作するのではなく、UIが「どうあるべきか」を宣言する
- **コンポーネントベース**: 再利用可能な小さな部品にUIを分割する

```jsx
// Userコンポーネント（再利用可能な部品）
function User({ name, email }) {
  return (
    <div className="user">
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

// Userコンポーネントを再利用
function UserList() {
  const users = [
    { name: "田中", email: "tanaka@example.com" },
    { name: "佐藤", email: "sato@example.com" },
  ];
  return (
    <div>
      {users.map(user => <User name={user.name} email={user.email} />)}
    </div>
  );
}
```

#### PHPとの既視感

Reactの開発体験は、PHPでサーバーサイドのコードを書いていたときの感覚に似ています。

```php
<!-- PHP: HTMLの中にPHPを埋め込む -->
<?php
$user = new stdClass();
$user->name = "田中";
$user->email = "tanaka@example.com";
?>
<div class="user">
  <h2><?php echo $user->name; ?></h2>
  <p><?php echo $user->email; ?></p>
</div>
```

```jsx
// React (JSX): HTMLライクな記法をJSに埋め込む
function User() {
   const user = {
      name: "田中",
      email: "tanaka@example.com"
   }
   return (
      <div className="user">
         <h2>{user.name}</h2>
         <p>{user.email}</p>
      </div>
   )
}
```

- PHPでは毎回リクエストを受けてHTMLを生成して返す。Reactも状態が変わるたびにUIを「再描画」する感覚（実際はVirtual DOMによる差分描画）
- HTMLの中にコードを埋め込む記法も似ている

これは偶然ではありません。ReactはXHP（FacebookのPHP用HTMLコンポーネントライブラリ）からインスパイアされています。

### Bootstrap：UIの一貫性問題を解決

#### Twitter社内の課題（2010年）

Twitterでは、複数のエンジニアがそれぞれ独自のスタイルで開発していました。その結果、社内ツールのUIに一貫性がなく、メンテナンスの負担が大きくなっていました。

#### 解決策としてのBootstrap

Mark Otto（デザイナー）とJacob Thornton（開発者）が開発したのがBootstrapです。

- ボタン、フォーム、ナビゲーションバーなど、プリセットのUIコンポーネントを提供
- クラスを付けるだけで、それなりに見栄えの良いUIが作れる
- デザイナーがいなくても、一貫性のあるUIが実現できる

2011年8月にオープンソース化され、現在も最も人気のあるCSSフレームワークの1つです。

### Tailwind CSS：CSS設計の苦しみを解決

#### Bootstrapとは全く別のニーズ

Tailwindは2017年、Adam Wathanが副業プロジェクトを開発する中で生まれました。Bootstrapとは解決しようとしている問題が根本的に異なります。

#### CSSを書く苦しみ

- 「クラス名を考えるのがつらい」
- CSSファイルとHTMLファイルを行き来するのが面倒
- 「このスタイルはどこで定義されてる？」問題

#### ユーティリティファーストという発想

Tailwindはプリセットのコンポーネントを提供しません。代わりに、小さなユーティリティクラスを組み合わせてスタイルを構築します。

```html
<!-- Bootstrap: コンポーネントクラス -->
<button class="btn btn-primary">送信</button>

<!-- Tailwind: ユーティリティクラスの組み合わせ -->
<button class="bg-blue-500 text-white px-4 py-2 rounded">送信</button>
```

Tailwindは「CSSを書かなくていい」という開発体験を提供します。ただし、デザインそのものは自分で考える必要があります。

---

## 特性

### React

- 宣言的UIとコンポーネント設計を提供するUIライブラリ
- 見た目のスタイルは含まない
- 状態管理と再利用可能なコンポーネントが強み

### Bootstrap（および Foundation、Bulma など）

- プリセットのUIコンポーネントを提供するCSSフレームワーク
- クラスを付けるだけで、統一感のあるUIが作れる
- 見た目はフレームワークの雰囲気になる

### Tailwind

- ユーティリティクラスを提供するCSSフレームワーク
- プリセットコンポーネントは持たない
- デザインは自由だが、力量が問われる

### Reactと組み合わせる

ReactはUIの「構造」と「振る舞い」を提供しますが、見た目のスタイルは含みません。そこで、BootstrapやTailwindと組み合わせて使うことが多いです。

- **React Bootstrap**: BootstrapをReactコンポーネントとして使えるライブラリ。Bootstrapの見た目をReactで扱える
- **React + Tailwind**: Tailwindのユーティリティクラスを使って、独自のReactコンポーネントを作っていく

---

## どういう場所に適しているか

### Bootstrap

- 管理画面、社内ツール
- MVP（最小限の製品）を素早く作りたいとき
- デザイナーがいないプロジェクト
- 「それなりに見える」ことが重要な場面

### Tailwind

- カスタムデザインを実装したいとき
- デザインカンプが用意されている案件
- CSSの設計・命名に悩みたくないとき
- コンポーネント設計と組み合わせて使う

### React + UIフレームワーク

- 動的なWebアプリケーション
- 状態管理が複雑なUI
- ユーザー操作に応じてUIが頻繁に変わる場面
- チーム開発でコンポーネントを再利用したいとき

---

## 実際に使ってみる

./demo/index.html 参照

---

## まとめ

- フレームワークは、それぞれ異なる課題を解決するために生まれた
- **React**: 手続き的なDOM操作の複雑さを、宣言的UIで解決
- **Bootstrap**: UIの一貫性問題を、プリセットコンポーネントで解決
- **Tailwind**: CSS設計の苦しみを、ユーティリティクラスで解決
- 「何を解決したいか」によって選ぶフレームワークが変わる

---

## 次回予告

第四回：Next.jsを用いたWebアプリケーション 1

フレームワークを使った実際の開発を体験します。マークアップ、ビジネスロジック、APIやDB連携について学びます。
