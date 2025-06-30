import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/auth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

export default function Dashboard() {
  const { masterKey, logout } = useAuth();
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/usage', {
      headers: { Authorization: `Bearer ${masterKey}` }
    })
      .then(res => setUsage(res.data))
      .catch(err => setError('Failed to fetch usage'));
  }, [masterKey]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usage Analytics</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!usage ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Requests by Endpoint</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(usage.by_endpoint).map(([k, v]) => ({ endpoint: k, count: v }))}>
                <XAxis dataKey="endpoint" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Requests by Partner</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(usage.by_partner).map(([k, v]) => ({ partner: k, count: v }))}>
                <XAxis dataKey="partner" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 rounded shadow col-span-1 md:col-span-2">
            <h2 className="font-semibold mb-2">Total Requests Over Time (Simulated)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[
                { date: '2024-06-28', count: usage.total_requests - 2 },
                { date: '2024-06-29', count: usage.total_requests - 1 },
                { date: '2024-06-30', count: usage.total_requests },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
} 