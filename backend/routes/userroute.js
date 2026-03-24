import { Router } from "express";
import { signup, login, verify, logout,fetchusers } from "../controller/user.js";


const userroute = Router();

userroute.post('/signup', signup);
userroute.post('/login', login);
userroute.post('/logout', logout);
userroute.get('/verify', verify);
userroute.post('/fetchdata', fetchusers);

export default userroute;