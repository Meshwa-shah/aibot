import React from 'react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import { type NavigateFunction } from 'react-router-dom';


const Registration = () => {
    const [isSignup, setIsSignup] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setname] = useState("");
    const nav: NavigateFunction = useNavigate();
    const [disabled, setdisabled] = useState(false);
    const [loading, setloading] = useState(false);
    const [plans, setplans] = useState<Array<any>>([]);
    const [selectedPlan, setSelectedPlan] = useState("");
    console.log(selectedPlan);


    useEffect(() => {
        async function fetch() {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACK_URL}/getplan`);
                if (res.data.success === true) {
                    setplans([...res.data.data])
                }
            }
            catch (err) {
                alert("something went wrong")
            }
        }
        fetch();
    }, [])


    const handleSubmit = async () => {

        try {
            setdisabled(true);
            setloading(true);
            const url = isSignup ? "reg/signup" : "reg/login";

            const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/${url}`, {
                email: email,
                password: password,
                companyName: name,
                type: selectedPlan
            });

            localStorage.setItem("token", res.data.token);

            if (isSignup) {
                alert("Signup successful! Your 7-day free trial has started.");
                localStorage.setItem("id", res.data.company_id)
                localStorage.setItem("name", res.data.name)
                nav("/setup");

            } else {
                alert("Login successful!");
            }

        } catch (err) {

            alert(err.response?.data?.message || "Something went wrong");

        }
        finally {
            setloading(false);
            setdisabled(false);
        }

    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-slate-900">

            <div className="bg-slate-800 p-8 rounded-xl w-96 shadow-lg">

                {/* Title */}

                <h1 className="text-2xl text-white font-bold mb-2">

                    {isSignup ? "Create Account" : "Welcome Back"}

                </h1>

                {/* Free Trial Message */}

                {isSignup && (
                    <p className="text-sm text-gray-400 mb-6">
                        Start your <span className="text-purple-400 font-semibold">7-day free trial</span>
                    </p>
                )}
                {isSignup === true ? <>
                    <input
                        type="name"
                        placeholder="company name"
                        className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
                        onChange={(e) => setname(e.target.value)}
                    /></> : <></>}

                {/* Email */}

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
                    onChange={(e) => setEmail(e.target.value)}
                />

                {/* Password */}

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* Button */}
                {isSignup && (
                    <div className="mb-4">

                        <p className="text-gray-300 text-sm mb-2">Select Plan</p>

                        {plans
                            .filter(p => p.isactive) // only active plans
                            .map((plan, i) => (
                                <label
                                    key={i}
                                    className="flex items-center justify-between bg-slate-700 p-3 rounded mb-2 cursor-pointer"
                                >

                                    {/* Left */}
                                    <div>
                                        <p className="text-white text-sm font-medium">
                                            {plan.name}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            ₹{plan.price} • {plan.duration_days} days
                                        </p>
                                    </div>

                                    {/* Radio */}
                                    <input
                                        type="radio"
                                        name="plan"
                                        value={plan.id}
                                        checked={selectedPlan === plan.name}
                                        onChange={() => setSelectedPlan(plan.name)}
                                    />

                                </label>
                            ))}

                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded mb-4"
                    disabled={disabled}
                >
                    {loading === true ? "Wait..." : isSignup ? "Register" : "Login"}
                </button>

                {/* Toggle */}

                <p className="text-gray-400 text-sm text-center">

                    {isSignup
                        ? "Already have an account?"
                        : "Don't have an account?"}

                    <span
                        className="text-purple-400 ml-2 cursor-pointer"
                        onClick={() => setIsSignup(!isSignup)}
                    >
                        {isSignup ? "Login" : "Signup"}
                    </span>

                </p>

            </div>

        </div>

    );
}

export default Registration