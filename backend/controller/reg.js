import { supabase } from "../supabase.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import * as cheerio from "cheerio";
import { transporter } from "../index.js";
import axios from 'axios';



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
  return `<script src="https://yourdomain.com/chatbot.js" data-company-id="${companyId}"></script>`;
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

    const { email, password, companyName, type, duration, phone } = req.body;

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
        phone: `+91${phone}`
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
      { id: data.id },
      "your_secret_key",
      { expiresIn: "7d" }
    );

    
    res.json({
      message: "Login successful",
      data:data,
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
    const { id } = req.body; 
    const { data, error } = await supabase.from("users").select("*").eq("id", id);
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
    const { name, email, phone, id } = req.body;
    const { data:profile, error } = await supabase.from("users").update({
      companyname:name,
      email,
      phone: `+91${phone}`
    }).eq("id", id).select();

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
    const { email, oldpass, changedpass, confirmedpass } = req.body;

    // 🔹 1. Validate input
    if (!email || !oldpass || !changedpass || !confirmedpass) {
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
      .eq("email", email)
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
      .eq("email", email);

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
      .select("*")
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


    res.json({
      message: "Login successful",
      data: data,
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
    const { data, error } = await supabase.from("admin").select("*")
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
    const { name, email, phone, id } = req.body;
    const { data:profile, error } = await supabase.from("admin").update({
      name,
      email,
      phone: `+91${phone}`
    }).eq("id", id).select();

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
    const { email, oldpass, changedpass, confirmedpass } = req.body;

    // 🔹 1. Validate input
    if (!email || !oldpass || !changedpass || !confirmedpass) {
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
      .eq("email", email)
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
      .eq("email", email);

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
    req.user = decoded;

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
