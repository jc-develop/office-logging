"use client";

import { useState, useEffect } from "react";
import { supabase, IS_MOCK } from "@/lib/supabase";
import type { AdminConfig } from "@/lib/supabase";
import { getAdminList, deleteAdmin } from "@/lib/logs";
import { playClickSound, playSuccessSound, playErrorSound } from "@/lib/audio";
import { createActivityLog } from "@/lib/logs";

export default function AdminManagementPanel() {
  const [admins, setAdmins] = useState<AdminConfig[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!IS_MOCK) {
          const { data: { user } } = await supabase.auth.getUser();
          setCurrentUserEmail(user?.email ?? null);
        } else {
          setCurrentUserEmail("admin@startuplab.com");
        }
        const list = await getAdminList();
        setAdmins(list);
      } catch {
        setError("Failed to load admin list.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleMockAdd(e: React.FormEvent) {
    e.preventDefault();
    playClickSound();
    setError(null);
    setSuccess(null);
    setSaving(true);

    if (!newEmail) {
      setSaving(false);
      playErrorSound();
      setError("Email is required.");
      return;
    }

    if (admins.some((a) => a.email === newEmail)) {
      setSaving(false);
      playErrorSound();
      setError("This admin already exists.");
      return;
    }

    const stored = localStorage.getItem("mock_admin_config_list");
    const list: AdminConfig[] = stored ? JSON.parse(stored) : [];
    list.push({ email: newEmail, created_at: new Date().toISOString() });
    localStorage.setItem("mock_admin_config_list", JSON.stringify(list));
    setAdmins(list);
    setSuccess(`Admin ${newEmail} created.`);
    setNewEmail("");
    setSaving(false);
    playSuccessSound();
    await createActivityLog("CREATE_ADMIN", `Admin created: ${newEmail} (Local Mock)`);
  }

  async function handleRemove(email: string) {
    playClickSound();
    setError(null);
    setSuccess(null);

    if (email === currentUserEmail) {
      playErrorSound();
      setError("You cannot remove yourself.");
      return;
    }

    if (IS_MOCK) {
      const stored = localStorage.getItem("mock_admin_config_list");
      const list: AdminConfig[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((a) => a.email !== email);
      localStorage.setItem("mock_admin_config_list", JSON.stringify(filtered));
      setAdmins(filtered);
      playSuccessSound();
      await createActivityLog("DELETE_ADMIN", `Admin removed: ${email} (Local Mock)`);
      return;
    }

    try {
      await deleteAdmin(email);
      setAdmins((prev) => prev.filter((a) => a.email !== email));
      setSuccess(`Admin ${email} removed.`);
      playSuccessSound();
      await createActivityLog("DELETE_ADMIN", `Admin removed: ${email}`);
    } catch {
      playErrorSound();
      setError("Failed to remove admin.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {IS_MOCK ? (
        <div className="rounded-[18px] border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-extrabold text-ink-900 mb-4">
            Add New Admin (Mock)
          </h2>
          <form onSubmit={handleMockAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                disabled={saving}
                placeholder="newadmin@company.com"
                className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-ink-950 outline-none transition focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500/20"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-brand-blue-50 border border-brand-blue-200 px-4 py-3 text-center text-xs font-bold text-brand-blue-700">
                ⚠️ {error}
              </p>
            )}
            {success && (
              <p className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-center text-xs font-bold text-green-700">
                ✓ {success}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-brand-blue-600 py-3 font-bold text-white shadow-md shadow-brand-blue-100 transition duration-200 hover:bg-brand-blue-500 active:scale-98 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
            >
              {saving ? "Adding…" : "Add Admin"}
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-[18px] border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-extrabold text-ink-900 mb-4">
            Add New Admin
          </h2>
          <p className="text-sm text-ink-600 mb-3 leading-relaxed">
            To add a new admin, open the <strong>Supabase Dashboard &rarr; SQL Editor</strong>{" "}
            and paste the script from <code>scripts/add-admin.sql</code>.
          </p>
          <ol className="list-decimal list-inside text-sm text-ink-600 space-y-1">
            <li>Create the user in <strong>Authentication &rarr; Users &rarr; Add User</strong> (Supabase hashes the password with bcrypt automatically).</li>
            <li>Run <code>INSERT INTO public.admin_config (email) VALUES (&apos;email@company.com&apos;);</code></li>
          </ol>
        </div>
      )}

      <div className="rounded-[18px] border border-surface-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-extrabold text-ink-900 mb-4">
          Current Admins
        </h2>
        {admins.length === 0 ? (
          <p className="text-sm text-ink-500">No admins configured.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {admins.map((admin) => (
              <li
                key={admin.email}
                className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50 px-4 py-3"
              >
                <span className="text-sm font-semibold text-ink-900">
                  {admin.email}
                  {admin.email === currentUserEmail && (
                    <span className="ml-2 text-[10px] font-bold text-brand-blue-600 uppercase tracking-wider">
                      (you)
                    </span>
                  )}
                </span>
                {admin.email !== currentUserEmail && (
                  <button
                    type="button"
                    onClick={() => handleRemove(admin.email)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
