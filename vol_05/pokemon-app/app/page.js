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
              className="border border-gray-300 rounded-lg p-4 text-center no-underline text-inherit hover:bg-gray-50"
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
