import { Router } from "express";
import { ulogin, usignup, auth, checkTrial, Slogin, Slogout, editprofile, getprofile, changepassword,
 edituprofile, getuprofile, changeupassword, ulogout, getUsers, getuserstats
 } from "../controller/reg.js";

const regrouter = Router();

regrouter.post("/signup", usignup);
regrouter.post("/login" , ulogin);
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
regrouter.post('/superlogin' ,Slogin);
regrouter.post('/superlogout' ,Slogout);
regrouter.post('/getprofile', auth ,getprofile)
regrouter.post('/editprofile', auth, editprofile);
regrouter.post('/changepassword',auth ,changepassword);
regrouter.post('/getuserprofile', auth ,getuprofile)
regrouter.post('/edituserprofile', auth , edituprofile);
regrouter.post('/changeuserpassword', auth, changeupassword);
regrouter.post('/userLogout',  ulogout);
regrouter.post('/gettotalusers', getUsers);
regrouter.get('/getuserstats',auth, getuserstats);

export default regrouter;