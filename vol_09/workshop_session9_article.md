# Canvas、WebGLで「リッチな演出」を作る — three.js入門

## 1. Canvas と WebGL

リッチな演出を作るためにブラウザが用意しているのが、`<canvas>` 要素です。HTML/CSS では難しい、ピクセル単位の自由な描画・大量の図形のリアルタイム更新・3D表現などをカバーするための「お絵かき領域」です。

`<canvas>` タグ自体は、画面に **「絵を描いていい四角い領域」** を確保するだけのもので、それ自体は何の絵も描きません。実際に何かを描くには、JavaScript から `canvas.getContext(...)` を呼び出して、**「どんな道具で描くか」** を指定します。

この「道具」のことを **コンテキスト（context）** と呼びます。

```js
const canvas = document.querySelector('canvas');
const ctx2d = canvas.getContext('2d');       // 2D 用の道具を取り出す
const gl   = canvas.getContext('webgl');     // 3D（WebGL）用の道具を取り出す
```

絵筆のセットを2種類用意していて、どちらを手に取るかで描ける絵の種類が変わる、というイメージです。

- `getContext('2d')` を選ぶと → **Canvas 2D API**（CPU で2Dの絵を描く）
- `getContext('webgl')` を選ぶと → **WebGL API**（GPU で3Dや大量の図形を描く）

同じ `<canvas>` タグでも、ここの選び方で **まったく別の世界** に切り替わります。

まずは Canvas 2D から見て、その先に WebGL の世界があることを掴みます。

### Canvas 2D（CPU描画）

`<canvas>` に対して `'2d'` コンテキストを取ると、命令的に図形を描けます。

```html
<canvas id="c" width="400" height="300"></canvas>
```

```js
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 100, 100); // 赤い四角

ctx.beginPath();
ctx.arc(200, 150, 50, 0, Math.PI * 2);
ctx.fillStyle = 'blue';
ctx.fill(); // 青い円
```

Canvas 2D は **CPU** が1命令ずつ順番に処理して描画します。

- 図形が数十〜数百個程度なら、これで十分滑らかに動く
- 動的なグラフ、お絵かきツール、簡単なゲームなど、業務での利用シーンも多い
- 3Dは扱えない（自前で計算すれば描けるが、現実的ではない）

つまり Canvas 2D は **「DOMで描けない2Dの絵を、JSで自由に描きたい」** ときの選択肢です。

### WebGL（GPU描画）

Canvas 2D で力不足になる場面があります。

- 数千〜数万個の図形を毎フレーム動かしたい（パーティクル、流体）
- 3D空間を表現したい
- 光・影・反射などの質感をリアルタイム計算したい

ここで登場するのが **WebGL** です。同じ `<canvas>` タグから、別のコンテキストを取り出します。

```js
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl'); // または 'webgl2'
```

WebGL は、ブラウザから **GPU（Graphics Processing Unit）** を直接使うための API です。Canvas 2D が CPU の処理速度の延長線にあるのに対し、WebGL はそもそも別のハードウェア（GPU）に仕事を投げる仕組みなので、扱える表現の規模と複雑さが桁違いになります。

### GPU は「同じ処理を一気に大量にやる」のが得意

CPU は「色々な種類の処理を順番に高速にこなす」のが得意。GPU は「同じ計算を大量の対象に並列で適用する」のが得意です。

3D空間に1万個の頂点があるとき、それぞれを画面座標に変換する処理は **同じ計算を1万回** やることになります。これは GPU の真骨頂です。

### シェーダー：GPU に渡す描画プログラム

GPU に絵を描かせるには、**シェーダー（shader）** という小さなプログラムを書いて GPU に送り込みます。シェーダーは **GLSL（OpenGL Shading Language）** という C 言語風の専用言語で書きます。

主に2種類のシェーダーがあります。

- **頂点シェーダー（Vertex Shader）**：頂点を画面上のどこに配置するかを計算する
- **フラグメントシェーダー（Fragment Shader）**：各ピクセルを何色にするかを計算する

これらが GPU 内で **並列実行** されることで、滑らかなアニメーションや複雑な質感表現が成り立ちます。


---

## 2. 生の WebGL を書くと大変

ここで、生の WebGL で **赤い三角形を1つ描く** だけのコードを見てみます。

