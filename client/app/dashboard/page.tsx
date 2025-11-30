"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// TypeScript Interfaces to define data structure
interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
}

interface OrderData {
  createdAt: string;
  totalPrice: string;
}

interface ChartData {
  date: string;
  amount: number;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalSpent: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    // 1. Check Auth
    const tenantId = localStorage.getItem("xeno_tenant_id");
    const storedName = localStorage.getItem("xeno_store_name");
    
    if (!tenantId) {
      router.push("/");
      return;
    }
    setStoreName(storedName || "Store");

    // 2. Fetch Data
    const fetchData = async () => {
      try {
        const config = { headers: { "x-tenant-id": tenantId } };

        const [statsRes, ordersRes, custRes] = await Promise.all([
          axios.get("http://localhost:5000/api/stats", config),
          axios.get("http://localhost:5000/api/orders", config),
          axios.get("http://localhost:5000/api/customers/top", config),
        ]);

        setStats(statsRes.data);
        
        // Format Orders for Chart
        const formattedOrders: ChartData[] = ordersRes.data.map((o: OrderData) => ({
          date: new Date(o.createdAt).toLocaleDateString(),
          amount: parseFloat(o.totalPrice)
        }));
        setOrders(formattedOrders);
        
        setTopCustomers(custRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <div className="flex h-screen items-center justify-center text-black">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Xeno Insights 🚀</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium">{storeName}</span>
          <button 
            onClick={() => { localStorage.clear(); router.push("/"); }}
            className="text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Total Revenue" value={`$${stats?.totalRevenue || 0}`} color="bg-green-100 text-green-700" />
          <Card title="Total Orders" value={stats?.totalOrders || 0} color="bg-blue-100 text-blue-700" />
          <Card title="Total Customers" value={stats?.totalCustomers || 0} color="bg-purple-100 text-purple-700" />
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Sales Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top Customers by Spend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.firstName} {c.lastName}</td>
                    <td className="p-3 text-gray-500">{c.email}</td>
                    <td className="p-3 font-bold text-green-600">${c.totalSpent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

// Simple Card Component
function Card({ title, value, color }: { title: string, value: string | number, color: string }) {
  return (
    <div className={`p-6 rounded-lg shadow ${color}`}>
      <h3 className="text-sm font-medium uppercase opacity-80">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}