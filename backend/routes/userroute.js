import { Router } from "express";
import { signup, login, verify, logout,fetchusers, auth1 } from "../controller/user.js";



const userroute = Router();

userroute.post('/signup', signup);
userroute.post('/login', login);
userroute.post('/logout', logout);
userroute.get('/verify', verify);
userroute.post('/fetchusers',auth1 ,fetchusers);

export default userroute;