```js
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');

// 頂点シェーダー（GLSL）
const vsSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// フラグメントシェーダー（GLSL）
const fsSource = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // 赤
  }
`;

// シェーダーをコンパイル
const vs = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vs, vsSource);
gl.compileShader(vs);

const fs = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fs, fsSource);
gl.compileShader(fs);

// プログラムにリンク
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// 頂点データを GPU に送る
const positions = new Float32Array([
   0.0,  0.5,
  -0.5, -0.5,
   0.5, -0.5,
]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const loc = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(loc);
gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

// 描画
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

これで描けるのは **塗りつぶされた三角形1つ**。動きません。色もシェーダーにベタ書きで一色です。

ここから 3Dモデルを読み込み、ライティング、カメラ移動、アニメーションを追加していくと、すぐに数千行のコードになります。WebGL は GPU を「素手で」触る API なので、何をするにも人間側がお膳立てをしないといけません。

**だからこそ、ライブラリを使います。** 業界デファクトが [three.js](https://threejs.org/) です。

---

## 3. three.js で学ぶ 3DCG の基本概念

three.js を理解する前に、3DCG というジャンルそのものの **基本ボキャブラリ** を押さえます。これは three.js 固有の話ではなく、Unity でも Blender でも Maya でも共通する考え方です。

3DCG の描画には、必ず次の登場人物が出てきます。

- **シーン（Scene）**：3D空間そのもの。物体やライトを入れる器
- **カメラ（Camera）**：どこから、どんな画角で世界を見るか
- **ライト（Light）**：空間にどう光を当てるか
- **ジオメトリ（Geometry）**：物体の「形」のデータ
- **マテリアル（Material）**：物体の「見た目」のデータ
- **メッシュ（Mesh）**：ジオメトリ＋マテリアルを組み合わせた、実際の物体
- **レンダラー（Renderer）**：これらを毎フレーム計算して、`<canvas>` に描き出す装置

順番に見ていきます。

### シーン（Scene）

3D空間そのもの。すべての物体・光源を入れる「器」です。ここに物体（メッシュ）やライトを add していきます。

```js
const scene = new THREE.Scene();
```

### カメラ（Camera）

「どこから・どんな画角で見るか」を決める存在です。three.js には主に2種類あります。

#### PerspectiveCamera（透視投影カメラ）

遠近感のあるカメラ。人間の目や普通のカメラに近い見え方で、遠くのものは小さく、近くのものは大きく見えます。

```js
const camera = new THREE.PerspectiveCamera(
  75,                                       // 視野角（fov）
  window.innerWidth / window.innerHeight,   // アスペクト比
  0.1,                                      // 描画する近距離の限界
  1000                                      // 描画する遠距離の限界
);
camera.position.z = 3;
```

#### OrthographicCamera（並行投影カメラ）

遠近感のないカメラ。遠くも近くも同じ大きさで描画されます。建築の平面図、ゲームでのアイソメトリックビュー（斜め見下ろし）、UIの背景演出などに使います。

```js
const camera = new THREE.OrthographicCamera(
  -aspect, aspect,  // left, right
   1, -1,           // top, bottom
   0.1, 1000        // near, far
);
```

この2つの違いは、後半の演出パターンで実際に使い分けます。

### ライト（Light）

3D空間に置いただけでは、ほとんどの物体は **真っ黒** です。光が当たって初めて見える、というのが3DCGの世界の前提です（ライトを必要としないマテリアルもあります）。

代表的なライト：

- **AmbientLight**：空間全体を均一に照らす環境光。影は作らない
- **DirectionalLight**：太陽のような平行光線。影を作れる
- **PointLight**：電球のように、ある点から全方向に広がる光
- **SpotLight**：懐中電灯のような円錐状の光

```js
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(2, 2, 2);
scene.add(sun);
```

### ジオメトリ（Geometry）

「形」のデータ。頂点（vertex）の集まりです。three.js には主要な形状がプリセットで用意されています。

```js
new THREE.BoxGeometry(1, 1, 1);          // 立方体
new THREE.SphereGeometry(1, 32, 32);     // 球
new THREE.PlaneGeometry(2, 2);           // 平面
new THREE.TorusGeometry(1, 0.4, 16, 100);// ドーナツ
```

自前のモデルを使いたいときは、Blender などで作った `.gltf` ファイルを読み込んで Geometry として扱います。

### マテリアル（Material）

「見た目」のデータ。色、質感、光への反応、テクスチャ（貼り付ける画像）などを決めます。

```js
// 光に反応しない（ライト不要）
new THREE.MeshBasicMaterial({ color: 0x00aaff });

// 光に反応する物理ベースのマテリアル
new THREE.MeshStandardMaterial({
  color: 0x00aaff,
  roughness: 0.5,  // ざらざら度
  metalness: 0.2,  // 金属度
});

// 自分でシェーダーを書く（vol_10 で扱います）
new THREE.ShaderMaterial({ vertexShader, fragmentShader });
```

### メッシュ（Mesh）：ジオメトリ + マテリアル

ジオメトリ（形）とマテリアル（見た目）を組み合わせると、シーンに置ける物体 = **メッシュ** になります。

```js
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

### レンダラー（Renderer）と描画パイプライン

ここまでで「シーン」「メッシュ」「カメラ」「ライト」が揃いました。最後に **レンダラー** が、これらを毎フレーム計算して `<canvas>` に絵を描き出します。

```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
```

毎フレーム動かしたいときは、`requestAnimationFrame` でループします。

```js
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  renderer.render(scene, camera);
}
animate();
```

#### 描画パイプラインの全体像

1フレームの描画で、内部的には次のことが起きています。

1. **シーン内の各メッシュをループ**：何を描くか列挙する
2. **頂点シェーダー実行**：各頂点を 3D空間 → カメラ視点 → 2D画面 に変換する（GPU並列）
3. **ラスタライズ**：頂点で作られた三角形を、画面上のピクセルに分解する
4. **フラグメントシェーダー実行**：各ピクセルの色を決める（マテリアル＋ライト計算）（GPU並列）
5. **深度テスト**：手前のピクセルが奥のピクセルを隠す処理
6. **画面に出力**：`<canvas>` に1枚の絵として表示

three.js は、このパイプラインを宣言的に組み立てられるよう抽象化してくれているわけです。

### 最小コード：回転する立方体

ここまでの登場人物を全部使った最小のサンプルです。

```html
<canvas id="c"></canvas>
<script type="importmap">
  { "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }
</script>
<script type="module">
  import * as THREE from 'three';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('c'),
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x00aaff })
  );
  scene.add(cube);

  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(2, 2, 2);
  scene.add(light);

  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
