import { supabase } from "../supabase.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import * as cheerio from "cheerio";
import { transporter } from "../index.js";
import axios from 'axios';
import crypto from 'crypto';
import nodemailer from 'nodemailer';




function generateCompanyId(companyName) {

  const slug = companyName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  const random = Math.random()
    .toString(36)
    .substring(2, 6);

  return `${slug}-${random}`;
}

export const generateEmbedScript = (companyId) => {
  return `<script src="${process.env.BACK_URL}/widget.js" data-company-id="${companyId}"></script>`;
};

export async function scrapeAndSave(url, company_id) {

  try {

    const { data: html } = await axios.get(url);

    const $ = cheerio.load(html);

    $("script, style, noscript").remove();

    const text = $("body").text();

    const cleanText = text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000); // limit size

    await supabase.from("knowledge").insert({
      company_id,
      content: cleanText
    });

    return { success: true };

  } catch (err) {

    return { message: err.message };
  }

}

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


export const usignup = async (req, res) => {
  try {

    const { email, password, companyName, type, duration, phone, url } = req.body;

    if (!email || !password || !companyName) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: " Valid Email required"
      })
    }
   

    const hashedPassword = await bcrypt.hash(password, 10);
    const companyId = generateCompanyId(companyName);
    const result = scrapeAndSave(url, companyName);
    const days = duration.match(/\d+/)
      ? parseInt(duration.match(/\d+/)[0])
      : 0;

    const start = new Date();
    const end = new Date();

    end.setDate(start.getDate() + days);

    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password: hashedPassword,
        company_id: companyId,
        companyname: companyName,
        is_paid: type === "Free" ? "FALSE" : "TRUE",
        trial_end: end,
        phone: phone,
        url: url
      })
      .select()
      .single();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      to: email,

      subject: "Your credentials",

      text: `Your email is : ${email}, your password is: ${password} and your company id is: ${companyId}`
    })

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    const token = jwt.sign(
      { id: data.id },
      "your_secret_key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Signup successful",
      company_id: companyId,
      name: companyName,
      email: email
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ======================
// LOGIN
// ======================

export const ulogin = async (req, res) => {

  try {

    const { email, password } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!data) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      data.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: data.company_id },
      "your_secret_key",
      { expiresIn: "7d" }
    );
    const {data:user} = await supabase.from("users").select("email, companyname, company_id, phone").eq("email", email);
     res.json({
      message: "Login successful",
      data:user[0],
      token:token,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};

// ---- user admin profile settings -----//

export const ulogout = async (req, res) => {
 try {
    return res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getuprofile = async (req, res) => {
  try{
    const  id = req.user; 
    const { data, error } = await supabase.from("users").select("email, companyname, phone").eq("company_id", id);
    if(error){
       return res.json({
        success: false,
        message: error.message
      });
    }
    else{
      return res.json({
        success: true,
        message: "Your profile fetched",
        data:data[0]
      })
    }
  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

export const edituprofile = async (req, res) => {
  try{
    const { name, email, phone } = req.body;
    const id = req.user;
    const { data:profile, error } = await supabase.from("users").update({
      companyname:name,
      email,
      phone: phone
    }).eq("company_id", id).select("email,  companyname,  phone");

    if(error){
       return res.json({
        success: false,
        message: error.message
      });
    }
    else{
      return res.json({
        success: true,
        message: "profile updated",
        data:profile[0]
      })
    }
  }

  catch(err){
     res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

export const changeupassword = async (req, res) => {
  try {
    const { oldpass, changedpass, confirmedpass } = req.body;
    const id = req.user;
    // 🔹 1. Validate input
    if (!id || !oldpass || !changedpass || !confirmedpass) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (changedpass !== confirmedpass) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match"
      });
    }

    // 🔹 2. Get user from DB
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("company_id", id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 🔹 3. Compare old password
    const isMatch = await bcrypt.compare(oldpass, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // 🔹 4. Hash new password
    const hashedPassword = await bcrypt.hash(changedpass, 10);

    // 🔹 5. Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("company_id", id);

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: updateError.message
      });
    }

    return res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("email, companyname, company_id, isactive, phone, url")
      .order("created_at", { ascending: false }); // 🔥 newest first

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.json({
      success: true,
      data: data,
      message: "your users"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};





// -------------------------------------//

export const Slogin = async (req, res) => {
  try{
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from("admin")
      .select("*")
      .eq("email", email)
      .single();

    const validPassword = await bcrypt.compare(
      password,
      data.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }
    const token = jwt.sign(
      { id: data.id },
      "your_secret_key",
      { expiresIn: "7d" }
    );

    const { data: user } = await supabase.from("admin").select("id, email, name, phone").eq("email", email);

    res.json({
      message: "Login successful",
      data: user[0],
      token:token
    });

  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const Slogout = async (req, res) => {
   try {
    return res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getprofile = async (req, res) => {
  try{
    const id = req.user
    const { data, error } = await supabase.from("admin").select("id, name, email, phone").eq("id", id);
    if(error){
       return res.json({
        success: false,
        message: error.message
      });
    }
    else{
      return res.json({
        success: true,
        data:data[0],
        message: "profile fetched"
      })
    }
  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

export const editprofile = async (req, res) => {
  try{
    const { name, email, phone } = req.body;
    const id = req.user;
    const { data:profile, error } = await supabase.from("admin").update({
      name,
      email,
      phone: phone
    }).eq("id", id).select("id, name, email, phone");

    if(error){
       return res.json({
        success: false,
        message: error.message
      });
    }
    else{
      return res.json({
        success: true,
        message: "profile updated",
        data:profile[0]
      })
    }
  }

  catch(err){
     res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

export const changepassword = async (req, res) => {
  try {
    const { oldpass, changedpass, confirmedpass } = req.body;
    const id = req.user;
    // 🔹 1. Validate input
    if (!id || !oldpass || !changedpass || !confirmedpass) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (changedpass !== confirmedpass) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match"
      });
    }

    // 🔹 2. Get user from DB
    const { data: user, error } = await supabase
      .from("admin")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 🔹 3. Compare old password
    const isMatch = await bcrypt.compare(oldpass, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // 🔹 4. Hash new password
    const hashedPassword = await bcrypt.hash(changedpass, 10);

    // 🔹 5. Update password
    const { error: updateError } = await supabase
      .from("admin")
      .update({ password: hashedPassword })
      .eq("id", id);

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: updateError.message
      });
    }

    return res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ======================
// AUTH MIDDLEWARE
// ======================

export const auth = (req, res, next) => {

   try {
    const authHeader = req.headers.authorization;

    // Check if header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    // Extract token (Bearer TOKEN)
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, "your_secret_key");

    // Attach user data to request
    req.user = decoded.id;

    next(); // go to next function (your controller)
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};


// ======================
// TRIAL CHECK MIDDLEWARE
// ======================

export const checkTrial = async (req, res, next) => {

  try {

    const userId = req.user.id;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    const now = new Date();

    const trialExpired =
      new Date(data.trial_end) < now;

    if (!data.is_paid && trialExpired) {

      return res.status(403).json({
        message: "Free trial expired. Please subscribe."
      });

    }

    const daysLeft = Math.ceil(
      (new Date(data.trial_end) - now) /
      (1000 * 60 * 60 * 24)
    );

    req.trialDaysLeft = daysLeft;

    next();

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

export const getuserstats = async(req, res) => {
  try {
    const id = req.user
    const company_id = id


    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 🔹 Fetch chats for this user only
    const { data, error } = await supabase
      .from("chats")
      .select("total_tokens, created_at")
      .eq("company_id", company_id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    let totalChats = 0;
    let monthlyChats = 0;
    let totalTokens = 0;
    let monthlyTokens = 0;

    // 🔥 Single loop
    data.forEach((row) => {
      const tokens = row.total_tokens || 0;
      const createdAt = new Date(row.created_at);

      totalChats += 1;
      totalTokens += tokens;

      if (createdAt >= startOfMonth && createdAt < startOfNextMonth) {
        monthlyChats += 1;
        monthlyTokens += tokens;
      }
    });

    res.json({
      success: true,
      data: {
        total_chats: totalChats,
        monthly_chats: monthlyChats,
        total_tokens: totalTokens,
        monthly_tokens: monthlyTokens,
      },
      message: "users token fetched successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 🔹 Check user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 🔥 Generate random 8-char password
    const tempPassword = Math.random().toString(36).slice(-8);

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 🔹 Update password in DB
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword }).eq("email", email);

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: updateError.message
      });
    }

    // 🔹 Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Temporary Password",
      html: `
        <h3>Password Reset</h3>
        <p>Your new temporary password is:</p>
        <h2>${tempPassword}</h2>
        <p>Please login and change your password immediately.</p>
      `
    });

    res.json({
      success: true,
      message: "password sent to email"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};