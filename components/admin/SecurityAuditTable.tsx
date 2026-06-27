"use client";

import type { AdminActivityLog } from "@/lib/supabase";

interface SecurityAuditTableProps {
  logs: AdminActivityLog[];
  loading: boolean;
}

export default function SecurityAuditTable({ logs, loading }: SecurityAuditTableProps) {
  if (loading) {
    return <p className="text-ink-500 text-sm font-semibold">Loading security activities...</p>;
  }

  if (logs.length === 0) {
    return <p className="text-ink-500 text-sm font-semibold">No security audits found.</p>;
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-surface-200 bg-white shadow-[0_8px_20px_-8px_rgba(49,94,239,0.05)] animate-fadeIn">
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        <thead className="bg-surface-50 text-ink-500 border-b border-surface-200">
          <tr>
            <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Timestamp</th>
            <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Operation</th>
            <th className="px-5 py-4 font-bold uppercase tracking-wider text-xs">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {logs.map((audit) => (
            <tr key={audit.id} className="hover:bg-brand-blue-50/10">
              <td className="px-5 py-3.5 text-ink-500 font-medium">
                {new Date(audit.created_at).toLocaleString()}
              </td>
              <td className="px-5 py-3.5">
                <span className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border bg-brand-blue-50 text-brand-blue-700 border-brand-blue-200">
                  {audit.action}
                </span>
              </td>
              <td className="px-5 py-3.5 text-ink-900 font-medium">
                {audit.details}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
