import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function useListKeys(adminPassword: string) {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/api-keys`, {
        headers: {
          "Authorization": `Bearer ${adminPassword}`
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    },
  });
}

function useCreateKey(adminPassword: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { company_name: string; permissions?: string[]; expires_at?: string }) => {
      const res = await fetch(`/api/admin/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPassword}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        // It's helpful to read the error response from the server
        const errorData = await res.text();
        throw new Error(`Failed to create key: ${errorData}`);
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

function useRevokeKey(adminPassword: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/api-keys/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPassword}`
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to revoke key: ${errorData}`);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });
}

function PredictTest() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    // Retrieve a valid API key to use for the test
    const keys = queryClient.getQueryData<any[]>(["api-keys"]);
    const apiKey = keys?.find(k => !k.revoked)?.api_key_raw; // You need to return the raw key on creation for this to work
    
    if (!apiKey) {
        setError("No active API key found to test with. Please create one.");
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`/predict`, {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
        },
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

function UsageCalendar({ daily_usage, quota }) {
  const sortedDates = Object.keys(daily_usage).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="mt-4">
      <h4 className="font-bold">Usage History</h4>
      <div className="max-h-60 overflow-y-auto border rounded p-2 mt-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left">
              <th>Date</th>
              <th>Usage</th>
              <th>Overage</th>
            </tr>
          </thead>
          <tbody>
            {sortedDates.map(date => {
              const usage = daily_usage[date].count;
              const overage = Math.max(0, usage - quota);
              return (
                <tr key={date} className={overage > 0 ? "bg-red-100" : ""}>
                  <td>{date}</td>
                  <td>{usage} / {quota}</td>
                  <td className="font-bold text-red-600">{overage > 0 ? `+${overage}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminApiKeyPage() {
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  // Hooks now take adminPassword as a parameter
  const { data: keys, isLoading, error } = useListKeys(adminPassword);
  const createKey = useCreateKey(adminPassword);
  const revokeKey = useRevokeKey(adminPassword);
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [editQuotaId, setEditQuotaId] = useState<string | null>(null);
  const [editQuotaValue, setEditQuotaValue] = useState<number>(100);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [historyModalKey, setHistoryModalKey] = useState<any>(null);
  const [expiryDate, setExpiryDate] = useState<string>("");

  // Handle authentication error without causing re-render loop
  if (error && error.message.includes("401") && authError !== "Unauthorized") {
    setAuthError("Unauthorized");
  }
  
  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
        <div className="bg-white p-6 rounded shadow-md w-96">
          <h3 className="text-lg font-bold mb-2">Enter Admin Password</h3>
          <input
            type="password"
            className="border p-2 w-full mb-4"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            placeholder="Password"
          />
          <button
            className="btn btn-primary w-full"
            onClick={() => {
              setIsAuthenticated(true);
              setAuthError(null); // Reset error on new attempt
            }}
          >
            Submit
          </button>
          {authError && (
            <div className="text-red-600 mt-2">Invalid password. Please try again.</div>
          )}
        </div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createKey.mutateAsync({ company_name: companyName, expires_at: expiryDate ? new Date(expiryDate).toISOString() : null });
      setNewKey(result.api_key);
      setShowModal(false);
      setCompanyName("");
      setExpiryDate("");
      toast({
        title: "Success",
        description: "API Key created successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Failed to create key:", error);
      toast({
        title: "Error Creating Key",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleEditQuota = (id: string, current: number) => {
    setEditQuotaId(id);
    setEditQuotaValue(current);
  };

  const handleSaveQuota = async () => {
    if (!editQuotaId) return;
    setQuotaLoading(true);
    try {
      const res = await fetch(`/api/admin/api-keys/quota`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPassword}`
        },
        body: JSON.stringify({ id: editQuotaId, quota_per_day: editQuotaValue }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to update quota: ${errorData}`);
      }
      
      // Manually update the query cache to reflect the change immediately
      // without needing a full reload.
      const queryClient = useQueryClient();
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });

    } catch (error) {
      console.error(error);
      // Optionally, show an error toast to the user
    } finally {
      setEditQuotaId(null);
      setQuotaLoading(false);
    }
  };

  const getTodaysUsage = (key: any) => {
    const today = new Date().toISOString().split('T')[0];
    return key.daily_usage?.[today]?.count || 0;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
            <th>Last Used</th>
            <th>Today's Usage</th>
            <th>Rate Limit</th>
            <th>Expiry</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={7}>Loading...</td></tr>
          ) : Array.isArray(keys) ? (
            keys.map((key: any) => {
              const usageToday = getTodaysUsage(key);
              const overageToday = Math.max(0, usageToday - (key.quota_per_day ?? 100));
              const expired = key.expires_at && new Date() > new Date(key.expires_at);
              return (
                <tr key={key.id} className={expired ? "bg-red-100" : ""}>
                  <td>{key.company_name}</td>
                  <td>{key.revoked ? "Revoked" : expired ? "Expired" : "Active"}</td>
                  <td>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "—"}</td>
                  <td className={overageToday > 0 ? "text-red-600 font-bold" : ""}>
                    {usageToday} / {key.quota_per_day ?? 100}
                    {overageToday > 0 && ` (+${overageToday} over)`}
                  </td>
                  <td>
                    {key.quota_per_day ?? 100}
                    <button className="ml-2 btn btn-xs btn-secondary" onClick={() => handleEditQuota(key.id, key.quota_per_day ?? 100)}>
                      Edit
                    </button>
                  </td>
                  <td>{key.expires_at ? new Date(key.expires_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <button className="btn btn-xs btn-info mr-2" onClick={() => setHistoryModalKey(key)}>
                      History
                    </button>
                    {!key.revoked && !expired && (
                      <button
                        onClick={() => revokeKey.mutate(key.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={7} className="text-red-600">Failed to load API keys.</td></tr>
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
            <input
              type="date"
              className="border p-2 w-full mb-4"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              placeholder="Expiry Date (optional)"
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
      {historyModalKey && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-[500px]">
            <h3 className="text-lg font-bold mb-2">Usage History for {historyModalKey.company_name}</h3>
            <UsageCalendar daily_usage={historyModalKey.daily_usage} quota={historyModalKey.quota_per_day} />
            <div className="flex justify-end mt-4">
               <button className="btn btn-secondary" onClick={() => setHistoryModalKey(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      <PredictTest />
    </div>
  );
}
