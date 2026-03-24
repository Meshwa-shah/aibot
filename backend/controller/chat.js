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