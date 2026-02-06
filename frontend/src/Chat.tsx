import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Plus } from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import Markdown from "react-markdown";
import { Nav } from "./Nav";
import Yourchats from "./Yourchats";

const getVisitorId = () => {
  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitor_id", id);
  }
  return id;
};

const visitor_id = getVisitorId();

const socket = io(import.meta.env.VITE_BACK_URL, {
  auth: { visitor_id }
});

type Role = "user" | "ai";

type Message = {
  role: Role;
  text: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const [title, setTitle] = useState<string | null>(null);
  const [chatTitles, setChatTitles] = useState<string[]>([]);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* 🔹 Load latest chat on reload */
  useEffect(() => {
    async function loadLatestChat() {
      const res = await axios.post(
        `${import.meta.env.VITE_BACK_URL}/latest-chat`,
        { visitor_id }
      );

      setActiveTitle(res.data.title);
      setTitle(res.data.title);
    }

    loadLatestChat();
  }, []);

  /* 🔹 Load chat titles */
  useEffect(() => {
    async function loadTitles() {
      const res = await axios.post(
        `${import.meta.env.VITE_BACK_URL}/chat-titles`,
        { visitor_id }
      );
      setChatTitles(res.data.titles || []);
    }

    loadTitles();
  }, []);

  /* 🔹 Load messages for active chat */

  useEffect(() => {
    async function loadMessages() {
      if (!activeTitle) return;

      const res = await axios.post(
        `${import.meta.env.VITE_BACK_URL}/chats`,
        {
          visitor_id,
          title: activeTitle
        }
      );

      const dbMessages = res.data.data || [];

      // ✅ Do NOT overwrite socket messages if DB empty
      if (dbMessages.length > 0) {
        setMessages(dbMessages);
      }
    }

    loadMessages();
  }, [activeTitle]);


  /* 🔹 Socket listeners */
  useEffect(() => {
    socket.on("bot_message", (data) => {
      setTyping(false);

      if (!title && data.title) {
        setTitle(data.title);
        setActiveTitle(data.title);
        setChatTitles((prev) =>
          prev.includes(data.title) ? prev : [data.title, ...prev]
        );
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.message }
      ]);
    });

    socket.on("bot_typing", () => setTyping(true));

    return () => {
      socket.off("bot_message");
      socket.off("bot_typing");
    };
  }, [title]);

  /* 🔹 Auto scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  /* 🔹 Send message */
  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: input }
    ]);

    socket.emit("user_message", {
      message: input,
      title
    });

    setInput("");
  };

  /* 🔹 New chat */
  const newChat = () => {
    setTitle(null);
    setActiveTitle(null);
    setMessages([
      { role: "ai", text: "Hello 👋 How can I help you?" }
    ]);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b1020] via-[#0f1a2f] to-black flex flex-col">
      <Nav />

      <div className="flex flex-1 overflow-hidden">
        <Yourchats
          chatTitles={chatTitles}
          activeTitle={activeTitle}
          setActiveTitle={(t) => {
            setActiveTitle(t);
            setTitle(t);
          }}
        />

        <div className="flex-1 flex justify-center p-4">
          <div className="w-full max-w-3xl h-[80vh] bg-white/5 backdrop-blur-xl rounded-xl flex flex-col border border-gray-700">

            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
              <Bot className="text-indigo-400" />
              <h1 className="text-white font-semibold">
                {activeTitle ?? "New Chat"}
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              <button
                onClick={newChat}
                className="bg-indigo-600 size-12 p-4 rounded-full text-white absolute bottom-20 right-4"
              >
                <Plus size={18} />
              </button>
              {/* Greeting for Introduction */}
              {activeTitle === "Introduction" && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] px-4 py-3 rounded-xl text-sm bg-slate-700 text-slate-200">
                    <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                      <Bot size={12} /> AI
                    </div>
                    Hello 👋 Who are you?
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-xl text-sm ${msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-200"
                      }`}
                  >
                    <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                      {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
                      {msg.role === "user" ? "You" : "AI"}
                    </div>
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              ))}

              {typing && (
                <div className="text-slate-400 italic">AI is typing...</div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-xl outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 px-4 rounded-xl text-white"
              >
                <Send size={18} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
