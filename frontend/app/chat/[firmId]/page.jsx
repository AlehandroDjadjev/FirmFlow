"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiMaximize2,
  FiMinimize2,
  FiDownload,
  FiChevronDown,
  FiUser,
  FiCpu,
  FiBook,
  FiFileText,
  FiTrash2,
  FiPlus,
} from "react-icons/fi";
import apiFetch from "@/app/apifetch";

export default function ChatPage() {
  const [chatHistory, setChatHistory] = useState([]);
  const [firmName, setFirmName] = useState("");
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocContent, setSelectedDocContent] = useState("");
  const [selectedDocTitle, setSelectedDocTitle] = useState("Основен документ");
  const [mainDocument, setMainDocument] = useState("");
  const { firmId } = useParams();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!firmId || !token) return;

    apiFetch(`http://localhost:8000/api/LLM/interactions/${firmId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setChatHistory(data.interactions || []))
      .catch((err) => console.error("Chat history error:", err));

    apiFetch(`http://localhost:8000/api/LLM/firm/${firmId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFirmName(data.name))
      .catch((err) => console.error("Name fetching error:", err));

    fetch(`http://localhost:8000/api/LLM/documents/main/${firmId}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setMainDocument(data.main_document || ""))
      .catch((err) => console.error("Main doc error:", err));

    fetch(`http://localhost:8000/api/LLM/documents/list/${firmId}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setDocuments(data.documents || []));
  }, [firmId]);

  const handleDocumentSelect = async (docId, title) => {
    const token = localStorage.getItem("access");
    if (docId === "main") {
      setSelectedDocContent(mainDocument);
      setSelectedDocTitle("Основен документ");
    } else {
      const res = await fetch(
        `http://localhost:8000/api/LLM/document/${firmId}/${docId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setSelectedDocContent(data.document.text || "");
      setSelectedDocTitle(title);
    }
  };

  useEffect(() => {
    if (mainDocument) setSelectedDocContent(mainDocument);
  }, [mainDocument]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `http://localhost:8000/api/LLM/submit/${firmId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt: inputMessage.trim() }),
        }
      );

      if (!res.ok) throw new Error("Грешка при съобщението");

      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          user_prompt: inputMessage.trim(),
          ai_response: data.response,
          rag_context: data.rag_context || "",
        },
      ]);
      setInputMessage("");
    } catch (err) {
      console.error("Send Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadContext = (contextText, index) => {
    const blob = new Blob([contextText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `context_firm_${firmId}_msg_${index + 1}.txt`;
    link.click();
  };

  const createDocumentFromSelection = async () => {
    const token = localStorage.getItem("access");

    const selectedMessages = selectedIndexes.map((i) => {
      const msg = chatHistory[i];
      return `User: ${msg.user_prompt}\nAI: ${msg.ai_response}`;
    });

    if (selectedMessages.length === 0) {
      alert("Моля, избери съобщения.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/LLM/documents/upload/${firmId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ selected_messages: selectedMessages }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Грешка при създаването.");

      alert("Документът е създаден успешно.");
      setSelectedIndexes([]);

      const updatedDocs = await fetch(
        `http://localhost:8000/api/LLM/documents/list/${firmId}/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const docData = await updatedDocs.json();
      setDocuments(docData.documents || []);
      location.reload(true);
    } catch (err) {
      console.error("Document creation failed:", err);
      alert("Неуспешно създаване на документ.");
    }
  };

  const updateMainDocument = async () => {
    const token = localStorage.getItem("access");

    const selectedMessages = selectedIndexes.map((i) => {
      const msg = chatHistory[i];
      return `User: ${msg.user_prompt}\nAI: ${msg.ai_response}`;
    });

    if (selectedMessages.length === 0) {
      alert("Моля, избери съобщения.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/LLM/firms/${firmId}/update-main-document/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ selected_messages: selectedMessages }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Грешка при създаването.");

      alert("Планат е обновен успешно.");
      setSelectedIndexes([]);

      const updatedDocs = await fetch(
        `http://localhost:8000/api/LLM/documents/list/${firmId}/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const docData = await updatedDocs.json();
      setDocuments(docData.documents || []);
      location.reload(true);
    } catch (err) {
      console.error("Document creation failed:", err);
      alert("Неуспешно обноваване на план.");
    }
  };

  const toggleCheckbox = (index) => {
    setSelectedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDeleteDocument = async (id) => {
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(
        `http://localhost:8000/api/LLM/documents/delete/${firmId}/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Грешка при изтриването");
      }

      alert("Документът е изтрит успешно.");

      const updatedDocs = await fetch(
        `http://localhost:8000/api/LLM/documents/list/${firmId}/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const docData = await updatedDocs.json();
      setDocuments(docData.documents || []);
      location.reload(true);
    } catch (err) {
      console.error("Document deletion failed:", err);
      alert("Неуспешно изтриване на документ");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Chat area */}
      <div className="w-5/7 min-h-screen flex flex-col justify-start px-10 py-6 bg-gradient-to-br from-orange-400 to-red-500 text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/home")}
            className="bg-[#0e0e0e]/80 px-4 py-2 rounded hover:[#292929]/70 cursor-pointer"
          >
            Назад
          </button>
          <h2 className="text-xl font-bold cursor-default">{firmName}</h2>
          <button
            onClick={() => router.push("/rag_add")}
            className="bg-[#0e0e0e]/80 px-4 py-2 rounded hover:bg-[#292929]/70 cursor-pointer flex items-center gap-2"
          >
            <FiPlus className="text-lg" />
            Добави RAG Контекст
          </button>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {chatHistory.length === 0 ? (
            <p className="text-gray-100">Няма съобщения.</p>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className="mb-6 p-6 rounded-lg bg-white/5 flex gap-4 items-start"
              >
                <input
                  type="checkbox"
                  checked={selectedIndexes.includes(idx)}
                  onChange={() => toggleCheckbox(idx)}
                  className="mt-2 h-5 w-5 accent-white cursor-pointer"
                />
                <div className="flex-1 flex flex-col gap-2">
                  {/* User bubble */}
                  <div className="bg-neutral-800/15 p-4 rounded-2xl ml-auto max-w-[100%]">
                    <p className="flex items-center gap-2 text-right break-words">
                      <FiUser className="text-lg" />
                      <span>{msg.user_prompt}</span>
                    </p>
                  </div>
                  {/* AI bubble */}
                  <div className="bg-neutral-800/15 p-5 rounded-2xl mr-auto max-w-[100%]">
                    <p className="flex items-center gap-2 break-words">
                      <FiCpu className="text-lg" />
                      <span>{msg.ai_response}</span>
                    </p>
                  </div>
                  {/* RAG context download */}
                  {msg.rag_context && (
                    <button
                      onClick={() => downloadContext(msg.rag_context, idx)}
                      className="text-sm mt-2 px-3 py-1 rounded bg-black/40 hover:bg-black/60 transition flex items-center gap-2 w-max"
                    >
                      <FiFileText /> Изтегли контекста
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {/* Loading bubble while waiting for AI */}
          {loading && (
            <div className="mb-6 p-6 rounded-lg bg-white/5 flex gap-4 items-start">
              <div className="flex-1 flex flex-col gap-2">
                <div className="bg-neutral-800/15 p-4 rounded-lg mr-auto max-w-[70%] flex items-center gap-2">
                  <FiCpu className="text-xl" />
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.2s]"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-.4s]"></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex mt-6">
          <input
            type="text"
            className="flex-1 p-4 bg-black/40 text-white border border-white/30 rounded-l-lg focus:outline-none"
            placeholder="Въведи съобщение..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className={`px-6 py-4 rounded-r-lg transition-all duration-300 ${
              loading || !inputMessage.trim()
                ? "bg-[#0e0e0e]/70 text-white/30 cursor-not-allowed"
                : "bg-[#0e0e0e]/80 hover:[#292929]/70 cursor-pointer"
            }`}
          >
            Изпрати
          </button>
        </div>

        {/* Bulk actions */}
        <div className="flex mt-4 justify-between gap-4 flex-col sm:flex-row">
          <button
            onClick={updateMainDocument}
            disabled={selectedIndexes.length === 0}
            className={`px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 w-full sm:w-auto ${
              selectedIndexes.length === 0
                ? "bg-white/20 text-white/40 cursor-not-allowed"
                : "bg-black/90 text-white hover:bg-black/50 cursor-pointer"
            }`}
          >
            Обнови плана с избраното
          </button>
          <button
            onClick={createDocumentFromSelection}
            disabled={selectedIndexes.length === 0}
            className={`px-6 py-4 text-sm font-medium rounded-lg transition-all duration-300 w-full sm:w-auto ${
              selectedIndexes.length === 0
                ? "bg-white/20 text-white/40 cursor-not-allowed"
                : "bg-black/90 text-white hover:bg-black/50 cursor-pointer"
            }`}
          >
            Създай нов документ с избраното
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-2/7 min-h-screen bg-black text-white p-6 overflow-y-auto border-l border-white/10">
        <div
          className={`${
            isExpanded
              ? "fixed top-0 left-0 w-full h-full z-50 bg-black p-6"
              : "w-full min-h-screen bg-black text-white p-6 border-l border-white/10"
          } transition-all duration-300 overflow-y-auto`}
        >
          {/* Document header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-center flex-1 break-words">
              {selectedDocTitle}
            </h2>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  const blob = new Blob([selectedDocContent], {
                    type: "text/plain",
                  });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `firm_${firmId}_document.txt`;
                  link.click();
                }}
                title="Изтегли"
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded cursor-pointer flex items-center justify-center"
              >
                <FiDownload />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Намали" : "Разшири"}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded cursor-pointer flex items-center justify-center"
              >
                {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
              </button>
            </div>
          </div>

          {/* Document actions */}
          <div className="mb-4 flex flex-col gap-2">
            <button
              onClick={() => handleDocumentSelect("main", "Основен документ")}
              className="w-full bg-[#111] text-white py-2 rounded hover:bg-[#222] transition cursor-pointer flex items-center gap-2 justify-center"
            >
              <FiBook /> Покажи основен документ
            </button>

            <div className="relative">
              <div className="bg-[#111] rounded overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] cursor-pointer">
                  <span className="flex items-center gap-2">
                    <FiFileText /> Други документи
                  </span>
                  <FiChevronDown />
                </div>
                <div className="flex flex-col">
                  {documents.length === 0 && (
                    <span className="text-sm text-gray-400 px-4 py-2">
                      Няма други документи
                    </span>
                  )}
                  {documents.map((doc) => (
                    <div
                      key={doc.document_number}
                      className="flex justify-between items-center w-full px-4 py-2 hover:bg-[#2a2a2a] text-sm border-t border-white/10"
                    >
                      <button
                        onClick={() =>
                          handleDocumentSelect(doc.document_number, doc.title)
                        }
                        className="text-left text-white flex-1 break-words"
                      >
                        {doc.title}
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteDocument(doc.document_number)
                        }
                        className="ml-2 text-red-500 hover:text-red-400"
                        title="Изтрий документа"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {selectedDocContent ? (
            <div className="text-sm whitespace-pre-wrap text-gray-300 leading-relaxed bg-neutral-900 p-4 rounded-lg mt-4">
              {selectedDocContent}
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-10">Няма съдържание.</p>
          )}
        </div>
      </div>
    </div>
  );
}
