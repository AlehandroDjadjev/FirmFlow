"use client";

import React, { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Combobox, Transition } from "@headlessui/react";
import { FiLogIn, FiPlus, FiHome, FiUser, FiArrowLeft } from "react-icons/fi";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import apiFetch from "@/app/apifetch";

export default function HomePage() {
  const [firms, setFirms] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    async function fetchFirms() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("access") : null;
        if (!token) return;

        const res = await apiFetch(
          "http://localhost:8000/api/LLM/firms/list/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        setFirms(data.firms || []);
      } catch (error) {
        console.error("Error fetching firms:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFirms();
  }, []);

  const filteredFirms =
    query === ""
      ? firms
      : firms.filter((firm) =>
          firm.name.toLowerCase().includes(query.toLowerCase())
        );

  const handleSelectFirm = () => {
    if (selectedFirm) {
      router.push(`/dashboard/${selectedFirm.id}`);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-700 text-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 w-full py-4 px-6 bg-[#121212]/60 backdrop-blur-md shadow-lg z-20 flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer flex items-center gap-2 bg-[#1a1a1a]/60 hover:bg-[#292929]/60 px-4 py-2 rounded-lg transition"
        >
          <FiHome />
          Начало
        </button>

        <h1 className="text-xl font-semibold tracking-wide text-white">
          FirmFlow
        </h1>

        <button
          onClick={() => router.push("/profile")}
          className="cursor-pointer flex items-center gap-2 bg-[#1a1a1a]/60 hover:bg-[#292929]/60 px-4 py-2 rounded-lg transition"
        >
          <FiUser />
          Профил
        </button>
      </nav>

      {/* Content */}
      <div className="pt-28 flex flex-col items-center px-4">
        {/* Stats */}
        <motion.div
          className="bg-[#1a1a1a]/60 p-6 rounded-2xl shadow-xl w-full max-w-md text-center mb-6 backdrop-blur-md border border-white/10 shadow-inner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-2">Добре дошли!</h2>
          {loading ? (
            <div className="animate-spin text-center">
              <div className="w-6 h-6 border-4 border-t-transparent border-gray-300 rounded-full mx-auto"></div>
              <p className="text-gray-400">Зареждане...</p>
            </div>
          ) : (
            <>
              <p className="text-gray-300">Фирми в системата: {firms.length}</p>
              <p className="text-gray-300">Анализирани проекти: 120+</p>
            </>
          )}
        </motion.div>

        {/* Firm Selection Card */}
        <motion.div
          className="bg-[#121212]/70 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-white/10 shadow-inner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-6">Изберете фирма</h2>

          <button
            onClick={() => router.push("/businessinfo")}
            className="cursor-pointer flex items-center justify-center gap-2 w-full bg-[#1a1a1a]/70 hover:bg-[#333333]/80 py-3 rounded-lg text-white text-md font-medium mb-4 transition"
          >
            <FiPlus />
            Създай нова фирма
          </button>

          {/* Combobox Dropdown */}
          <Combobox value={selectedFirm} onChange={setSelectedFirm}>
            <div className="relative mb-4">
              <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-left shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm">
                <Combobox.Input
                  className="w-full border-none py-3 pl-4 pr-10 text-white bg-transparent focus:ring-0"
                  displayValue={(firm) => firm?.name || ""}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Изберете фирма"
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                </Combobox.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition-all ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="transition-all ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Combobox.Options className="absolute mt-1 w-full overflow-hidden rounded-xl bg-black/80 py-1 text-base shadow-lg ring-1 ring-black/40 focus:outline-none sm:text-sm z-50">
                  {filteredFirms.length === 0 && query !== "" ? (
                    <div className="cursor-default select-none px-4 py-2 text-gray-400">
                      Няма съвпадения.
                    </div>
                  ) : (
                    filteredFirms.map((firm) => (
                      <Combobox.Option
                        key={firm.id}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-purple-600 text-white"
                              : "text-gray-300"
                          }`
                        }
                        value={firm}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {firm.name}
                            </span>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? "text-white" : "text-purple-400"
                                }`}
                              >
                                <CheckIcon className="h-5 w-5" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>

          <button
            onClick={handleSelectFirm}
            disabled={!selectedFirm}
            className={`cursor-pointer flex items-center justify-center gap-2 w-full py-3 rounded-lg text-md font-semibold transition ${
              selectedFirm
                ? "bg-[#1a1a1a]/70 hover:bg-[#333333]"
                : "bg-[#1a1a1a]/40 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FiLogIn />
            Влез
          </button>
        </motion.div>

        {/* Home Shortcut */}
        <motion.button
          onClick={() => router.push("/")}
          className="cursor-pointer mt-6 text-sm text-gray-300 hover:text-white transition flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FiArrowLeft />
          Назад към началото
        </motion.button>
      </div>
    </div>
  );
}
