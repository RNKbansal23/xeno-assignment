"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Login() {
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("xeno123");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Connect to your Backend
      const res = await axios.post("https://xeno-assignment-x40m.onrender.com/api/login", {
        shopDomain: domain,
        password: password,
      });

      // Save the Tenant ID (Token)
      localStorage.setItem("xeno_tenant_id", res.data.tenantId);
      localStorage.setItem("xeno_store_name", res.data.storeName);

      // Redirect to Dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid Domain or Password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Xeno FDE Login</h1>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Shop Domain</label>
            <input
              type="text"
              placeholder="e.g. rnk-test.myshopify.com"
              className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}