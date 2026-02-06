import { supabase } from "../supabase.js";

export const sendchats = async (req, res) => {
  try {
    const { visitor_id, title } = req.body;

    if (!visitor_id || !title) {
      return res.status(400).json({
        success: false,
        message: "visitor_id and title are required"
      });
    }

    // 1️⃣ Get session using visitor_id
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("visitor_id", visitor_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found"
      });
    }

    // 2️⃣ Fetch chats using session_id + title
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("session_id", session.id)
      .eq("title", title)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong"
      });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No chats found"
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
