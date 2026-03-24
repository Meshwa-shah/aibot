import React, { useEffect, useState } from 'react'
import axios from 'axios';

const Companysetup = () => {
  const [companyId, setCompanyId] = useState<string | null>("");
  const [url, setUrl] = useState("");
  const [script, setscript] = useState<null | string>(null);
  const [id, setid] = useState("");
  const [info, setinfo] = useState<boolean>(false);
  const [sc, setsc] = useState(false);
  const [name, setname] = useState<string | null>("");
  const [disabled, setdisabled] = useState(false);
  const [loading, setloading] = useState(false);
  const [disabled2, setdisabled2] = useState(false);
  const [loading2, setloading2] = useState(false);

  



  useEffect(() => {
    setCompanyId(localStorage.getItem("id"));
    setname(localStorage.getItem("name"));
  }, []);
  useEffect(() => {
     setForm({company_id: localStorage.getItem("id"), companyName: localStorage.getItem("name")});
  }, []);

  

 

  const [form, setForm] = useState({
    company_id: "",
    companyName: "",
    description: "",
    importantKnowledge: "",
    faq: "",
    supportEmail: "",
    language: "English"
  });


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      setloading2(true);
      setdisabled2(true);
      const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/extrainfo`, form);
      if (res.data.success === true) {
        alert("Your script is ready")
        setscript(res.data.script);
        setsc(true);
      }
      else {
        alert(res.data.message);
      }
    }
    catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
    finally{
      setloading2(false);
      setdisabled2(false);
    }
  }


  const handlesubmit = async () => {
    try {
      setloading(true);
      setdisabled(true);
      const res = await axios.post(`${import.meta.env.VITE_BACK_URL}/scrape-website`, {
        url: url,
        company_id: companyId
      });
      if (res.data.success === true) {
        alert("information added");
        setinfo(true);
        setid(res.data.company_id);
      }
      else {
        alert(res.data.message);
      }
    }
    catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
    finally{
      setloading(true);
      setdisabled(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      {info === false ? <>
        {/* Top Message */}

        <p className="text-purple-400 text-sm mb-6 text-center">
          Your company id is sent in email
        </p>

        <div className="bg-slate-800 p-8 rounded-xl w-96 shadow-lg">

          <h1 className="text-2xl text-white font-bold mb-2">
            Connect Your Website
          </h1>

          <p className="text-sm text-gray-400 mb-6">
            Add your company ID and website URL to activate the chatbot.
          </p>

          {/* Company ID */}

          <input
            type="text"
            placeholder="Company ID"
            className="w-full p-3 mb-3 rounded bg-slate-700 text-white"
            value={companyId}
            disabled={true}
          />

          {/* Website URL */}

          <input
            type="text"
            placeholder="Website URL"
            className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />


          {/* Submit Button */}

          <button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded"
            onClick={handlesubmit}
            disabled={disabled}
          >
           {loading === true ? "Wait..." : "Connect Website"}
          </button>

        </div> </> : <>{sc === false ? <>
          <p className="text-purple-400 text-sm mb-4 text-center">
            Configure your chatbot knowledge and behavior
          </p>

          <div className="bg-slate-800 p-6 rounded-xl w-96 shadow-lg">

            <h1 className="text-xl text-white font-semibold mb-2">
              Chatbot Configuration
            </h1>

            <p className="text-xs text-gray-400 mb-5">
              Add details to improve chatbot accuracy.
            </p>

            {/* Company ID */}
            <input
              type="text"
              name="company_id"
              placeholder="Company ID"
              className="w-full p-2.5 mb-2 rounded bg-slate-700 text-white text-sm"
              onChange={handleChange}
              value={companyId}
            />

            {/* Company Name */}
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              className="w-full p-2.5 mb-2 rounded bg-slate-700 text-white text-sm"
              onChange={handleChange}
              value={name}
            />

      
            {/* Description */}
            <textarea
              name="description"
              placeholder="Business Description"
              rows="2"
              className="w-full p-2.5 mb-2 rounded bg-slate-700 text-white text-sm"
              onChange={handleChange}
            />

            {/* Important Knowledge */}
            <textarea
              name="importantKnowledge"
              placeholder="Important Knowledge (pricing, policies, rules)"
              rows="2"
              className="w-full p-2.5 mb-2 rounded bg-slate-700 text-white text-sm"
              onChange={handleChange}
            />

            {/* FAQ */}
            <textarea
              name="faq"
              placeholder="FAQs"
              rows="2"
              className="w-full p-2.5 mb-2 rounded bg-slate-700 text-white text-sm"
              onChange={handleChange}
            />

            {/* Support Email */}
            <input
              type="email"
              name="supportEmail"
              placeholder="Support Email"
              className="w-full p-2.5 mb-2 rounded bg-slate-700 text-white text-sm"
              onChange={handleChange}
            />

            {/* Tone */}


            {/* Language */}


            {/* Button */}
            <button
              onClick={handleSubmit}
              disabled={disabled2}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded text-sm"
            >
              {loading2 === true ? "Wait..." : "Save Configuration"}
            </button>

          </div> </> : <>
          <div className="bg-slate-800 p-8 rounded-xl w-96 shadow-lg">
            <p className="text-purple-400 text-sm mb-6 text-center">
              Your Script
            </p>
            <textarea name="" id="" rows="6" className='w-full p-3 mb-4 rounded bg-slate-700 text-white'>
              {script}
            </textarea></div>
        </>}

      </>}

    </div>
  )
}

export default Companysetup