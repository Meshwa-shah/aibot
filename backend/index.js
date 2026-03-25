import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import Groq from "groq-sdk";
import cors from "cors";
import nodemailer from "nodemailer";
import { supabase } from "./supabase.js";
import * as cheerio from "cheerio";
import userroute from "./routes/userroute.js";
import addroute from "./routes/addroute.js";
import regrouter from "./routes/regroute.js";
import { scrapeAndSave } from "./controller/reg.js";
import { generateEmbedScript } from "./controller/reg.js";
import { emailRegex } from "./controller/reg.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONT_PORT,
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONT_PORT,
  credentials: true
}));

const port = process.env.PORT || 8081;

app.use('/user', userroute);
app.use('/add', addroute);
app.use('/reg', regrouter);

const groq = new Groq({
  apiKey: process.env.GROQ_KEY
});

/* ---------------- EMAIL SETUP ---------------- */

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendInactiveEmail(session, company_id) {
  //   try {

  //     // const { data: company } = await supabase
  //     //   .from("companies")
  //     //   .select("email,name")
  //     //   .eq("id", company_id)
  //     //   .maybeSingle();

  //     // if (!company?.email) return;

  //     await transporter.sendMail({
  //       from: process.env.EMAIL_USER,
  //       to: company_id,
  //       subject: "Visitor stopped chatting",
  //       text: `
  // A visitor stopped chatting for 10 minutes.

  // Name: ${session.user_name || "Unknown"}
  // Email: ${session.email || "Not provided"}
  // Phone: ${session.phone || "Not provided"}

  // Visitor ID: ${session.visitor_id}
  //       `
  //     });

  //     console.log("Inactive visitor email sent");

  //   } catch (err) {
  //     console.log("Email error:", err);
  //   }

  try {

    // const { data: company } = await supabase
    //   .from("companies")
    //   .select("email,name")
    //   .eq("id", company_id)
    //   .maybeSingle();

    // if (!company?.email) return;

    /* FETCH CHAT TRANSCRIPT */

    const { data: chats } = await supabase
      .from("chats")
      .select("role,text,created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    let transcript = "";

    chats?.forEach(chat => {

      const sender = chat.role === "user" ? "Visitor" : "Bot";

      transcript += `${sender}: ${chat.text}\n`;

    });

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: company_id,

      subject: "Visitor left the chatbot conversation",

      text: `
A visitor stopped chatting for 2 minutes.

Visitor Information:
Name: ${session.user_name || "Unknown"}
Email: ${session.email || "Not provided"}
Phone: ${session.phone || "Not provided"}

-------------------------
Chat Transcript
-------------------------

${transcript}

-------------------------
End of conversation
      `

    });

    console.log("Transcript email sent");

  } catch (err) {

    console.log("Email error:", err);

  }

}

/* ---------------- INACTIVITY TIMERS ---------------- */

const inactivityTimers = {};

/* ---------------- HELPERS ---------------- */

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
}

