---
title: 第九回：Canvas、WebGLで「リッチな演出」を作る — three.js入門
---

# Canvas、WebGLで「リッチな演出」を作る

— three.js入門

---

## 1. Canvas と WebGL

---

リッチな演出を作るためにブラウザが用意しているのが、`<canvas>` 要素です。HTML/CSS では難しい、ピクセル単位の自由な描画・大量の図形のリアルタイム更新・3D表現などをカバーするための「お絵かき領域」です。

---

`<canvas>` タグ自体は、画面に **「絵を描いていい四角い領域」** を確保するだけのもので、それ自体は何の絵も描きません。実際に何かを描くには、JavaScript から `canvas.getContext(...)` を呼び出して、**「どんな道具で描くか」** を指定します。

この「道具」のことを **コンテキスト（context）** と呼びます。

---

```js
const canvas = document.querySelector('canvas');
const ctx2d = canvas.getContext('2d');       // 2D 用の道具を取り出す
const gl   = canvas.getContext('webgl');     // 3D（WebGL）用の道具を取り出す
```

絵筆のセットを2種類用意していて、どちらを手に取るかで描ける絵の種類が変わる、というイメージです。

---

- `getContext('2d')` を選ぶと → **Canvas 2D API**（CPU で2Dの絵を描く）
- `getContext('webgl')` を選ぶと → **WebGL API**（GPU で3Dや大量の図形を描く）

同じ `<canvas>` タグでも、ここの選び方で **まったく別の世界** に切り替わります。

まずは Canvas 2D から見て、その先に WebGL の世界があることを掴みます。

---

### Canvas 2D（CPU描画）

`<canvas>` に対して `'2d'` コンテキストを取ると、命令的に図形を描けます。

```html
<canvas id="c" width="400" height="300"></canvas>
```

---

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

---

Canvas 2D は **CPU** が1命令ずつ順番に処理して描画します。

- 図形が数十〜数百個程度なら、これで十分滑らかに動く
- 動的なグラフ、お絵かきツール、簡単なゲームなど、業務での利用シーンも多い
- 3Dは扱えない（自前で計算すれば描けるが、現実的ではない）

つまり Canvas 2D は **「DOMで描けない2Dの絵を、JSで自由に描きたい」** ときの選択肢です。

---

### WebGL（GPU描画）

Canvas 2D で力不足になる場面があります。

- 数千〜数万個の図形を毎フレーム動かしたい（パーティクル、流体）
- 3D空間を表現したい
- 光・影・反射などの質感をリアルタイム計算したい

---

ここで登場するのが **WebGL** です。同じ `<canvas>` タグから、別のコンテキストを取り出します。

```js
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl'); // または 'webgl2'
```

WebGL は、ブラウザから **GPU（Graphics Processing Unit）** を直接使うための API です。Canvas 2D が CPU の処理速度の延長線にあるのに対し、WebGL はそもそも別のハードウェア（GPU）に仕事を投げる仕組みなので、扱える表現の規模と複雑さが桁違いになります。

---

### GPU は「同じ処理を一気に大量にやる」のが得意

CPU は「色々な種類の処理を順番に高速にこなす」のが得意。GPU は「同じ計算を大量の対象に並列で適用する」のが得意です。

3D空間に1万個の頂点があるとき、それぞれを画面座標に変換する処理は **同じ計算を1万回** やることになります。これは GPU の真骨頂です。

---

### シェーダー：GPU に渡す描画プログラム

GPU に絵を描かせるには、**シェーダー（shader）** という小さなプログラムを書いて GPU に送り込みます。シェーダーは **GLSL（OpenGL Shading Language）** という C 言語風の専用言語で書きます。

---

主に2種類のシェーダーがあります。

- **頂点シェーダー（Vertex Shader）**：頂点を画面上のどこに配置するかを計算する
- **フラグメントシェーダー（Fragment Shader）**：各ピクセルを何色にするかを計算する

これらが GPU 内で **並列実行** されることで、滑らかなアニメーションや複雑な質感表現が成り立ちます。

---

## 2. 生の WebGL を書くと大変

ここで、生の WebGL で **赤い三角形を1つ描く** だけのコードを見てみます。

---

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
```

---

```js
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
```

---

```js
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

---

これで描けるのは **塗りつぶされた三角形1つ**。動きません。色もシェーダーにベタ書きで一色です。

ここから 3Dモデルを読み込み、ライティング、カメラ移動、アニメーションを追加していくと、すぐに数千行のコードになります。WebGL は GPU を「素手で」触る API なので、何をするにも人間側がお膳立てをしないといけません。

