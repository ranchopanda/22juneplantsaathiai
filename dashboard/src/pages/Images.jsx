import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/auth';

export default function Images() {
  const { masterKey, logout } = useAuth();
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch recent images from Cloudinary (replace with your backend if needed)
    axios.get('https://res.cloudinary.com/da4ppnxzr/image/list/plant-disease-uploads.json')
      .then(res => setImages(res.data.resources || []))
      .catch(() => setError('Failed to fetch images'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Prediction Images</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map(img => (
          <div key={img.public_id} className="bg-white rounded shadow p-2 cursor-pointer" onClick={() => setSelected(img)}>
            <img src={img.secure_url} alt={img.public_id} className="w-full h-32 object-cover rounded" />
            <div className="text-xs mt-1 truncate">{img.public_id}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white p-4 rounded shadow max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={selected.secure_url} alt={selected.public_id} className="w-full mb-2 rounded" />
            <div className="text-sm">{selected.public_id}</div>
            <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
} 