async function getOrCreateSession(visitor_id, company_id) {

  const { data: session, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("visitor_id", visitor_id)
    .eq("company_id", company_id)
    .maybeSingle();

  if (error) throw error;

  if (!session) {

    const { data: newSession, error: insertError } = await supabase
      .from("chat_sessions")
      .insert({
        visitor_id,
        company_id,
        step: "ASK_EMAIL"
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return newSession;
  }

  return session;

}

async function getCompanyKnowledge(company_id) {

  const { data } = await supabase
    .from("knowledge")
    .select("content")
    .eq("company_id", company_id);

  return data?.map(k => k.content).join("\n") || "";

}

function buildSystemPrompt(knowledge, companyName) {

  return `
You are an AI assistant representing ${companyName}.

Rules:
- Answer ONLY using the information provided below
- Do NOT add external knowledge
- Do NOT mention other companies
- If someone says OK reply: "Thanks for coming"
- If someone says Thank you reply: "You're welcome"
- If information is not available reply:
- If someone says "Thankyou" then reply with "Your Welcome"
"I can only provide information about ${companyName}
- If someone says "Thankyou" then reply with "Your Welcome"
- If someone says "Ok" then reply with "Hope you like chatting with me"
"

Company Information:
${knowledge}
`;

}

// ---- extra chat info ---- //
app.post("/latest-chat", async (req, res) => { const { visitor_id, company_id } = req.body; const { data: session } = await supabase.from("chat_sessions").select("id").eq("visitor_id", visitor_id).eq("company_id", company_id).maybeSingle(); if (!session) return res.json({ title: null }); const { data: chat } = await supabase.from("chats").select("title").eq("session_id", session.id).order("created_at", { ascending: false }).limit(1).maybeSingle(); res.json({ title: chat?.title ?? null }); });
app.post("/chat-titles", async (req, res) => { const { visitor_id, company_id } = req.body; const { data: session } = await supabase.from("chat_sessions").select("id").eq("visitor_id", visitor_id).eq("company_id", company_id).maybeSingle(); if (!session) return res.json({ titles: [] }); const { data } = await supabase.from("chats").select("title").eq("session_id", session.id).not("title", "is", null).order("created_at", { ascending: false }); res.json({ titles: [...new Set(data.map(d => d.title))] }); });
app.post("/chats", async (req, res) => { const { visitor_id, company_id, title } = req.body; const { data: session } = await supabase.from("chat_sessions").select("id").eq("visitor_id", visitor_id).eq("company_id", company_id).maybeSingle(); if (!session) return res.json({ data: [] }); const { data } = await supabase.from("chats").select("*").eq("session_id", session.id).eq("title", title).order("created_at", { ascending: true }); res.json({ data }); });
app.post('/get-title', async (req, res) => {
  try {
    const { id } = req.body;
    const { data: chats } = await supabase.from("chats").select("title").eq("session_id", id).not("title", "is", null).order("created_at", { ascending: false });
    const { data: time } = await supabase.from("chats").select("created_at").eq("session_id", id).not("title", "is", null).order("created_at", { ascending: false });

    if (chats && time) {
      res.status(201).json({ success: true, data: [...new Set(chats.map(c => c.title))], data2: [...new Set(time.map(t => t.created_at))] });
    }
    else {
      res.status(201).json({ success: false, message: "something went wrong" })
    }
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/get-chat', async (req, res) => {
  try {
    const { id, title } = req.body;
    const { data: chats } = await supabase.from("chats").select("*").eq("session_id", id).eq("title", title).order("created_at", { ascending: true });
    if (chats) {
      const { data: session } = await supabase.from("chat_sessions").select("user_name").eq("id", id);
      res.status(201).json({ success: true, chat: chats, name: session });
    }
    else {
      res.status(201).json({ success: false, message: "something went wrong" });
    }
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
})

// ---- web scraping ----- //
const isValidUrl = (url) => {
  const basicRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}/i;

  if (!basicRegex.test(url)) return false;

  try {
    new URL(url.startsWith("http") ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

app.post("/scrape-website", async (req, res) => {

  const { url, company_id } = req.body;

  if (!url || !company_id) {
    return res.json({ success: false, message: "URL or company_id required" });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({
      message: "Valid url required"
    })
  }

  const { data, error } = await supabase
    .from("users")
    .select("company_id")
    .eq("company_id", company_id);

  if (error) {
    return res.json({
      success: false,
      message: error.message
    });
  }

  if (!data || data.length === 0) {
    return res.json({
      success: false,
      message: "company id doesnt exist"
    });
  }

  const result = await scrapeAndSave(url, company_id);


  res.status(201).json({ success: true, data: result });

});

// ---- extrainfo ---- //
const buildBotConfigText = ({
  companyName,
  websiteUrl,
  description,
  faq,
  supportEmail,
  language,
  importantKnowledge
}) => {

  return `
Our company name is ${companyName}.
Our website URL is ${websiteUrl}.
${description ? `About us: ${description}.` : ""}

${importantKnowledge ? `Here is some important knowledge about our business: ${importantKnowledge}.` : ""}

${faq ? `Here are some frequently asked questions: ${faq}.` : ""}

${supportEmail ? `Support email: ${supportEmail}.` : ""}


${language ? `Language: ${language}.` : ""}
`.trim();

};

app.post('/extrainfo', async (req, res) => {
  try {

    const {
      company_id,
      companyName,
      description,
      faq,
      supportEmail,
      language,
      importantKnowledge
    } = req.body;

    if (!company_id) {
      return res.json({
        success: false,
        message: "company_id required"
      });
    }
    if (!emailRegex.test(supportEmail)) {
      return res.status(400).json({
        success: false,
        message: "valid support email required"
      })
    }

    const botConfigText = buildBotConfigText({
      companyName,
      description,
      faq,
      supportEmail,
      language,
      importantKnowledge
    });

    const { data, error } = await supabase
      .from("knowledge")
      .insert({
        content: botConfigText,
        company_id: company_id
      })
      .select()
      .single();


    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }
    const script = generateEmbedScript(company_id);
    console.log(script);
    const { data: sc } = await supabase.from("users").insert({
      script: script
    }).eq("company_id", company_id);

    res.json({
      success: true,
      message: "Bot config saved",
      botConfig: botConfigText,
      script: script
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
})

// ---- token usage ---- //
app.get("/token-usage/:company_id", async (req, res) => {

  const { company_id } = req.params;

  const { data } = await supabase
    .from("chats")
    .select("total_tokens")
    .eq("company_id", company_id)
    .not("total_tokens", "is", null);

  const total = data.reduce((sum, item) => sum + (item.total_tokens || 0), 0);

  res.json({ total_tokens: total });

});

app.get("/admin/token-usage", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("chats")
      .select("company_id, prompt_tokens, completion_tokens, total_tokens");

    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }


    const usageMap = {};

    data.forEach((row) => {

      const id = row.company_id;

      if (!usageMap[id]) {
        usageMap[id] = {
          company_id: id,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        };
      }

      usageMap[id].prompt_tokens += row.prompt_tokens || 0;
      usageMap[id].completion_tokens += row.completion_tokens || 0;
      usageMap[id].total_tokens += row.total_tokens || 0;

    });

    const result = Object.values(usageMap);

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get("/admin/total-tokens", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("chats")
      .select("prompt_tokens, completion_tokens, total_tokens");

    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }

    let prompt = 0;
    let completion = 0;
    let total = 0;

    data.forEach(row => {
      prompt += row.prompt_tokens || 0;
      completion += row.completion_tokens || 0;
      total += row.total_tokens || 0;
    });

    res.json({
      success: true,
      data: {
        prompt_tokens: prompt,
        completion_tokens: completion,
        total_tokens: total
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get("/admin/company-ids", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("users")
      .select("company_id");

    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }


    const companyIds = [
      ...new Set(
        data
          .map(item => item.company_id)
          .filter(id => id !== null)
      )
    ];

    res.json({
      success: true,
      data: companyIds
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get("/admin/companyname", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }




    res.json({
      success: true,
      data: data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


app.post("/admin/toggle-active", async (req, res) => {
  try {

    const { company_id } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("isactive")
      .eq("company_id", company_id)
      .single();

    if(user.isactive === false){
      const {data:company} = await supabase.from("chats").delete().eq("company_id", company_id).eq("title", "System")
    }  

    const { data, error } = await supabase
      .from("users")
      .update({ isactive: !user.isactive })
      .eq("company_id", company_id)
      .select()
      .single();

    if (error) {
      return res.json({ success: false, message: error.message });
    }

    const { data: company } = await supabase
      .from("users")
      .select("*")

    res.json({
      success: true,
      message: `Company ${data.isactive ? "activated" : "deactivated"}`,
      data: company
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/* -------- plans apis -------- */
app.post("/admin/create-plan", async (req, res) => {
  try {

    const { name, price, duration_days, description } = req.body;

    if (!name || !duration_days) {
      return res.status(400).json({
        success: false,
        message: "Name and duration_days are required"
      });
    }

    const { data, error } = await supabase
      .from("plans")
      .insert([
        {
          name,
          price: price || 0,
          duration_days,
          description
        }
      ])
      .select()
      .single();

    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }

    const { data: plans } = await supabase.from("plans").select("*").order("created_at", { ascending: false });

    res.json({
      success: true,
      message: "Plan created successfully",
      data: plans
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get("/admin/plans", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.post("/admin/toggle-plan", async (req, res) => {
  try {

    const { plan_id } = req.body;

    const { data: plan } = await supabase
      .from("plans")
      .select("isactive")
      .eq("id", plan_id)
      .single();

    const { data, error } = await supabase
      .from("plans")
      .update({ isactive: !plan.isactive })
      .eq("id", plan_id)
      .select()
      .single();

    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }

    const { data: plans } = await supabase.from("plans").select("*").order("created_at", { ascending: false });

    res.json({
      success: true,
      message: `Plan ${data.isActive ? "enabled" : "disabled"}`,
      data: plans
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get('/getplan', async (req, res) => {
  try {
    const { data } = await supabase.from("plans").select("*").eq("isactive", true);
    res.status(201).json({
      success: true,
      data: data
    })
  }


  catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
})

/* ------- getscript --------- */

app.post('/getscript', async (req, res) => {
  try {
    const { id } = req.body;
    const { data, error } = await supabase.from("users").select("script").eq("company_id", id);
    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }
    else {
      return res.json({
        success: true,
        data: data
      })
    }
  }

  catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.post('/getusers', async (req, res) => {
  try {
    const { id } = req.body;
    const { data, error } = await supabase.from("users").select("*").eq("company_id", id);
    if (error) {
      return res.json({
        success: false,
        message: error.message
      });
    }
    else {
      return res.json({
        success: true,
        data: data
      })
    }
  }

  catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get('/getplans', async (req, res) => {
  try {
    const { data, error } = await supabase.from("plans").select("*").neq("name", "Free");
    if (error) {
      return res.json({
        success: false,
        message: error.message
      })
    }
    else {
      return res.json({
        success: true,
        data: data
      })
    }
  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
})

async function isChatbotActive(company_id) {
  const { data, error } = await supabase
    .from("users")
    .select("isactive, is_paid")
    .eq("company_id", company_id)
    .maybeSingle();

  if (error) {
    console.error("User fetch error:", error);
    return false;
  }

  // ❗ If no user found → treat as inactive
  if (!data) return false;

  return data.isactive;
}
/* ---------------- SOCKET ---------------- */

io.on("connection", async (socket) => {

  const { visitor_id, company_id, email } = socket.handshake.auth;

  if (!visitor_id || !company_id) return socket.disconnect();


  try {

    const session = await getOrCreateSession(visitor_id, company_id);
    const isActive = await isChatbotActive(company_id);

    if (!isActive) {
      await supabase.from("chats").insert({
        session_id: session.id,
        role: "ai",
        text: "This chatbot is temporarily closed",
        title: "System",
        company_id
      });
      socket.emit("bot_message", {
        message: "This chatbot is temporarily closed.",
        title: "System"
      });

      return socket.disconnect(); // 🔴 stop further execution
    }




    /* ---------- FIRST MESSAGE ---------- */

    if (session.step === "ASK_EMAIL") {

      const { data: existingGreeting } = await supabase
        .from("chats")
        .select("id")
        .eq("session_id", session.id)
        .eq("company_id", company_id)
        .eq("role", "ai")
        .eq("title", "Introduction")
        .maybeSingle();

      if (!existingGreeting) {

        await supabase.from("chats").insert({
          session_id: session.id,
          company_id,
          role: "ai",
          text: "Hello 👋 Can you tell me your email first?",
          title: "Introduction"
        });

        socket.emit("bot_message", {
          message: "Hello 👋 Can you tell me your email first?",
          title: "Introduction"
        });

      }
    }


    /* ---------------- USER MESSAGE ---------------- */

    socket.on("user_message", async ({ message, title }) => {

      try {

        socket.emit("bot_typing");

        const session = await getOrCreateSession(visitor_id, company_id);

        const isActive = await isChatbotActive(company_id);

        if (!isActive) {
         return
        }


        /* ---------- RESET INACTIVITY TIMER ---------- */

        if (inactivityTimers[session.id]) {
          clearTimeout(inactivityTimers[session.id]);
        }

        inactivityTimers[session.id] = setTimeout(async () => {

          const { data } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("id", session.id)
            .single();

          if (data) {
            await sendInactiveEmail(data, email);
            console.log("data sent");
          }

          delete inactivityTimers[session.id];

        }, 2 * 60 * 1000);

        /* ---------- ASK EMAIL ---------- */

        if (session.step === "ASK_EMAIL") {

          if (!isValidEmail(message)) {
            return socket.emit("bot_message", {
              message: "Please enter a valid email.",
              title: "Introduction"
            });
          }

          await supabase.from("chat_sessions")
            .update({ email: message, step: "ASK_NAME" })
            .eq("id", session.id);

          await supabase.from("chats").insert([
            { session_id: session.id, company_id, role: "user", text: message, title: "Introduction" },
            { session_id: session.id, company_id, role: "ai", text: "Thanks! Can you tell me your name?", title: "Introduction" }
          ]);

          return socket.emit("bot_message", {
            message: "Thanks! Can you tell me your name?",
            title: "Introduction"
          });

        }

        /* ---------- ASK NAME ---------- */

        if (session.step === "ASK_NAME") {

          await supabase.from("chat_sessions")
            .update({ user_name: message, step: "ASK_PHONE" })
            .eq("id", session.id);

          await supabase.from("chats").insert([
            { session_id: session.id, company_id, role: "user", text: message, title: "Introduction" },
            { session_id: session.id, company_id, role: "ai", text: "Thanks! May I have your phone number?", title: "Introduction" }
          ]);

          return socket.emit("bot_message", {
            message: "Thanks! May I have your phone number?",
            title: "Introduction"
          });

        }

        /* ---------- ASK PHONE ---------- */

        if (session.step === "ASK_PHONE") {

          if (!isValidPhone(message)) {
            return socket.emit("bot_message", {
              message: "Please enter a valid 10-digit phone number.",
              title: "Introduction"
            });
          }

          await supabase.from("chat_sessions")
            .update({ phone: message, step: "CHAT" })
            .eq("id", session.id);

          await supabase.from("chats").insert([
            { session_id: session.id, company_id, role: "user", text: message, title: "Introduction" },
            { session_id: session.id, company_id, role: "ai", text: "Thank you! How can I help you today?", title: "Introduction" }
          ]);

          return socket.emit("bot_message", {
            message: "Thank you! How can I help you today?",
            title: "Introduction"
          });

        }

        /* ---------- NORMAL CHAT ---------- */

        const chatTitle = title || message.slice(0, 40);

        await supabase.from("chats").insert({
          session_id: session.id,
          role: "user",
          text: message,
          title: chatTitle,
          company_id
        });

        const knowledge = await getCompanyKnowledge(company_id);

        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: buildSystemPrompt(knowledge, company_id) },
            { role: "user", content: message }
          ],
          temperature: 0.2
        });

        const aiReply = completion.choices[0].message.content;

        const usage = completion.usage || {};

        await supabase.from("chats").insert({
          session_id: session.id,
          role: "ai",
          text: aiReply,
          title: chatTitle,
          company_id,
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0
        });

        socket.emit("bot_message", {
          message: aiReply,
          title: chatTitle
        });

      } catch (err) {

        console.error("Socket message error:", err);

      }

    });

  } catch (err) {

    console.error("Socket connection error:", err);

  }

});

server.listen(port, () => {
  console.log(`Server running on ${port}`);
});