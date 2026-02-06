import { Plus, X } from "lucide-react";
import { useState } from "react";

type Props = {
  chatTitles: string[];
  activeTitle: string | null;
  setActiveTitle: (title: string) => void;
};

export default function Yourchats({
  chatTitles,
  activeTitle,
  setActiveTitle,
}: Props) {
  const [open, setopen] = useState(true);
  // max-sm:absolute z-10 max-sm:backdrop-blur-2xl top-0 max-sm:h-screen
  return (
    <div className="">
       <h2 className="sm:hidden absolute left-7 top-7" onClick={() => setopen(!open)}><Plus color="#90a1b9" /></h2>
      <div className="w-64 border-r border-slate-700 p-4 overflow-y-auto  h-full max-sm:hidden">
        <div className="flex justify-between">
          <h2 className="text-slate-400 text-sm mb-3">Your Chats</h2>
          <h2 className="sm:hidden" onClick={() => setopen(!open)}><Plus color="#90a1b9" /></h2>
        </div>
        <div className="space-y-2">
          {chatTitles.map((title, i) => (
            <button
              key={i}
              onClick={() => setActiveTitle(title)}
              className={`w-full text-left p-2 rounded-lg text-sm transition
              ${activeTitle === title
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
                }`}
            >
              {title}
            </button>
          ))}
        </div>
      </div>
      <div className={` border-r border-slate-700 p-4 overflow-y-auto top-0 absolute z-10 backdrop-blur-2xl h-screen sm:hidden
        ${open ? 'w-64' : 'hidden'} transform-content 
        `}>
        <div className="flex justify-between">
          <h2 className="text-slate-400 text-sm mb-3">Your Chats</h2>
          <h2 className="" onClick={() => setopen(!open)}><X color="#90a1b9" /></h2>
        </div>
        <div className="space-y-2">
          {chatTitles.map((title, i) => (
            <button
              key={i}
              onClick={() => setActiveTitle(title)}
              className={`w-full text-left p-2 rounded-lg text-sm transition
              ${activeTitle === title
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
                }`}
            >
              {title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
