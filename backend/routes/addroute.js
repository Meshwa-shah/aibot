import { Router } from "express";
import { addOrCreateKnowledge } from "../controller/chat.js";

const addroute = Router();

addroute.post('/knowledge', addOrCreateKnowledge);

export default addroute;