import { useEffect, useState } from "react";
import axios from "axios";
import { Users } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { type NavigateFunction } from 'react-router-dom';
import Cookies from "js-cookie";


type User = {
  id: number;
  user_name: string | null;
  phone: string | null;
  created_at: string;
};

export default function New() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nav: NavigateFunction = useNavigate();
  const [activeTab, setActiveTab] = useState("Users");
  const [script, setscript] = useState<null | string>(null);
  const [planData, setPlanData] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setplans] = useState<Array<any>>([])

  useEffect(() => {
    async function check() {
      const checktoken = await axios.get(`${import.meta.env.VITE_BACK_URL}/user/verify`, { withCredentials: true });
      if (checktoken.data.success === false) {
        nav('/login')
      }
    }
    check();
  }, []);

  useEffect(() => {
    async function fetchuser() {
      const id = localStorage.getItem("id");
      try {
        const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/getusers`, {
          id: id
        });
        if (res.data.success === true) {
          setPlanData(res.data.data)
        }
      }
      catch (err: unknown) {
        alert(err.message as string)
      }
    }

    fetchuser();
  }, [])

  useEffect(() => {
    async function fetchplan() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACK_URL}/getplans`);
        if (res.data.success === true) {
          setplans([...res.data.data])
        }
      }
      catch (err: unknown) {
        alert(err.message as string)
      }
    }

    fetchplan();
  }, [])

  useEffect(() => {
    async function fetch() {
      const id = localStorage.getItem("id");
      try {
        const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/getscript`, {
          id: id
        });
        if (res.data.success === true) {
          setscript(res.data.data[0].script);
        }
      }
      catch (err: unknown) {
        alert(err.message as string)
      }
    }
    fetch();
  }, [])

  useEffect(() => {
    async function fetchUsers() {
      const company_id = localStorage.getItem("id");
      console.log(company_id);
      try {
        const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/user/fetchdata`, {
          company_id: company_id
        });

        if (res.data.success) {
          setUsers(res.data.data);
        } else {
          setError("Failed to load users");
        }
      } catch (err) {
        console.error(err);
        setError("Server error");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  function navigate(id: string) {
    Cookies.set("id", id);
    nav(`/title`)
  }

  const getStatus = (end) => {
    return new Date() <= new Date(end) ? "active" : "expired";
  };

  const getPlanName = (is_paid) => {
    return is_paid ? "Paid Plan" : "Free Trial";
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-[#0b1020] via-[#0f1a2f] to-black">

      {/* Sidebar */}
      <div className="w-64  backdrop-blur-xl border-r border-gray-800 p-5">

        <h1 className="text-white text-lg font-bold mb-6">
          Dashboard
        </h1>

        <div className="space-y-3 text-sm">

          {/* <p className="text-slate-300 hover:text-indigo-400 cursor-pointer">
            Users
          </p>

          <p className="text-slate-300 hover:text-indigo-400 cursor-pointer">
            Status
          </p>

          <p className="text-slate-300 hover:text-indigo-400 cursor-pointer">
            Script
          </p> */}
          {["Users", "Status", "Script"].map(tab => (
            <p
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer text-slate-300 ${activeTab === tab
                ? "text-slate-400"
                : "hover:text-indigo-400"
                }`}
            >
              {tab}
            </p>
          ))}

        </div>

      </div>

      {/* Main Content */}
      {activeTab === "Users" && (
        <div className="flex-1 p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-indigo-400" size={28} />
            <h1 className="text-2xl font-bold text-white">
              User Dashboard
            </h1>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700 rounded-xl p-6">

            {loading && (
              <p className="text-slate-400">Loading users...</p>
            )}

            {error && (
              <p className="text-red-400">{error}</p>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">

                  <thead className="text-xs uppercase text-slate-400 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Registered At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user, index) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-800 hover:bg-white/5 transition cursor-pointer"
                        onClick={() => navigate(user.id)}
                      >
                        <td className="px-4 py-3">{index + 1}</td>

                        <td className="px-4 py-3">
                          {user.user_name ?? "—"}
                        </td>

                        <td className="px-4 py-3">
                          {user.phone ?? "—"}
                        </td>

                        <td className="px-4 py-3">
                          {new Date(user.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>

                {users.length === 0 && (
                  <p className="text-slate-400 text-center mt-4">
                    No users found
                  </p>
                )}
              </div>
            )}

          </div>

        </div>)}

      {activeTab === "Script" && (
        <div className="w-full flex flex-col justify-center items-center">
          <div className="border-2 border-purple-50 p-5 rounded-xl">
            <p className="text-purple-400 text-sm mb-6 text-center">
              Your Script
            </p>
            <textarea name="" id="" rows={9} className='w-72 p-3 mb-4 rounded bg-slate-700 text-white'>
              {script}
            </textarea>
          </div>
        </div>
      )}

      {activeTab === "Status" && planData && (
        <div className="flex items-start mt-5 ml-5">
          <div className="bg-white/5 backdrop-blur-xl border border-gray-700 rounded-xl p-6">

            <h2 className="text-xl text-white mb-4">
              Plan Status
            </h2>

            <div className="space-y-3">

              {/* Plan */}
              <p className="text-slate-300">
                <span className="text-slate-400">Plan:</span>{" "}
                {getPlanName(planData[0].is_paid)}
              </p>

              {/* Expiry */}
              <p className="text-slate-300">
                <span className="text-slate-400">Expires On:</span>{" "}
                {new Date(planData[0].trial_end).toLocaleDateString()}
              </p>

              {/* Status */}
              <p
                className={`text-sm font-medium ${getStatus(planData[0].trial_end) === "active"
                  ? "text-green-400"
                  : "text-red-400"
                  }`}
              >
                {getStatus(planData[0].trial_end).toUpperCase()}
              </p>

              {/* Days Left */}
              <p className="text-slate-400 text-sm">
                Days Left:{" "}
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(planData[0].trial_end) - new Date()) /
                    (1000 * 60 * 60 * 24)
                  )
                )}
              </p>

            </div>

            {/* Upgrade Button */}
            {!planData.is_paid && (
              <button
                className="mt-5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                onClick={() => setShowPlans(true)}
              >
                Upgrade Plan
              </button>
            )}

          </div>
          {showPlans && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">

              {/* Overlay */}
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowPlans(false)}
              ></div>

              {/* Popup */}
              <div className="relative bg-slate-900 w-full max-w-md p-6 rounded-xl border border-gray-700 shadow-xl">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white text-lg font-semibold">
                    Choose a Plan
                  </h2>

                  <button
                    onClick={() => setShowPlans(false)}
                    className="text-gray-400 hover:text-white text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Plans */}
                <div className="space-y-3 max-h-64 overflow-y-auto">

                  {plans
                    .filter(p => p.isactive)
                    .map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-lg cursor-pointer border transition ${selectedPlan?.id === plan.id
                            ? "border-purple-500 bg-slate-800"
                            : "border-gray-700 hover:border-gray-500"
                          }`}
                      >
                        <p className="text-white font-medium">
                          {plan.name}
                        </p>

                        <p className="text-gray-400 text-sm">
                          ₹{plan.price} • {plan.duration_days} days
                        </p>
                      </div>
                    ))}

                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-5">

                  <button
                    onClick={() => setShowPlans(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={!selectedPlan}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white disabled:opacity-50"
                  >
                    Continue
                  </button>

                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
