import { Router } from "express";
import { ulogin, usignup, auth, checkTrial } from "../controller/reg.js";

const regrouter = Router();

regrouter.post("/signup", usignup);
regrouter.post("/login", ulogin);
regrouter.post(
  "/chat",
  auth,
  checkTrial,
  async (req, res) => {

    res.json({
      message: "Chatbot response",
      trialDaysLeft: req.trialDaysLeft
    });

  }
);

export default regrouter;