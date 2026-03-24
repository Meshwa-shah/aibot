import React from 'react'
import { useEffect, useState } from 'react'
import { Users, User, Bot, X } from "lucide-react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { type NavigateFunction } from 'react-router-dom';
import Cookies from "js-cookie";
import Markdown from 'react-markdown';

const Title = () => {
    const [data, setdata] = useState<Array<any>>([]);
    const [loading, setloading] = useState<boolean>(true);
    const nav: NavigateFunction = useNavigate();
    const [popup, setpopup] = useState<boolean>(false);
    const [name, setname] = useState<string>("");
    const [chats, setchats] = useState<Array<any>>([]);
    const [date, setdate] = useState<string>("");
    const [title, settitle] = useState<string>("");

    useEffect(() => {
        const id = Cookies.get("id");
        if (id === undefined) {
            nav("/dashboard");
        }
    }, []);


    useEffect(() => {
        async function fetchtitle() {
            const id = Cookies.get("id");
            const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/get-title`, {
                id: id
            });
            if (res.data.success === true) {
                setdata([...res.data.data])
                setdate(res.data.data2[0]);
                setloading(false);
            }
            else {
                setloading(false)
            }
        }
        fetchtitle();
    }, []);



    async function fetch() {
        const id = Cookies.get("id");
        console.log(title);
        const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/get-chat`, {
            id: id,
            title: title
        });
        if (res.data.success === true) {
            setchats([...res.data.chat]);
            setname(res.data.name[0].user_name);
            setloading(false)
        }
        else {
            setloading(false);
            alert(res.data.message);
        }
    }


    function set2(){
       setpopup(true);
       fetch();
    }

    return (
        
        <div className='min-h-screen bg-linear-to-br from-[#0b1020] via-[#0f1a2f] to-black p-6'>
            <div className="flex items-center gap-3 mb-6">
                <Users className="text-indigo-400" size={28} />
                <h1 className="text-2xl font-bold text-white">
                    Chat titles
                </h1>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-gray-700 rounded-xl p-6">
                {loading && (
                    <p className="text-slate-400">Loading titles...</p>
                )}
                {!loading && (
                    <div className='overflow-x-auto'>
                        <div className="w-full text-sm text-left text-slate-300">
                            {data.map((el, i) => {
                                return <div key={i} className='border-b border-gray-800 hover:bg-white/5 transition p-2 flex gap-10'
                                    onClick={() => set2()}
                                    onMouseEnter={() => settitle(el)}
                                >
                                    <p>{i + 1}</p>
                                    <p>{el}</p>
                                    <p>{new Date(date).toLocaleString()}</p>
                                </div>
                            })}
                        </div>
                    </div>
                )}
            </div>
        {popup === true && 
            <div className='w-full top-15  max-w-3xl h-[80vh] bg-white/5 backdrop-blur-xl rounded-xl flex flex-col border border-gray-70 absolute'>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                    <div className='absolute right-5' 
                    onClick={() => setpopup(false)}
                    ><X color='white'/></div>
                    { chats.map((el, i) => {
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
            </div>}
        </div>
    )
}

export default Title