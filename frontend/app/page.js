import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-black text-white">
      <header className="text-center">
        <h1 className="text-4xl font-bold">FirmFlow</h1>
      </header>
      <main className="flex flex-col items-center">
        <h2 className="text-2xl mb-4 font-bold">Започни бизнес с лекота</h2>
        <Link href="/businessinfo" className="bg-gray-700 hover:bg-gray-500 transition-all duration-300 text-white px-4 py-2 rounded-xl transform hover:scale-105">
          Започни сега
        </Link>
      </main>
      <footer className="text-center">
        <p>&copy; 2025 FirmFlow. Всички права запазени.</p>
      </footer>
    </div>
  );
}
