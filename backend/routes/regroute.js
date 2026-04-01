import { Router } from "express";
import { ulogin, usignup, auth, checkTrial, Slogin, Slogout, editprofile, getprofile, changepassword,
 edituprofile, getuprofile, changeupassword, ulogout, getUsers, getuserstats, forgotPassword
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
regrouter.post('/updateprofile', auth, editprofile);
regrouter.post('/changepassword',auth ,changepassword);
regrouter.post('/getuserprofile', auth ,getuprofile)
regrouter.post('/updateuserprofile', auth , edituprofile);
regrouter.post('/changeuserpassword', auth, changeupassword);
regrouter.post('/userLogout',  ulogout);
regrouter.post('/gettotalcustomers', getUsers);
regrouter.post('/getusertokens',auth, getuserstats);
regrouter.post('/forgotpassword', forgotPassword);


export default regrouter;