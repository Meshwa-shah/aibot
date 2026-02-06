import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import Groq from 'groq-sdk';
import cors from 'cors';

dotenv.config();

import userroute from './routes/userroute.js';
import chatroute from './routes/chatroute.js';
import { supabase } from './supabase.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONT_PORT,
    methods: ["GET", "POST"]
  }
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONT_PORT,
  credentials: true
}));
app.use('/', userroute);
app.use('/', chatroute);

const port = process.env.PORT || 8081;

const groq = new Groq({
  apiKey: process.env.GROQ_KEY
});

const COMPANY_ID = "dental_clinic";
let name = undefined;
let phone = undefined;

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

async function getOrCreateSession(visitor_id) {
  const { data: session, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("visitor_id", visitor_id)
    .maybeSingle();

  if (error) throw error;

  if (!session) {
    const { data: newSession, error: insertError } = await supabase
      .from("chat_sessions")
      .insert({
        visitor_id,
        step: "ASK_NAME"
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newSession;
  }

  return session;
}

async function getCompanyKnowledge(companyId) {
  const { data, error } = await supabase
    .from("knowledge")
    .select("content")
    .eq("company_id", companyId);

  if (error || !data) return [];
  return data.map(k => k.content).join("\n");
}

function buildPrompt(knowledgeText, userMessage) {
  return `STRICT RULES:
- You must answer ONLY using the clinic information provided.
- You must NOT provide medical or dental diagnosis.
- You must NOT explain treatment steps or how to cure diseases.
- If a user asks for medical advice, diagnosis, or treatment steps,
  politely redirect them to consulting the dental clinic or a doctor.
- If the answer is not present in the clinic knowledge,
  respond with:
  "Please contact our dental clinic for accurate information."
- If the question is NOT related to the dental clinic,
  respond exactly with:
  "This question is not related to our dental clinic."
- You must answer ONLY about **Vraj Dental Clinic**.
- You must NOT answer questions about any other dental clinic,
  hospital, doctor, brand, or medical center.
- If a user asks about another clinic (by name or indirectly),
  respond EXACTLY with:
  "I can only provide information about Vraj Dental Clinic."
- You must use ONLY the information provided below.
- If the answer is not found in the information, respond EXACTLY with:
  "Please contact Vraj Dental Clinic for accurate information."
- Do NOT guess, assume, or use external knowledge.


Clinic Information:
${knowledgeText}

User Question:
${userMessage}
`;
}

/* -------------------- APIs -------------------- */

/* Get chat titles */
app.post("/chat-titles", async (req, res) => {
  const { visitor_id } = req.body;

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("visitor_id", visitor_id)
    .single();

  if (!session) return res.json({ success: true, titles: [] });

  const { data } = await supabase
    .from("chats")
    .select("title, created_at")
    .eq("session_id", session.id)
    .not("title", "is", null)
    .order("created_at", { ascending: false });

  const titles = [...new Set(data.map(d => d.title))];
  res.json({ success: true, titles });
});

/* Get latest chat */
app.post("/latest-chat", async (req, res) => {
  const { visitor_id } = req.body;

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("visitor_id", visitor_id)
    .single();

  if (!session) {
    return res.json({ title: "Introduction" });
  }

  const { data: chat } = await supabase
    .from("chats")
    .select("title")
    .eq("session_id", session.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  res.json({ title: chat?.title ?? "Introduction" });
});

/* -------------------- SOCKET -------------------- */

io.on("connection", async (socket) => {
  const visitor_id = socket.handshake.auth.visitor_id;

  if (!visitor_id) {
    socket.disconnect();
    return;
  }

  const session = await getOrCreateSession(visitor_id);

  /* Initial greeting only once */
  if (session.step === "ASK_NAME") {
    socket.emit("bot_message", {
      message: "Hello 👋 Who are you?"
    });
  }

  socket.on("user_message", async ({ message, title }) => {
    try {
      socket.emit("bot_typing");

      const session = await getOrCreateSession(visitor_id);

      /* ---------------- ASK NAME ---------------- */
      if (session.step === "ASK_NAME") {
        await supabase
          .from("chat_sessions")
          .update({
            user_name: message,
            step: "ASK_PHONE"
          })
          .eq("id", session.id);

        await supabase.from("chats").insert([
          {
            session_id: session.id,
            role: "user",
            text: message,
            title: "Introduction"
          },
          {
            session_id: session.id,
            role: "ai",
            text: "Thanks! May I have your phone number?",
            title: "Introduction"
          }
        ]);
        name = message;
        socket.emit("bot_message", {
          message: "Thanks! May I have your phone number?"
        });
        return;
      }

      /* ---------------- ASK PHONE ---------------- */
      if (session.step === "ASK_PHONE") {
        if (!isValidPhone(message)) {
          socket.emit("bot_message", {
            message: "Please enter a valid 10-digit phone number."
          });
          return;
        }

        await supabase
          .from("chat_sessions")
          .update({
            phone: message,
            step: "CHAT"
          })
          .eq("id", session.id);

        await supabase.from("chats").insert([
          {
            session_id: session.id,
            role: "user",
            text: message,
            title: "Introduction"
          },
          {
            session_id: session.id,
            role: "ai",
            text: "Thank you! How can I help you today?",
            title: "Introduction"
          }
        ]);

        phone = message;
        await supabase.from('users').insert([{name: name, phone: phone}]);

        socket.emit("bot_message", {
          message: "Thank you! How can I help you today?"
        });
        return;
      }

      /* ---------------- NORMAL CHAT ---------------- */

      let chatTitle = title;
      if (!chatTitle) {
        chatTitle = message.slice(0, 40);
      }

      await supabase.from("chats").insert({
        session_id: session.id,
        role: "user",
        text: message,
        title: chatTitle
      });

      const knowledgeText = await getCompanyKnowledge(COMPANY_ID);
      const prompt = buildPrompt(knowledgeText, message);

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.2
      });

      const aiReply = completion.choices[0].message.content;

      await supabase.from("chats").insert({
        session_id: session.id,
        role: "ai",
        text: aiReply,
        title: chatTitle
      });

      socket.emit("bot_message", {
        message: aiReply,
        title: chatTitle
      });

    } catch (err) {
      console.error(err);
      socket.emit("bot_message", {
        message: "Something went wrong."
      });
    }
  });
});


server.listen(port, () => {
  console.log(`server running on ${port}`)
});