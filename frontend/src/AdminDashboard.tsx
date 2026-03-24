import axios from "axios";
import { useState, useEffect } from "react";

export default function AdminDashboard() {

  const [activeTab, setActiveTab] = useState("dashboard");
  const [totalptokens, settotalptokens] = useState<number>(0);
  const [completiontokens, setcompletiontokens] = useState<number>(0);
  const [totaltokens, settotaltokens] = useState<number>(0);
  const [companies, setcompanies] = useState<Array<any>>([]);
  const [tokens, settokens] = useState<Array<any>>([]);
  const [names, setnames] = useState<Array<any>>([]);
  const [plans, setplans] = useState<Array<any>>([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    duration_days: "",
    description: ""
  });

  // const getStatus = (trial_start, trial_end) => {
  //   const now = new Date();

  //   const start = new Date(trial_start);
  //   const end = new Date(trial_end);

  //   return now >= start && now <= end ? "active" : "expired";
  // };

  const toggleActive = async (company_id) => {
    try {

      const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/admin/toggle-active`, {
        company_id
      });

      if (res.data.success === true) {

        // update UI instantly
        setnames([...res.data.data])
        alert(res.data.message);
      }

    } catch (err) {
      alert("Error updating status");
    }
  };

  useEffect(() => {
    async function fetchtotaltokens() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACK_URL}/admin/total-tokens`);
        if (res.data.success === true) {
          settotalptokens(res.data.data.prompt_tokens);
          setcompletiontokens(res.data.data.completion_tokens);
          settotaltokens(res.data.data.total_tokens);
        }
      }
      catch (err: any) {
        alert(err.message as string)
      }
    }

    async function fetchcompany() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACK_URL}/admin/company-ids`);
        if (res.data.success === true) {
          setcompanies([...res.data.data])
        }
      }
      catch (err: any) {
        alert(err.message as string)
      }
    }

    async function fetch() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACK_URL}/admin/token-usage`);
        if (res.data.success === true) {
          settokens([...res.data.data])
        }
      }
      catch (err: any) {
        alert(err.message as string)
      }
    }

    async function fetchname() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACK_URL}/admin/companyname`)
        if (res.data.success === true) {
          setnames([...res.data.data]);
        }
      }

      catch (err: any) {
        alert(err.message as string)
      }
    }

    const fetchPlans = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACK_URL}/admin/plans`);
        if (res.data.success) {
          setplans(res.data.data);
        }
      } catch (err) {
        alert("Error fetching plans");
      }
    };


    fetchtotaltokens();
    fetchcompany();
    fetch();
    fetchname();
    fetchPlans();
  }, [])

  const handleCreate = async () => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/admin/create-plan`, form);

    if (res.data.success) {
      alert("Plan created");

      setForm({
        name: "",
        price: "",
        duration_days: "",
        description: ""
      });
      setplans([...res.data.data])
     
    }

  } catch (err) {
    alert("Error creating plan");
  }
};

const togglePlan = async (id) => {
 
  try {
    const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/admin/toggle-plan`, {
      plan_id: id
    });

    if (res.data.success) {
      setplans([...res.data.data])
    }

  } catch (err) {
    alert("Error updating plan");
  }
};


  // 🔹 Bots



  // 🔹 Usage (per company)


  return (
    <div className="flex min-h-screen bg-slate-900 text-white">

      {/* Sidebar */}
      <div className="w-60 bg-slate-800 p-5">

        <h1 className="text-xl font-bold mb-6 text-purple-400">
          Admin Panel
        </h1>

        {["dashboard", "companies", "usage", "Status", "plans"].map(tab => (
          <p
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`cursor-pointer capitalize mb-2 px-2 py-1 rounded ${activeTab === tab
              ? "bg-slate-700 text-purple-400"
              : "hover:text-purple-400"
              }`}
          >
            {tab}
          </p>
        ))}

      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">

        {/* ================= DASHBOARD ================= */}
        {activeTab === "dashboard" && (
          <>
            <h1 className="text-2xl mb-6">Dashboard Overview</h1>

            {/* Token Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">

              <div className="bg-slate-800 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Prompt Tokens</p>
                <h2 className="text-xl font-bold">
                  {totalptokens}
                </h2>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Completion Tokens</p>
                <h2 className="text-xl font-bold">
                  {completiontokens}
                </h2>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Total Tokens</p>
                <h2 className="text-xl font-bold">
                  {totaltokens}
                </h2>
              </div>

            </div>

            {/* Companies Preview */}
            <div className="bg-slate-800 p-4 rounded mb-4">
              <h2 className="mb-2">Companies</h2>
              {companies.slice(0, 3).map((c, i) => (
                <p key={i}>{c}</p>
              ))}
            </div>

            {/* Bots Preview */}


          </>
        )}

        {/* ================= COMPANIES ================= */}
        {activeTab === "companies" && (
          <div className="bg-slate-800 p-5 rounded">
            <h2 className="mb-4 text-lg">All Companies</h2>

            {companies.map((c, i) => (
              <div
                key={i}
                className="border-b border-slate-700 py-3 flex justify-between items-center"
              >
                <div>
                  <p>{c}</p>
                </div>

                <span
                  className={`px-2 py-1 rounded text-xs ${c.status === "active"
                    ? "bg-green-600"
                    : c.status === "trial"
                      ? "bg-yellow-600"
                      : "bg-red-600"
                    }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}


        {/* ================= USAGE ================= */}
        {activeTab === "usage" && (
          <div className="bg-slate-800 p-5 rounded">
            <h2 className="mb-4 text-lg">Token Usage</h2>

            {tokens.map((u, i) => (
              <div
                key={i}
                className="border-b border-slate-700 py-3"
              >
                <p className="font-medium">{u.company_id}</p>

                <p className="text-sm text-gray-400">
                  Prompt: {u.prompt_tokens} | Completion: {u.completion_tokens} | Total: {u.total_tokens}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ================= status ================= */}
        {activeTab === "Status" && (
          <div className="bg-slate-800 p-5 rounded">
            <h2 className="mb-4 text-lg">All Companies</h2>

            {names.map((c, i) => (
              <div
                key={i}
                className="border-b border-slate-700 py-3 flex justify-between items-center"
              >

                {/* Left */}
                <div>
                  <p>{c.companyname}</p>
                  <p className="text-gray-400 text-xs">{c.email}</p>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3">

                  {/* Status */}
                  <span
                    className={`px-2 py-1 rounded text-xs ${c.isactive
                      ? "bg-green-600"
                      : "bg-red-600"
                      }`}
                  >
                    {c.isactive ? "Active" : "Inactive"}
                  </span>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleActive(c.company_id)}
                    className={`px-3 py-1 rounded text-xs ${c.isactive
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                      }`}
                  >
                    {c.isactive ? "Deactivate" : "Activate"}
                  </button>

                </div>

              </div>
            ))}

          </div>

        )}

        {activeTab === "plans" && (
          <div>

            {/* Create Plan */}
            <div className="bg-slate-800 p-5 rounded mb-6">

              <h2 className="text-lg mb-4">Create Plan</h2>

              <div className="grid grid-cols-2 gap-4">

                <input
                  placeholder="Plan Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="bg-slate-900 p-2 rounded"
                />

                <input
                  placeholder="Price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  className="bg-slate-900 p-2 rounded"
                />

                <input
                  placeholder="Duration (days)"
                  type="number"
                  min={1}
                  value={form.duration_days}
                  onChange={(e) =>
                    setForm({ ...form, duration_days: e.target.value })
                  }
                  className="bg-slate-900 p-2 rounded"
                />

                <input
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="bg-slate-900 p-2 rounded"
                />

              </div>

              <button
                onClick={handleCreate}
                className="mt-4 bg-purple-600 px-4 py-2 rounded"
              >
                Create Plan
              </button>

            </div>

            {/* Plans List */}
            <div className="bg-slate-800 p-5 rounded">

              <h2 className="text-lg mb-4">All Plans</h2>

              {plans.map((p, i) => (
                <div
                  key={i}
                  className="border-b border-slate-700 py-3 flex justify-between items-center"
                >

                  {/* Left */}
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-gray-400 text-xs">
                      ₹{p.price} • {p.duration_days} days
                    </p>
                    <p className="text-gray-500 text-xs">
                      {p.description}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-3">

                    <span
                      className={`px-2 py-1 rounded text-xs ${p.isactive
                        ? "bg-green-600"
                        : "bg-red-600"
                        }`}
                    >
                      {p.isactive ? "Active" : "Disabled"}
                    </span>

                    <button
                      onClick={() => togglePlan(p.id)}
                      className={`px-3 py-1 rounded text-xs ${p.isactive
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                      {p.isactive ? "Disable" : "Enable"}
                    </button>

                  </div>

                </div>
              ))}

            </div>

          </div>
        )}


      </div>

    </div>
  );
}