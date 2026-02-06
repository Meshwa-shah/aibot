import { useEffect, useState } from "react";
import axios from "axios";
import { Users } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { type NavigateFunction } from 'react-router-dom';

type User = {
  id: number;
  name: string | null;
  phone: string | null;
  created_at: string;
};

export default function New() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nav: NavigateFunction = useNavigate();

  useEffect(() => {
    async function check() {
      const checktoken = await axios.get(`${import.meta.env.VITE_BACK_URL}/verify`, { withCredentials: true });
      if (checktoken.data.success === false) {
        nav('/login')
      }
    }
    check();
  }, [])

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACK_URL}/fetchdata`);

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

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b1020] via-[#0f1a2f] to-black p-6">
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
                    className="border-b border-gray-800 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      {user.name ?? "—"}
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
    </div>
  );
}
