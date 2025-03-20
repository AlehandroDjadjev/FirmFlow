export default function Signup() {
  return (
    <div className="flex justify-center items-center h-screen bg-black">
      <div className="bg-black border border-gray-800 p-8 rounded-xl shadow-lg w-80 text-white">
        <h2 className="text-2xl font-bold mb-4 text-center">Регистрация</h2>
        <input
          type="text"
          placeholder="Име"
          className="w-full p-2 mb-3 rounded bg-gray-800 text-white outline-none"
        />
        <input
          type="email"
          placeholder="Имейл"
          className="w-full p-2 mb-3 rounded bg-gray-800 text-white outline-none"
        />
        <input
          type="password"
          placeholder="Парола"
          className="w-full p-2 mb-3 rounded bg-gray-800 text-white outline-none"
        />

        <div className="flex justify-center">
          <button className="w-40 cursor-pointer bg-gray-700 p-2 rounded-xl hover:bg-gray-600 transition text-white">
            Регистрирай се
          </button>
        </div>

        <p className="text-sm mt-3 text-center">
          Вече имате акаунт?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Вход
          </a>
        </p>
      </div>
    </div>
  );
}
