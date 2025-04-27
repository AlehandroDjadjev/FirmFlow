"use client";

import React, { useState, useEffect } from "react";
import { HiOutlineDocumentAdd } from "react-icons/hi";
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
  const [currentDocNumber, setCurrentDocNumber] = useState(null);
  const [selectedDocContent, setSelectedDocContent] = useState("");
  const [selectedDocTitle, setSelectedDocTitle] = useState("Основен документ");
  const [mainDocument, setMainDocument] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [insertText, setInsertText] = useState("");
  const [insertMsgs, setInsertMsgs] = useState([]);
  const [insertPicker, setInsertPicker] = useState(false);
  const [newDocText, setNewDocText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [editedDocId, setEditedDocId] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [pickedMsgs, setPickedMsgs] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(true);

  const { firmId } = useParams();
  const router = useRouter();

  // ── Initial data loading ─────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!firmId || !token) return;

    apiFetch(`http://localhost:8000/api/LLM/interactions/${firmId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setChatHistory(data.interactions || []))
      .catch(console.error);

    apiFetch(`http://localhost:8000/api/LLM/firm/${firmId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFirmName(data.name))
      .catch(console.error);

    fetch(`http://localhost:8000/api/LLM/documents/main/${firmId}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setMainDocument(data.main_document || ""))
      .catch(console.error);

    fetch(`http://localhost:8000/api/LLM/documents/list/${firmId}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setDocuments(data.documents || []))
      .catch(console.error);
  }, [firmId]);

  useEffect(() => {
    if (mainDocument) setSelectedDocContent(mainDocument);
  }, [mainDocument]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`http://localhost:8000/api/LLM/submit/${firmId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: inputMessage.trim() }),
      });
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = async (docId, title) => {
    const token = localStorage.getItem("access");
    setEditing(false);
    setEditedText("");
    setEditedDocId(null);
    setAddingDoc(false);
    setCurrentDocNumber(docId);

    const url =
      docId === "main"
        ? `http://localhost:8000/api/LLM/documents/main/${firmId}/`
        : `http://localhost:8000/api/LLM/document/${firmId}/${docId}/`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (docId === "main") {
      setSelectedDocContent(data.main_document || "");
      setSelectedDocTitle("Основен документ");
    } else {
      setSelectedDocContent(data.document.text || "");
      setSelectedDocTitle(title);
    }
  };

  const saveEditedDoc = async () => {
    if (!editedDocId) return;
    const token = localStorage.getItem("access");
    const url =
      editedDocId === "main"
        ? `http://localhost:8000/api/LLM/main/update/${firmId}/`
        : `http://localhost:8000/api/LLM/documents/update/${firmId}/${editedDocId}/`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: editedText }),
    });

    if (!res.ok) {
      alert("Неуспешно запазване на документа");
      return;
    }

    // reload the doc we just edited:
    await handleDocumentSelect(editedDocId === "main" ? "main" : editedDocId, selectedDocTitle);
    setEditing(false);
    setEditedDocId(null);
    setEditedDocId(editedDocId);
    setAddingDoc(false);
    setInserting(false);
    alert("Запазено успешно");
  };

  const insertIntoDoc = async () => {
    if (!insertText.trim() && insertMsgs.length === 0) return;
  
    const token = localStorage.getItem("access");
    if (!token) {
      alert("Не сте влезли в системата.");
      return;
    }
  
    //  👉 list of STRINGS, not objects
    const selected_messages = insertMsgs.map(
      i => `User: ${chatHistory[i].user_prompt}\nAI: ${chatHistory[i].ai_response}`
    );
  
    const payload = {
      body: insertText.trim(),
      ...(selected_messages.length && { selected_messages })
    };
  
    const url =
      selectedDocTitle === "Основен документ"
        ? `http://localhost:8000/api/LLM/firms/${firmId}/update-main-document/`
        : `http://localhost:8000/api/LLM/documents/insert/${firmId}/${currentDocNumber}/`;
  
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        console.error("Insert-into-doc failed:", await res.text());
        alert("Неуспешно вмъкване на информация.");
        return;
      }
  
      const data = await res.json();
      setSelectedDocContent(data.updated_plan ?? data.text ?? insertText);
      setInsertText("");
      setInsertMsgs([]);
      setInserting(false);
      alert("Информацията е добавена успешно.");
    } catch (err) {
      console.error("Insert-into-doc error:", err);
      alert("Неуспешно вмъкване на информация.");
    }
  };
  


  const downloadContext = (contextText, index) => {
    const blob = new Blob([contextText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `context_firm_${firmId}_msg_${index + 1}.txt`;
    link.click();
  };

  const createDocumentFromSelection = async (title, body, messages) => {
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(
        `http://localhost:8000/api/LLM/documents/upload/${firmId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, body, selected_messages: messages }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Грешка при създаването.");
      }
      alert("Документът е създаден успешно.");
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
      console.error(err);
      alert("Неуспешно създаване на документ.");
    }
  };

  const handleDeleteDocument = async (id) => {
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(
        `http://localhost:8000/api/LLM/documents/delete/${firmId}/${id}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
      console.error(err);
      alert("Неуспешно изтриване на документ");
    }
  };


  return (
    <div className="flex h-screen">
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
        <div className="overflow-y-auto max-h-[75vh] pr-2">
          {chatHistory.length === 0 ? (
            <p className="text-gray-100">Няма съобщения.</p>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className="mb-6 p-6 rounded-lg bg-white/5 flex gap-4 items-start"
              >
              
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
      </div>
      
      {/*Sidebar*/ }
      <div className="w-2/7 flex flex-col bg-black text-white border-l border-white/10">
        {/* Wrapper: fixed when expanded, normal when not */}
        <div
          className={`${
            isExpanded
              ? "fixed inset-0 z-50 bg-black p-6 flex flex-col"
              : "h-full p-6 flex flex-col"
          } transition-all duration-300`}
        >
          {/* ── Header (not scrollable) ── */}
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-2xl font-bold flex-1 text-center break-words">
              {selectedDocTitle}
            </h2>
            <div className="flex gap-2">
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
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded"
              >
                <FiDownload />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Намали" : "Разшири"}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded"
              >
                {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
              </button>
            </div>
          </div>

          {/* ── Document actions (not scrollable) ── */}
          <div className="shrink-0 flex flex-col gap-2 mb-4">
            <button
              onClick={() => handleDocumentSelect("main", "Основен документ")}
              className="w-full bg-[#111] py-2 rounded hover:bg-[#222] flex items-center justify-center gap-2"
            >
              <FiBook /> Покажи основен документ
            </button>

            {/* dropdown list */}
            <div className="relative">
              <div className="bg-[#111] rounded">
                {/* header row (click-to-toggle) */}
                <button
                  onClick={() => setDocsOpen(!docsOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <FiFileText /> Други документи
                  </span>
                  <FiChevronDown
                    className={`transition-transform duration-200 ${
                      docsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* --- content pane --- */}
                {docsOpen && (
                  <div className="flex flex-col max-h-72 overflow-y-auto divide-y divide-white/10">
                    {/*  NEW DOCUMENT button  */}
                    <button
                      onClick={() => {
                        setAddingDoc(true);
                        setSelectedDocContent("");   // hide old content
                      }}
                      className="px-4 py-2 flex items-center gap-2 text-sm hover:bg-[#2a2a2a]"
                    >
                      <FiPlus /> Нов документ
                    </button>


                    {/* Existing documents list */}
                    {documents.length === 0 ? (
                      <span className="block text-sm text-gray-400 px-4 py-2">
                        Няма други документи
                      </span>
                    ) : (
                      documents.map((doc) => (
                        <div
                          key={doc.document_number}
                          className="flex items-center justify-between px-4 py-2 hover:bg-[#2a2a2a] text-sm"
                        >
                          <button
                            onClick={() => {
                              setAddingDoc(false);                 // exit add mode
                              handleDocumentSelect(doc.document_number, doc.title);
                            }}
                            className="flex-1 text-left break-words"
                          >
                            {doc.title}
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.document_number)}
                            className="ml-2 text-red-500 hover:text-red-400"
                            title="Изтрий документа"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
              {/* ---------- “insert info” button  ---------- */}
              <button
                onClick={() => {
                  setInserting(true);
                  setAddingDoc(false);
                  setInsertText("");
                  setInsertMsgs([]);
                  setSelectedDocContent("");   // hide viewer
                  /* any other state you need */
                }}
                className="mt-2 w-full bg-[#111] py-2  hover:bg-[#222] flex items-center justify-center gap-2"
              >
                  <HiOutlineDocumentAdd className="text-xl" />Вмъкни информация в заредения документ
              </button>
          </div>


          {/* ── Scrollable document body ── */}
          {/* viewer OR “new document” composer -------------------------- */}
          {/* ── composer OR viewer ───────────────────────────────────────── */}
          {inserting ? (
          /* ——— INSERTING PANEL ——— */
          <div className="flex flex-col gap-6 mt-4 overflow-y-auto">
            {/* message picker */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                Избери съобщения
                <button
                  onClick={() => setInsertPicker(!insertPicker)}
                  className="ml-2 p-1 rounded hover:bg-neutral-800"
                >
                  <FiChevronDown
                    className={`transition-transform ${insertPicker ? "rotate-180" : ""}`}
                  />
                </button>
              </h3>
              {insertPicker && (
                <div className="max-h-40 overflow-y-auto bg-neutral-900 rounded-lg p-2 space-y-1">
                  {chatHistory.map((m, i) => (
                    <label key={i} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-neutral-800 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={insertMsgs.includes(i)}
                        onChange={() =>
                          setInsertMsgs(prev =>
                            prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                          )
                        }
                        className="mt-1 accent-white"
                      />
                      <span className="break-words">{m.user_prompt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* free-text field */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Допълнителен текст</h3>
              <textarea
                value={insertText}
                onChange={e => setInsertText(e.target.value)}
                className="w-full h-40 resize-none p-4 bg-neutral-900 rounded-lg text-sm leading-relaxed focus:outline-none"
                placeholder="Текст за вмъкване…"
              />
            </div>

            {/* submit / cancel */}
            <div className="flex gap-4">
              <button
                onClick={insertIntoDoc}
                disabled={!insertText.trim() && !insertMsgs.length}
                className="flex-1 bg-green-600/80 hover:bg-green-600 px-4 py-3 rounded disabled:opacity-40"
              >
                Вмъкни
              </button>
              <button
                onClick={() => setInserting(false)}
                className="flex-1 bg-red-600/80 hover:bg-red-600 px-4 py-3 rounded"
              >
                Откажи
              </button>
            </div>
          </div>
          ) : addingDoc ? (
            <div className="flex flex-col gap-6 mt-4 overflow-y-auto">

              {/* -------- Title field -------- */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Въведи заглавие</h3>
                <input
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Заглавие…"
                  className="w-full p-3 bg-neutral-900 rounded-lg focus:outline-none"
                />
              </div>

              {/* -------- Message picker -------- */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  Избери съобщения
                  <button
                    onClick={() => setPickerOpen(!pickerOpen)}
                    className="ml-2 p-1 rounded hover:bg-neutral-800"
                  >
                    <FiChevronDown
                      className={`transition-transform ${pickerOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </h3>

                {pickerOpen && (
                  <div className="max-h-40 overflow-y-auto bg-neutral-900 rounded-lg p-2 space-y-1">
                    {chatHistory.length === 0 ? (
                      <p className="text-sm text-gray-400">Няма съобщения.</p>
                    ) : (
                      chatHistory.map((m, i) => (
                        <label
                          key={i}
                          className="flex items-start gap-2 text-sm cursor-pointer hover:bg-neutral-800 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={pickedMsgs.includes(i)}
                            onChange={() =>
                              setPickedMsgs((prev) =>
                                prev.includes(i)
                                  ? prev.filter((x) => x !== i)
                                  : [...prev, i]
                              )
                            }
                            className="mt-1 accent-white"
                          />
                          <span className="break-words">{m.user_prompt}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}

                {/* tiny preview of already-confirmed messages */}
                {pickedMsgs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pickedMsgs.map((idx) => (
                      <span
                        key={idx}
                        className="bg-neutral-800 text-xs px-2 py-1 rounded inline-flex items-center gap-1"
                      >
                        {chatHistory[idx]?.user_prompt.slice(0, 60) || "..."}
                        <button
                          onClick={() =>
                            setPickedMsgs((prev) => prev.filter((x) => x !== idx))
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          <FiTrash2 className="text-[10px]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* -------- Body text -------- */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Въведи съдържание</h3>
                <textarea
                  value={newDocText}
                  onChange={(e) => setNewDocText(e.target.value)}
                  placeholder="Текст на документа…"
                  className="w-full h-52 resize-none p-4 bg-neutral-900 rounded-lg text-sm leading-relaxed focus:outline-none"
                />
              </div>

              {/* -------- Submit -------- */}
              <button
                onClick={async () => {
                  // ---- build payload ----
                  const selected_messages = pickedMsgs.map(i =>
                    `User: ${chatHistory[i].user_prompt}\nAI: ${chatHistory[i].ai_response}`
                  );

                  createDocumentFromSelection(newDocTitle || "Без заглавие",newDocText || "No text",selected_messages)

                  // reset UI
                  setNewDocTitle("");
                  setNewDocText("");
                  setPickedMsgs([]);
                  setAddingDoc(false);
                }}
                disabled={!newDocText.trim() && !pickedMsgs.length}
                className="w-full bg-green-600/80 hover:bg-green-600 px-4 py-3 rounded text-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Запази документа
              </button>
            </div>
          ) :    selectedDocContent && !addingDoc && (
            <div className="flex-1 overflow-auto mt-4 relative">
              {editing ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full h-full p-4 bg-neutral-800 rounded-lg text-gray-300 text-sm leading-relaxed font-mono resize-none focus:outline-none"
                />
              ) : (
                <pre className="w-full h-full whitespace-pre-wrap overflow-auto text-gray-300 leading-relaxed font-mono bg-neutral-900 p-4 rounded-lg">
                  {selectedDocContent}
                </pre>
              )}
              {/* floating buttons unchanged… */}
              <div className="absolute top-2 right-2 flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={saveEditedDoc}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                    >
                      Запази
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
                    >
                      Откажи
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const id =
                        selectedDocTitle === "Основен документ"
                          ? "main"
                          : String(currentDocNumber);
                      setEditedDocId(id);
                      setEditedText(selectedDocContent);
                      setEditing(true);
                      setAddingDoc(false);
                      setInserting(false);
                    }}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded"
                    title="Редактирай"
                  >
                    <FiFileText />
                  </button>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
    </div>
  );
}