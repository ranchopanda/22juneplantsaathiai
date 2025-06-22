import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

function useListKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/api-keys`);
      return res.json();
    },
  });
}

function useCreateKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { company_name: string; permissions?: string[] }) => {
      const res = await fetch(`${API_URL}/api/admin/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

function useRevokeKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${API_URL}/api/admin/api-keys/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

function PredictTest() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Error calling /predict");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-8 p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-bold mb-2">Test Prediction (AI Disease Detection)</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button type="submit" className="btn btn-primary" disabled={loading || !file}>
          {loading ? "Predicting..." : "Run Prediction"}
        </button>
      </form>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {result && (
        <pre className="mt-4 p-2 bg-white border rounded text-xs overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AdminApiKeyPage() {
  const { data: keys, isLoading } = useListKeys();
  const createKey = useCreateKey();
  const revokeKey = useRevokeKey();
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [editQuotaId, setEditQuotaId] = useState<string | null>(null);
  const [editQuotaValue, setEditQuotaValue] = useState<number>(100);
  const [quotaLoading, setQuotaLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createKey.mutateAsync({ company_name: companyName });
    setNewKey(result.api_key);
    setShowModal(false);
    setCompanyName("");
  };

  const handleEditQuota = (id: string, current: number) => {
    setEditQuotaId(id);
    setEditQuotaValue(current);
  };

  const handleSaveQuota = async () => {
    setQuotaLoading(true);
    await fetch(`${API_URL}/api/admin/api-keys/quota`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editQuotaId, quota_per_day: editQuotaValue }),
    });
    setEditQuotaId(null);
    setQuotaLoading(false);
    // Refresh keys
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Company API Keys</h2>
      <button
        className="btn btn-primary mb-4"
        onClick={() => setShowModal(true)}
      >
        + Create API Key
      </button>
      <table className="table-auto w-full text-sm mb-8">
        <thead>
          <tr>
            <th>Company</th>
            <th>Status</th>
            <th>Created</th>
            <th>Last Used</th>
            <th>Usage</th>
            <th>Rate Limit</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={7}>Loading...</td></tr>
          ) : (
            keys?.map((key: any) => (
              <tr key={key.id}>
                <td>{key.company_name}</td>
                <td>{key.revoked ? "Revoked" : "Active"}</td>
                <td>{key.created_at ? new Date(key.created_at).toLocaleString() : "—"}</td>
                <td>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "—"}</td>
                <td>{key.usage_today ?? 0}/{key.quota_per_day ?? 100} used today</td>
                <td>
                  {key.quota_per_day ?? 100}
                  <button className="ml-2 btn btn-xs btn-secondary" onClick={() => handleEditQuota(key.id, key.quota_per_day ?? 100)}>
                    Edit
                  </button>
                </td>
                <td>
                  {!key.revoked && (
                    <button
                      onClick={() => revokeKey.mutate(key.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {editQuotaId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96 text-center">
            <h3 className="text-lg font-bold mb-2">Edit Rate Limit</h3>
            <input
              type="number"
              className="border p-2 w-full mb-4"
              value={editQuotaValue}
              min={1}
              onChange={e => setEditQuotaValue(Number(e.target.value))}
            />
            <div className="flex justify-end">
              <button
                className="btn btn-secondary mr-2"
                onClick={() => setEditQuotaId(null)}
                disabled={quotaLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveQuota}
                disabled={quotaLoading}
              >
                {quotaLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            className="bg-white p-6 rounded shadow-md w-96"
            onSubmit={handleCreate}
          >
            <h3 className="text-lg font-bold mb-2">Create API Key</h3>
            <input
              className="border p-2 w-full mb-4"
              placeholder="Company Name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-secondary mr-2"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}
      {newKey && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96 text-center">
            <h3 className="text-lg font-bold mb-2">API Key Created</h3>
            <p className="mb-4 text-sm text-gray-700">Copy and save this key now. It will not be shown again.</p>
            <div className="font-mono bg-gray-100 p-2 rounded mb-4 break-all">{newKey}</div>
            <button
              className="btn btn-primary"
              onClick={() => setNewKey(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
      <PredictTest />
    </div>
  );
} 