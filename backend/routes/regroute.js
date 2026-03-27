import { Router } from "express";
import { ulogin, usignup, auth, checkTrial, Slogin, Slogout, editprofile, getprofile, changepassword,
 edituprofile, getuprofile, changeupassword, ulogout
 } from "../controller/reg.js";

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
regrouter.post('/superlogin', Slogin);
regrouter.post('/superlogout', Slogout);
regrouter.post('/getprofile', getprofile)
regrouter.post('/editprofile', editprofile);
regrouter.post('/changepassword', changepassword);
regrouter.post('/getuserprofile', getuprofile)
regrouter.post('/edituserprofile', edituprofile);
regrouter.post('/changeuserpassword', changeupassword);
regrouter.post('/userLogout', changeupassword);

export default regrouter;