export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-6xl">
          Portfolio
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Welcome to my portfolio website.
        </p>
      </main>
    </div>
  );
}

