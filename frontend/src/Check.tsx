import React from 'react';
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { Users, User, Bot } from "lucide-react";
import axios from 'axios';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { type NavigateFunction } from 'react-router-dom';

const Check = () => {
    const [data, setdata] = useState<Array<any>>([]);
    const [loading, setloading] = useState<boolean>(true);
    const [name, setname] = useState<string>("");
    const nav: NavigateFunction = useNavigate();

    useEffect(() => {
        const id = Cookies.get("id");
        const title = Cookies.get("title");
        if(id === undefined || title === undefined){
            nav("/dashboard");
        }
    }, []);

    useEffect(() => {
        async function fetch() {
            const id = Cookies.get("id");
            const title = Cookies.get("title");
            const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/get-chat`, {
                id: id,
                title: title
            });
            if (res.data.success === true) {
                setdata([...res.data.chat]);
                setname(res.data.name[0].user_name);
                setloading(false)
            }
            else {
                setloading(false);
                alert(res.data.message);
            }
        }

        fetch();
    }, []);

    return (
        <div className='flex-1 flex flex-col justify-center items-center p-4 min-h-screen bg-linear-to-br from-[#0b1020] via-[#0f1a2f] to-black'>
            <div className="flex items-center gap-3 mb-6">
                <Users className="text-indigo-400" size={28} />
                <h1 className="text-xl font-bold text-white">
                    Chat history of {name}
                </h1>
            </div>
            <div className='w-full max-w-3xl h-[80vh] bg-white/5 backdrop-blur-xl rounded-xl flex flex-col border border-gray-70'>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                    {data.map((el, i) => {
                        return <div key={i} className={`flex ${el.role === "user" ? "justify-end" : "justify-start"
                            }`}>
                            <div
                                className={`max-w-[70%] px-4 py-3 rounded-xl text-sm ${el.role === "user"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-700 text-slate-200"
                                    }`}
                            >
                                <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                                    {el.role === "user" ? <User size={12} /> : <Bot size={12} />}
                                    {el.role === "user" ? name : "Bot"}
                                </div>
                                <Markdown>{el.text}</Markdown>
                            </div>
                        </div>
                    })}
                </div>
            </div>
        </div>
    )
}

export default Check