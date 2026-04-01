import { Router } from "express";
import { sendchats, getTotalChats, getCurrentMonthChats, getchats } from "../controller/chat.js";
import { auth } from "../controller/reg.js";

const chatroute = Router();

chatroute.post('/chats', sendchats);
chatroute.get('/gettotalchats', getTotalChats);
chatroute.get('/getmonthlychats', getCurrentMonthChats);
chatroute.post('/getchatdata', auth , getchats);


export default chatroute;