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

    const { email, password, companyName, type, duration } = req.body;

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
        trial_end: end
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
      token,
      company_id: companyId,
      name: companyName
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
      token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};


// ======================
// AUTH MIDDLEWARE
// ======================

export const auth = (req, res, next) => {

  try {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {
    res.status(401).json({
      message: "Invalid token"
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
