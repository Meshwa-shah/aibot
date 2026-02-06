import { Router } from "express";
import { sendchats } from "../controller/chat.js";

const chatroute = Router();

chatroute.post('/chats', sendchats);

export default chatroute;