</script>
```

これで3D空間でくるくる回る青い立方体が描けます。生 WebGL で「赤い三角形1つ」だったコード量と比べると、扱える表現の幅が一気に広がっていることが分かります。

---

## 4. 演出パターン1：DOMと3Dの奥行き連動

ここからは「three.js で何ができるか」ではなく、**「Webサイトの演出として、DOMと3Dをどう組み合わせるか」** の話です。

最初のパターンは、**DOM要素の動きと3Dカメラの z軸移動を同期させて、奥行き感を演出する** やり方です。

### 何を作るのか

- 背景に three.js のシーン（例：奥に広がる立体的なオブジェクト群）
- 前面に DOM のテキストや画像
- スクロールやマウス操作に応じて、**DOMは2D的に translate で動き**、**3Dカメラは z軸で前後に動く**
- これにより、平面の動きと奥行きの動きが組み合わさり、立体感のある演出になる

代表例：プロダクトのランディングページで、スクロールに合わせて手前のキャッチコピー（DOM）がスライドし、奥の3Dオブジェクト（背景）がカメラに迫ってくる、というやつです。

### なぜ DOM と 3D を分けるのか

「全部 three.js でやればいいのでは？」と思うかもしれませんが、テキスト要素を3D空間に置くと、

- フォントのアンチエイリアスが汚くなる
- アクセシビリティ（スクリーンリーダー、コピー、検索）が崩れる
- レスポンシブ対応が難しい
- SEO 上もテキストとして認識されない

という欠点があります。逆に DOM だけだと、奥行きや3Dの質感は出せません。

**「読ませたいテキストは DOM、空間表現は WebGL」** と棲み分けて、両者を同期させるのが現実的な落としどころです。

### 仕組み

`<canvas>` を画面全体に固定配置し、その上に DOM のコンテンツを重ねます。

```html
<style>
  #bg {
    position: fixed;
    inset: 0;
    z-index: 0;
  }
  .content {
    position: relative;
    z-index: 1;
  }
  .section {
    height: 100vh;
    display: grid;
    place-items: center;
  }
