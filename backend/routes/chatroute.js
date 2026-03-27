import { Router } from "express";
import { sendchats, getTotalChats, getCurrentMonthChats } from "../controller/chat.js";

const chatroute = Router();

chatroute.post('/chats', sendchats);
chatroute.get('/gettotalchats', getTotalChats);
chatroute.get('/getmonthlychats', getCurrentMonthChats);


export default chatroute;