import { supabase } from "../supabase.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const encrypt = await bcrypt.hash(password, 10);
        const { data, error } = await supabase.from('admin').insert([{ name: name, email: email, password: encrypt }]).select();
        if (error) {
            res.status(201).json({ success: false, message: error?.details });
        }
        else {
            const token = jwt.sign({ name, email }, process.env.JWT_KEY, { expiresIn: '1d' });
            res.cookie('token', token, { httpOnly: true, sameSite: 'None', secure: true });
            res.status(201).json({ success: true, message: "Hello user", data: data[0] });
        }
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const login = async (req, res) => {
    try {
        const {email, password } = req.body;
        const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1).single();
        if (error) {
            res.status(201).json({ success: false, message: "wrong email or name" });
        }
        else {
            const decrypt = await bcrypt.compare(password, data.password);
            if (decrypt) {
                const token = jwt.sign({ email }, process.env.JWT_KEY, { expiresIn: '1d' });
                res.cookie('token', token, { httpOnly: true, sameSite: 'Lax', secure: false, path: '/' });
                res.status(201).json({ success: true, message: "welcome back", data: data });
            }
            else {
                res.status(201).json({ success: false, message: "wrong password" });
            }
        }
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', { httpOnly: true, sameSite: 'Lax', secure: false, path: '/' });
        res.status(201).json({ success: true, message: "you are logged out" })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const verify = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(201).json({ message: "Please login first", success: false });
        }

        jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
            if (err) {
                return res.status(201).json({ message: "Please login first", success: false });
            }

            return res.status(201).json({ message: "Authenticated", success: true });
        });

    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const fetchusers = async (req, res) => {
    try{
        const { company_id } = req.body;
        const { data, error } = await supabase.from('chat_sessions').select('*').eq("company_id", company_id);
        if(error){
            return res.status(201).json({ success:false, message:"something went wrong" });
        }
        else{
            return res.status(201).json({ success:true, data:data });
        }
    }

    catch(err){
        res.status(500).json({ messagE:err.message });
    }
}