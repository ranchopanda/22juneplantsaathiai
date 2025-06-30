import React from 'react';
import { useAuth } from '../utils/auth';

export default function Keys() {
  const { logout } = useAuth();
  // TODO: Fetch and manage API keys from backend
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Key Management</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <p>API key management coming soon. (Backend endpoints ready!)</p>
      </div>
    </div>
  );
} 