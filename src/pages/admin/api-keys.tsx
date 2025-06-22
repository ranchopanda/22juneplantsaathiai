import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useListKeys() {
  return useQuery(["api-keys"], async () => {
    const res = await fetch("/api/admin/api-keys");
    return res.json();
  });
}

function useCreateKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { company_name: string; permissions?: string[] }) => {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(["api-keys"]),
  });
}

function useRevokeKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/admin/api-keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries(["api-keys"]),
  });
}

export default function AdminApiKeyPage() {
  const { data: keys, isLoading } = useListKeys();
  const createKey = useCreateKey();
  const revokeKey = useRevokeKey();
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createKey.mutateAsync({ company_name: companyName });
    setNewKey(result.api_key);
    setShowModal(false);
    setCompanyName("");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5}>Loading...</td></tr>
          ) : (
            keys?.map((key: any) => (
              <tr key={key.id}>
                <td>{key.company_name}</td>
                <td>{key.revoked ? "Revoked" : "Active"}</td>
                <td>{new Date(key.created_at).toLocaleString()}</td>
                <td>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "—"}</td>
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
    </div>
  );
} 