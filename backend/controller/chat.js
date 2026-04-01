import { supabase } from "../supabase.js";


export const sendchats = async (req, res) => {
  try {
    const { visitor_id, title, company_id } = req.body;

    if (!visitor_id || !title || !company_id) {
      return res.status(400).json({
        success: false,
        message: "visitor_id, title and company_id are required"
      });
    }

    /* 1️⃣ Get session safely (NO .single()) */
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("visitor_id", visitor_id)
      .eq("company_id", company_id)
      .maybeSingle();

    if (sessionError || !session) {
      return res.status(200).json({
        success: true,
        data: [] // ✅ frontend safe
      });
    }

    /* 2️⃣ Fetch chats using session_id + title */
    const { data: chats, error: chatError } = await supabase
      .from("chats")
      .select("id, role, text, title, created_at")
      .eq("session_id", session.id)
      .eq("title", title)
      .order("created_at", { ascending: true });

    if (chatError) {
      console.error(chatError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch chats"
      });
    }

    return res.status(200).json({
      success: true,
      data: chats || []
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const addOrCreateKnowledge = async (req, res) => {
  try {
    const { company_id, content } = req.body;

    if (!company_id || !content) {
      return res.status(400).json({
        success: false,
        message: "company_id and content are required"
      });
    }

    // 1️⃣ Check if knowledge exists
    const { data: existing, error: fetchError } = await supabase
      .from("knowledge")
      .select("*")
      .eq("company_id", company_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // 2️⃣ If exists → update
    if (existing) {
      const { data, error } = await supabase
        .from("knowledge")
        .update({
          content
        })
        .eq("company_id", company_id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Knowledge updated",
        data
      });
    }

    // 3️⃣ If not exists → create
    const { data, error } = await supabase
      .from("knowledge")
      .insert({
        company_id,
        content
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: "Knowledge created",
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getTotalChats = async (req, res) => {
  try {

    const { count, error } = await supabase
      .from("chats")
      .select("*", { count: "exact", head: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      total_chats: count
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getCurrentMonthChats = async (req, res) => {
  try {

    const now = new Date();

    // start of month (e.g. 1st March 2026)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // start of next month
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { count, error } = await supabase
      .from("chats")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString())
      .lt("created_at", startOfNextMonth.toISOString());

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.json({
      success: true,
      month: now.toLocaleString("default", {
        month: "long",
        year: "numeric"
      }),
      total_chats: count
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getchats = async (req, res) => {
   try {
    const id = req.user;
    const company_id = id;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: "company_id is required"
      });
    }

    // 🔹 1. Get company info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("companyname, phone, created_at")
      .eq("company_id", company_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 🔹 2. Get all chats with title
    const { data: chats, error: chatError } = await supabase
      .from("chats")
      .select("id, title, role, text, created_at, company_id")
      .eq("company_id", company_id)
      .not("title", "is", null)
      .order("created_at", { ascending: true }); // 🔥 important

    if (chatError) {
      return res.status(400).json({
        success: false,
        message: chatError.message
      });
    }

    // 🔥 3. Group by title
    const titleMap = {};

    chats.forEach((chat) => {
      if (!titleMap[chat.title]) {
        titleMap[chat.title] = {
          id: chat.company_id, // first occurrence id
          title: chat.title,
          date: chat.created_at,
          phone: user.phone,
          registered_at: user.created_at,
          chats: []
        };
      }

      titleMap[chat.title].chats.push({
        role: chat.role,
        text: chat.text,
        created_at: chat.created_at,
        id: chat.id
      });
    });

    // 🔹 Convert to array
    const result = Object.values(titleMap);

    // 🔹 Optional: latest titles first
    result.sort(
      (a, b) => new Date(b.first_date) - new Date(a.first_date)
    );

    res.json({
      success: true,
      res: result,
      message: "your fetched data"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}