</style>

<canvas id="bg"></canvas>
<main class="content">
  <section class="section"><h1>Section 1</h1></section>
  <section class="section"><h1>Section 2</h1></section>
  <section class="section"><h1>Section 3</h1></section>
</main>
```

スクロール量に応じて、DOM 側は `transform: translateY(...)`、three.js 側は `camera.position.z` を動かします。

```js
import * as THREE from 'three';

// three.js のセットアップ（前章と同様）
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60, innerWidth / innerHeight, 0.1, 100
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('bg'),
  antialias: true,
  alpha: true, // 背景を透過させる
});
renderer.setSize(innerWidth, innerHeight);

// 奥に広がるオブジェクトを並べる
for (let i = 0; i < 30; i++) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x00aaff })
  );
  mesh.position.set(
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 6,
    -i * 2   // 奥に向かって配置
  );
  scene.add(mesh);
}
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
scene.add(new THREE.DirectionalLight(0xffffff, 0.8));

// スクロールに応じてカメラを z軸方向に進める
let targetZ = 5;
window.addEventListener('scroll', () => {
  const ratio = window.scrollY / (document.body.scrollHeight - innerHeight);
  targetZ = 5 - ratio * 40;  // 5 から -35 まで進む
});

function animate() {
  requestAnimationFrame(animate);
  // イージング：目標値に少しずつ近づける
  camera.position.z += (targetZ - camera.position.z) * 0.08;
  renderer.render(scene, camera);
}
animate();
```

DOM 側は、必要に応じて `IntersectionObserver` でセクションごとにフェードインしたり、`translateY` で副次的な動きを加えたりします。

### 学べるポイント

- **DOM の役割と 3D の役割を切り分ける** という設計思想
- `window.scrollY` などの **DOM由来の値を、3D空間のパラメータに翻訳する** 発想
- **イージング**（目標値に少しずつ近づける）でカクつきを消す技法

---

## 5. 演出パターン2：並行投影 × スクロールで鳥瞰ビュー

2つめは、`OrthographicCamera`（並行投影カメラ）を使って、**マップを上から俯瞰するような表現** を作る例です。

### 何を作るのか

- 並行投影カメラで地面（平面）を斜め上から見下ろす
- スクロールに応じてカメラの位置を横方向（または前方）に動かす
- 一定間隔で配置された建物・木・道などが、まるで地図の上を移動するように流れていく
- DOM 側のテキストや画像とリンクして、「この地点ではこの説明が出る」というストーリー表現になる

代表例：プロダクトの歴史を年表で見せる、観光地のマップ風プレゼン、ゲームのマップ画面風のサイトなど。

### なぜ並行投影なのか

`PerspectiveCamera`（透視投影）でこれをやると、遠くの建物が小さくなって「奥行きはあるけどマップらしくない」見え方になります。並行投影だと **遠近によらず同じスケール** で描画されるため、ファミコン時代の RPG のような、設計図的な見え方になります。

ビジネス資料の見出しビジュアル、UI 背景、インフォグラフィックなどに向く描画方法です。

### 仕組み

```js
import * as THREE from 'three';

const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef2f7);

// 並行投影カメラ
const aspect = innerWidth / innerHeight;
const viewSize = 10; // 視野の縦サイズ
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect, viewSize * aspect, // left, right
   viewSize, -viewSize,                   // top, bottom
   0.1, 100                               // near, far
);
// 斜め上から見下ろす位置に置く
camera.position.set(20, 20, 20);
camera.lookAt(0, 0, 0);

// 地面
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0xcccccc })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 建物を等間隔に並べる
for (let i = 0; i < 30; i++) {
  const h = 1 + Math.random() * 3;
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(1, h, 1),
    new THREE.MeshStandardMaterial({ color: 0x4488cc })
  );
  building.position.set(i * 3 - 30, h / 2, (i % 2) * 2);
  scene.add(building);
}

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(5, 10, 5);
scene.add(sun);