**だからこそ、ライブラリを使います。** 業界デファクトが [three.js](https://threejs.org/) です。

---

## 3. three.js で学ぶ 3DCG の基本概念

three.js を理解する前に、3DCG というジャンルそのものの **基本ボキャブラリ** を押さえます。これは three.js 固有の話ではなく、Unity でも Blender でも Maya でも共通する考え方です。

---

3DCG の描画には、必ず次の登場人物が出てきます。

- **シーン（Scene）**：3D空間そのもの。物体やライトを入れる器
- **カメラ（Camera）**：どこから、どんな画角で世界を見るか
- **ライト（Light）**：空間にどう光を当てるか
- **ジオメトリ（Geometry）**：物体の「形」のデータ
- **マテリアル（Material）**：物体の「見た目」のデータ
- **メッシュ（Mesh）**：ジオメトリ＋マテリアルを組み合わせた、実際の物体
- **レンダラー（Renderer）**：これらを毎フレーム計算して、`<canvas>` に描き出す装置

順番に見ていきます。

---

### シーン（Scene）

3D空間そのもの。すべての物体・光源を入れる「器」です。ここに物体（メッシュ）やライトを add していきます。

```js
const scene = new THREE.Scene();
```

---

### カメラ（Camera）

「どこから・どんな画角で見るか」を決める存在です。three.js には主に2種類あります。

---

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

---

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

---

### ライト（Light）

3D空間に置いただけでは、ほとんどの物体は **真っ黒** です。光が当たって初めて見える、というのが3DCGの世界の前提です（ライトを必要としないマテリアルもあります）。

---

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

---

### ジオメトリ（Geometry）

「形」のデータ。頂点（vertex）の集まりです。three.js には主要な形状がプリセットで用意されています。

```js
new THREE.BoxGeometry(1, 1, 1);          // 立方体
new THREE.SphereGeometry(1, 32, 32);     // 球
new THREE.PlaneGeometry(2, 2);           // 平面
new THREE.TorusGeometry(1, 0.4, 16, 100);// ドーナツ
```

自前のモデルを使いたいときは、Blender などで作った `.gltf` ファイルを読み込んで Geometry として扱います。

---

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

---

### メッシュ（Mesh）：ジオメトリ + マテリアル

ジオメトリ（形）とマテリアル（見た目）を組み合わせると、シーンに置ける物体 = **メッシュ** になります。

```js
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
```

---

### レンダラー（Renderer）と描画パイプライン

ここまでで「シーン」「メッシュ」「カメラ」「ライト」が揃いました。最後に **レンダラー** が、これらを毎フレーム計算して `<canvas>` に絵を描き出します。

```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
```

---

毎フレーム動かしたいときは、`requestAnimationFrame` でループします。

```js
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  renderer.render(scene, camera);
}
animate();
```

---

#### 描画パイプラインの全体像

1フレームの描画で、内部的には次のことが起きています。

1. **シーン内の各メッシュをループ**：何を描くか列挙する
2. **頂点シェーダー実行**：各頂点を 3D空間 → カメラ視点 → 2D画面 に変換する（GPU並列）
3. **ラスタライズ**：頂点で作られた三角形を、画面上のピクセルに分解する
4. **フラグメントシェーダー実行**：各ピクセルの色を決める（マテリアル＋ライト計算）（GPU並列）
5. **深度テスト**：手前のピクセルが奥のピクセルを隠す処理
6. **画面に出力**：`<canvas>` に1枚の絵として表示

three.js は、このパイプラインを宣言的に組み立てられるよう抽象化してくれているわけです。

---

### 最小コード：回転する立方体

ここまでの登場人物を全部使った最小のサンプルです。

---

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
```

---

```js
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

---

これで3D空間でくるくる回る青い立方体が描けます。生 WebGL で「赤い三角形1つ」だったコード量と比べると、扱える表現の幅が一気に広がっていることが分かります。

---

## 4. 演出パターン1：DOMと3Dの奥行き連動

最初のパターンは、**DOM要素の Z方向移動（CSS perspective）と、3Dカメラの z軸移動を同時に走らせて、シーン全体が奥行き方向に流れる演出** を作るやり方です。

---

### 何を作るのか

- 背景に three.js のシーン（奥に広がる立体的なオブジェクト群）
- 前面に DOM の Section 1 / Section 2 が CSS perspective で奥行き方向に配置されている
- 「次のセクションへ」ボタンを押すと:
    - **DOM Section 1** が `translateZ(0) → translateZ(1200px)` でこちらに向かって拡大していき、viewer を通り抜けるあたりで非表示になる
    - **DOM Section 2** が `translateZ(-4500px) → translateZ(0)` で奥から近づき、不透明度も 0→1 で出現する
    - **3D カメラ** が `z: 5 → -30` で前進する
- すべて同じ duration（1.6秒）で進むので、**DOM の奥行き感と背景3Dの奥行き感がぴったり一致** する

スクロールではなく、明示的なボタンで遷移するため、プロダクトの「次のページへ」「次のステップへ」といった文脈で使える表現です。

---

### なぜ DOM と 3D を分けるのか

「全部 three.js でやればいいのでは？」と思うかもしれませんが、テキスト要素を3D空間に置くと、

- フォントのアンチエイリアスが汚くなる
- アクセシビリティ（スクリーンリーダー、コピー、検索）が崩れる
- レスポンシブ対応が難しい
- SEO 上もテキストとして認識されない

という欠点があります。逆に DOM だけだと、奥行きや3Dの質感は出せません。

**「読ませたいテキストは DOM、空間表現は WebGL」** と棲み分けて、両者を同期させるのが現実的な落としどころです。

---

### 仕組み（HTML / CSS）

`<canvas>` を背面に固定し、その上に CSS `perspective` を持つステージを置いて、Section 1 / Section 2 を重ねます。

---

```html
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; }
  #bg { position: fixed; inset: 0; z-index: 0; }

  /* DOMを3D空間に配置するためのステージ */
  .stage {
    position: fixed;
    inset: 0;
    z-index: 1;
    perspective: 800px;
    perspective-origin: 50% 50%;
  }
  .section {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
```

---

```html
  /* Section 2 のみ CSS transition で動かす（Section 1 は JS駆動） */
  .section-2 {
    transition: transform 1.6s cubic-bezier(0.65, 0, 0.35, 1),
                opacity 1.6s ease;
  }

  /* 初期状態 */
  .section-1 { transform: translateZ(0); }
  .section-2 { transform: translateZ(-4500px); opacity: 0; }

  /* advanced クラスが付くと Section 2 が前進＆フェードイン */
  .stage.advanced .section-2 {
    transform: translateZ(0);
    opacity: 1;
  }
</style>

<canvas id="bg"></canvas>
<div class="stage" id="stage">
  <div class="section section-1"><div class="card">Section 1</div></div>
  <div class="section section-2"><div class="card">Section 2</div></div>
</div>
<button id="advance">次のセクションへ →</button>
```

---

#### `perspective` と `perspective-origin` の意味

DOM要素に CSS で奥行きを持たせるには、**親要素に `perspective` を指定する** のがポイントです。これがないと、子要素に `translateZ` を書いても「ただの2D要素」として扱われてしまい、奥行き感が出ません。

---

**`perspective: 800px`** — 「viewer（画面を見ている人）が画面から 800px 手前にいる」と仮定して、3D空間を計算する。

数字が **小さいほど遠近感が強く**（魚眼レンズ風）、**大きいほど穏やか**（望遠レンズ風）に見えます。

---

#### `perspective` の値による見え方の違い

| 値 | 見え方 |
|---|---|
| `200px` | 強烈に遠近感が出る（手前に来た要素が爆発的に拡大） |
| `800px` | ほどよい奥行き感（今回の選択） |
| `2000px` | 遠近感が弱く、ほぼ正射影に近い |

---

また、`translateZ` の値がこの perspective に近づくほど要素は viewer に近づき、**`translateZ(800px)` で viewer の位置（消失点）に到達** します。これを越えると拡大率が無限大になるため、サンプル4で `translateZ(800px)` 付近で `visibility: hidden` にしているのはこれが理由です。

- **`perspective-origin: 50% 50%`** — viewer がどこから覗いているかの位置（消失点の中心）。デフォルトもこの値なので省略してもOKですが、明示しておくと意図が分かります。`0% 0%` にすれば左上から覗いた斜めの3D空間になります。

つまりこの2行で、「`.stage` 要素を、画面から 800px 手前の中央に立つ viewer から覗き込む 3D 空間として扱う」という宣言をしているわけです。

---

### 仕組み（JavaScript）

Section 2 と 3Dカメラはシンプルなアニメーションで済みますが、Section 1 だけは **near plane（`perspective` と同じ値）を越えたら非表示にする** ロジックが必要なので、JS でフレーム単位に制御します。

---

```js
import * as THREE from 'three';

// 3Dシーン
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('bg'),
  antialias: true,
  alpha: true,
});
renderer.setSize(innerWidth, innerHeight);
```

---

```js
// 奥に広がるキューブ群
for (let i = 0; i < 40; i++) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x00aaff })
  );
  mesh.position.set(
    (Math.random() - 0.5) * 8,
    (Math.random() - 0.5) * 6,
    -i * 2
  );
  scene.add(mesh);
}
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(3, 5, 5);
scene.add(dir);

(function loop() {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
})();
```

---

```js
// ── ボタンで DOM と 3D カメラを同時に動かす ──
const stage = document.getElementById('stage');
const section1 = document.querySelector('.section-1');
const btn = document.getElementById('advance');
let advanced = false;

const PERSPECTIVE = 800;     // CSS perspective と同じ値
const HIDE_THRESHOLD = 700;  // この値を越えたら Section 1 を非表示
const DURATION = 1600;

const easeInOutCubic = (t) =>
  t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

function animate(duration, onStep) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    onStep(t, easeInOutCubic(t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
```

---

```js
btn.addEventListener('click', () => {
  advanced = !advanced;
  stage.classList.toggle('advanced', advanced);

  const startCam = camera.position.z;
  const endCam   = advanced ? -30 : 5;
  const startS1  = advanced ? 0    : 1200;
  const endS1    = advanced ? 1200 : 0;

  section1.style.visibility = 'visible';
  animate(DURATION, (t, eased) => {
    camera.position.z = startCam + (endCam - startCam) * eased;
    const z = startS1 + (endS1 - startS1) * eased;
    section1.style.transform = `translateZ(${z}px)`;
    // near plane を越えるくらい大きくなったら非表示
    section1.style.visibility = z >= HIDE_THRESHOLD ? 'hidden' : 'visible';
  });

  btn.textContent = advanced ? '← 戻る' : '次のセクションへ →';
});
```

---

### 学べるポイント

- **CSS `perspective` を使うと、DOM要素も擬似的に3D空間に置ける**（`translateZ` で奥行きを表現できる）
- **DOM の奥行きと WebGL の奥行きを同じ時間軸で動かすと、両者が同じ空間にいるように見える**
- `perspective: 800px` の場合、`translateZ(800px)` で要素が viewer の位置に到達し、それを越えると拡大率が無限大になる。手前を抜けたタイミングで明示的に非表示にすると安全
- CSS transition で済む部分は CSS に任せ、フレーム単位の制御が必要な部分だけ JS でやる、というハイブリッド設計

---

## 5. 演出パターン2：並行投影 × スクロールで鳥瞰ビュー

2つめは、`OrthographicCamera`（並行投影カメラ）を使って、**マップを上から俯瞰するような表現** を作る例です。

---

### 何を作るのか

- 並行投影カメラで街（建物群）を斜め上から見下ろす
- スクロールに応じてカメラの位置を横方向に動かす
- 一定間隔で配置された建物が、画面の **右上から左下に向かって流れる** ように見える
- DOM 側は中身を持たない高さだけの `<div>`。**スクロール量を稼ぐためだけのスペーサ** として置く

---

### なぜ並行投影なのか

`PerspectiveCamera`（透視投影）でこれをやると、遠くの建物が小さくなって「奥行きはあるけどマップらしくない」見え方になります。並行投影だと **遠近によらず同じスケール** で描画されるため、ファミコン時代の RPG のような、設計図的な見え方になります。

ビジネス資料の見出しビジュアル、UI 背景、インフォグラフィックなどに向く描画方法です。

---

### スクロールに「直接」追従する

パターン1ではボタン押下時にイージングを入れていましたが、こちらは **スクロール位置をそのままカメラ位置に反映** します。スクロールの量と街の進行が1対1で対応するので、ユーザーが「自分でカメラを動かしている」感覚になります。

---

### 仕組み（HTML）

DOM 側は本当に空でよく、スクロール領域を確保するための高さ指定だけです。

```html
<style>
  body { margin: 0; font-family: system-ui, sans-serif; }
  #bg { position: fixed; inset: 0; z-index: 0; }
  /* スクロール領域だけ確保する空の div */
  .spacer { height: 400vh; }
</style>

<canvas id="bg"></canvas>
<div class="spacer"></div>
```

---

### 仕組み（JavaScript）

```js
import * as THREE from 'three';

const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // 真っ白の背景

// 並行投影カメラ
const aspect = innerWidth / innerHeight;
const viewSize = 10; // 視野の縦サイズ
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect, viewSize * aspect, // left, right
   viewSize, -viewSize,                   // top, bottom
   0.1, 200                               // near, far
);
// 斜め上から見下ろす位置に置く（x を負側にすると、建物が右上→左下に流れる）
camera.position.set(-20, 20, 20);
camera.lookAt(0, 0, 0);
```

---

```js
// 地面（真っ白）
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 200),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 建物を等間隔に並べる（ライトトーンのブルー）
for (let i = 0; i < 60; i++) {
  const h = 1 + Math.random() * 3;
  const palette = [0x88bbee, 0xaaccee, 0xbbddf2, 0xcce4f5];
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(1, h, 1),
    new THREE.MeshLambertMaterial({ color: palette[i % palette.length] })
  );
  building.position.set(i * 3 - 30, h / 2, (i % 2) * 2);
  scene.add(building);
}
```

---

```js
// 全体を明るく＋立体感のため複数方向からライティング
scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(5, 10, 5);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.6);
fill.position.set(-8, 6, -5);
scene.add(fill);

// スクロール位置をそのままカメラ位置に反映（イージングなし）
function updateCamera() {
  const ratio = window.scrollY / (document.body.scrollHeight - innerHeight);
  camera.position.x = 60 - ratio * 80; // スクロールするほど x が小さくなる
  camera.lookAt(camera.position.x + 20, 0, camera.position.z - 20);
}
window.addEventListener('scroll', updateCamera);
updateCamera();

(function loop() {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
})();
```

---

### 学べるポイント

- `OrthographicCamera` の使い所（情報設計的に並行投影が向く場面）
- カメラを動かすだけで「世界を進む」表現が作れる
- DOM は中身を持たない **スペーサ** として、スクロール量を稼ぐためだけに使うパターン

---

## 6. 課題

---

### 課題1：基本概念を入れ替えて遊ぶ

回転する立方体に対して、次の変更を試してみる。

- ジオメトリを `SphereGeometry` `TorusGeometry` などに差し替える
- マテリアルを `MeshBasicMaterial` `MeshStandardMaterial` で切り替えて、ライトの効き方の違いを観察する
- ライトを `PointLight` に変えて、位置を動かしてみる
- カメラを `OrthographicCamera` に切り替えて、見た目がどう変わるか確認する

---

### 課題2：演出パターン2を再現する

5章の「鳥瞰ビュー」のコードをローカルで動かす。建物の配置・色・高さを変えたり、カメラの移動方向を変えたりして、自分の世界観を作ってみる。

---

さらに余裕があれば、**フリーで配布されている3Dモデルファイル（.glb / .gltf）を読み込んで、街の中に置いてみる** ことにも挑戦してみてください。プリミティブな BoxGeometry の代わりに、ちゃんとした建物・キャラクター・小物のモデルが並ぶと一気に世界観が広がります。

- 入手先の例:
    - [Poly Pizza](https://poly.pizza/)（低ポリの 3Dアセット。CC0 / CC-BY が多い）
    - [Kenney Assets](https://kenney.nl/assets)（CC0 のゲームアセット）

---

- 読み込みには three.js の `GLTFLoader` を使います:

```js
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('./models/building.glb', (gltf) => {
  gltf.scene.position.set(0, 0, 0);
  gltf.scene.scale.set(1, 1, 1);
  scene.add(gltf.scene);
});
```

- ファイルは `vol_09/demo/models/` などに置き、相対パスで参照。

---

## 7. まとめ

- **WebGL は GPU を直接使うブラウザの描画API**。シェーダーで並列描画する
- **生の WebGL は低レベル** で、簡単な絵を描くにも大量のコードが必要
- **three.js** は WebGL を扱いやすくラップしたデファクトライブラリ
- 3DCG の基本登場人物：**シーン／カメラ／ライト／ジオメトリ／マテリアル／メッシュ／レンダラー**

---

- カメラには **PerspectiveCamera（透視投影）** と **OrthographicCamera（並行投影）** があり、世界観を決定づける
- 描画パイプラインは「頂点シェーダー → ラスタライズ → フラグメントシェーダー → 深度テスト → 出力」
- 演出として **DOM と 3D を組み合わせる** のが実用的な設計：DOMは情報、3Dは空間表現
- **パターン1**：透視投影 × カメラのZ移動で奥行き演出
- **パターン2**：並行投影 × カメラの平面移動で鳥瞰ビュー

---

次回は、ここで触れた **マテリアル** と **シェーダー** をさらに掘り下げ、GLSL を直接書いて「ピクセル単位で絵を作る」シェーダー芸の世界に入ります。
