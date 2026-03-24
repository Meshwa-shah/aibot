import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import { type NavigateFunction } from 'react-router-dom';

const Login: React.FC = () => {
  const [name, setname] = useState<string | null>(null);
  const [email, setemail] = useState<string | null>(null);
  const [password, setpassword] = useState<string | null>(null);
  const [loading, setloading] = useState<boolean>(false);
  const nav: NavigateFunction = useNavigate();

  async function login(){
    if (!email || !password){
      toast.error("please fill it correctly");
      return
    }
    try {
      setloading(true);
      const add = await axios.post(`${import.meta.env.VITE_BACK_URL}/user/login`,
        { email: email, password: password }, { withCredentials: true }
      );
      if (add.data.success === true) {
        toast.success(add.data.message);
        nav('/dashboard');
        localStorage.setItem("id", add.data.data.company_id);
      }
      else {
        toast.error(add.data.message);
      }
    }
    catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("login failed");
      }
    }
    finally {
      setloading(false);
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0b1020] via-[#0f1a2f] to-black">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            🔐 Login
          </h2>
          <p className="text-sm text-white/60 mt-1">
            Welcome back! Please enter your details
          </p>
        </div>

        {/* Form */}
        <form className="px-6 py-6 space-y-4">
    
         
          {/* Email */}
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={(e) => setemail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={(e) => setpassword(e.target.value)}
            />
          </div>

          {/* Button */}
          <button
            type="button"
            className="w-full mt-4 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 py-2.5 text-white font-medium hover:opacity-90 transition"
            onClick={login}
          >
            {loading ? 'Wait...' : 'Continue'}
          </button>
        </form>

        {/* Footer */}
        
      </div>
    </div>
  );
};

export default Login;