// スクロール量でカメラを横方向に動かす
let targetX = 20;
window.addEventListener('scroll', () => {
  const ratio = window.scrollY / (document.body.scrollHeight - innerHeight);
  targetX = 20 + ratio * 60; // 街の上を東に向かって進む
});

function animate() {
  requestAnimationFrame(animate);
  camera.position.x += (targetX - camera.position.x) * 0.08;
  camera.lookAt(camera.position.x - 20, 0, camera.position.z - 20);
  renderer.render(scene, camera);
}
animate();
```

### 学べるポイント

- `OrthographicCamera` の使い所（情報設計的に並行投影が向く場面）
- カメラを動かすだけで「世界を進む」表現が作れる
- 地図的なメタファを使ってコンテンツを順番に見せる発想

### パターン1との対比

|              | パターン1（奥行き連動）        | パターン2（鳥瞰ビュー）       |
| ------------ | ------------------------------ | ----------------------------- |
| カメラ       | PerspectiveCamera              | OrthographicCamera            |
| 動かす軸     | z軸（前後）                    | x軸 or z軸（平面方向）        |
| 見え方       | 没入感のある奥行き             | 地図・設計図的な俯瞰          |
| 向くコンテンツ | プロダクト紹介・ストーリーテリング | 年表・マップ・インフォグラフィック |

同じ「スクロールに3D演出を連動させる」でも、**カメラの種類と動かす軸を変えるだけで、世界観がまるで変わる** ことが分かります。これが3DCGの面白さです。

---

## 6. 課題

次回（vol_10：シェーダー芸入門）で取り上げる課題です。手元で実際に動かしてみてください。

### 課題1：three.js の最小コードを動かす

3章の「回転する立方体」のコードを動かす。CDN の importmap で three.js を読み込んでローカルで表示できればOK。

### 課題2：基本概念を入れ替えて遊ぶ

回転する立方体に対して、次の変更を試してみる。

- ジオメトリを `SphereGeometry` `TorusGeometry` などに差し替える
- マテリアルを `MeshBasicMaterial` `MeshStandardMaterial` で切り替えて、ライトの効き方の違いを観察する
- ライトを `PointLight` に変えて、位置を動かしてみる
- カメラを `OrthographicCamera` に切り替えて、見た目がどう変わるか確認する

### 課題3：演出パターン1を再現する

4章の「DOMと3Dの奥行き連動」のコードをローカルで動かし、DOM側のテキストを自分の好きな内容に変える。スクロールに合わせてカメラの z 移動量を調整し、自分の好みの「奥行き感」にチューニングしてみる。

### 課題4：演出パターン2を再現する

5章の「鳥瞰ビュー」のコードをローカルで動かす。建物の配置・色・高さを変えたり、カメラの移動方向を変えたりして、自分の世界観を作ってみる。

### 課題5：自由演出（チャレンジ）

three.js の公式サンプル（[https://threejs.org/examples/](https://threejs.org/examples/)）を1つ選んで、コードを読みながら手元で動かしてみる。「シーン／カメラ／ライト／ジオメトリ／マテリアル／レンダラー」の登場人物がそれぞれどこにいるか、コメントで印をつけられれば理解度がぐっと上がります。

---

## 7. まとめ

- **WebGL は GPU を直接使うブラウザの描画API**。シェーダーで並列描画する
- **生の WebGL は低レベル** で、簡単な絵を描くにも大量のコードが必要
- **three.js** は WebGL を扱いやすくラップしたデファクトライブラリ
- 3DCG の基本登場人物：**シーン／カメラ／ライト／ジオメトリ／マテリアル／メッシュ／レンダラー**
- カメラには **PerspectiveCamera（透視投影）** と **OrthographicCamera（並行投影）** があり、世界観を決定づける
- 描画パイプラインは「頂点シェーダー → ラスタライズ → フラグメントシェーダー → 深度テスト → 出力」
- 演出として **DOM と 3D を組み合わせる** のが実用的な設計：DOMは情報、3Dは空間表現
- **パターン1**：透視投影 × カメラのZ移動で奥行き演出
- **パターン2**：並行投影 × カメラの平面移動で鳥瞰ビュー

次回は、ここで触れた **マテリアル** と **シェーダー** をさらに掘り下げ、GLSL を直接書いて「ピクセル単位で絵を作る」シェーダー芸の世界に入ります。
