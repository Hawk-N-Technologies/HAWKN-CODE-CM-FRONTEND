import { useCallback, useEffect, useState } from "react";
import { createUser, listUsers, updateUser } from "../../api/admin";
import { useAuth } from "../../auth/useAuth";
import Notice from "../../components/ui/Notice";
import { btnPrimary, btnSecondary, card, errorText, input, label } from "../../components/ui/ui";

const EMPTY = { username: "", first_name: "", last_name: "", role: "OPERATOR", password: "" };
const ROLE_TEXT = { ADMIN: "Admin", OPERATOR: "Operator" };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState({ status: "loading", rows: [], error: null });
  const [form, setForm] = useState(EMPTY);
  const [reset, setReset] = useState(null); // { id, password }
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers({ status: "ok", rows: await listUsers(), error: null });
    } catch (error) {
      setUsers({ status: "error", rows: [], error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action) => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await action();
      setNotice({ ok: true, text: response.message });
      await load();
      return true;
    } catch (error) {
      setNotice({ ok: false, text: errorText(error) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (await act(() => createUser(form))) setForm(EMPTY);
  };

  const handleReset = async (event) => {
    event.preventDefault();
    if (await act(() => updateUser(reset.id, { password: reset.password }))) setReset(null);
  };

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-cm-navy-950">Users</h1>
        <p className="text-sm text-cm-text-muted">
          Passwords: at least 10 characters, not only numbers, not a common password. Share them in person, not by chat.
        </p>
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <form onSubmit={handleCreate} className={`${card} grid gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end`}>
        <div>
          <label htmlFor="u-username" className={label}>Username</label>
          <input id="u-username" className={input} autoComplete="off" value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </div>
        <div>
          <label htmlFor="u-first" className={label}>First name</label>
          <input id="u-first" className={input} value={form.first_name}
            onChange={(event) => setForm({ ...form, first_name: event.target.value })} />
        </div>
        <div>
          <label htmlFor="u-last" className={label}>Last name</label>
          <input id="u-last" className={input} value={form.last_name}
            onChange={(event) => setForm({ ...form, last_name: event.target.value })} />
        </div>
        <div>
          <label htmlFor="u-role" className={label}>Role</label>
          <select id="u-role" className={input} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="OPERATOR">Operator</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label htmlFor="u-password" className={label}>Password</label>
          <input id="u-password" type="password" autoComplete="new-password" className={input} value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        <button type="submit" className={btnPrimary} disabled={busy || !form.username.trim() || !form.password}>Add user</button>
      </form>

      <div className={`${card} overflow-x-auto`}>
        {users.status === "loading" && <p className="text-cm-text-muted">Loading…</p>}
        {users.status === "error" && <p className="text-cm-danger-600">{users.error.message}</p>}
        {users.status === "ok" && (
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="text-left text-cm-text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 pr-3 font-medium">Sections</th>
                <th className="py-2 pr-3 font-medium">Last login</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cm-border">
              {users.rows.map((row) => {
                const isMe = row.id === me.id;
                return (
                  <tr key={row.id} className="align-top">
                    <td className="py-2 pr-3">
                      <span className="font-semibold">{row.display_name}</span>
                      <span className="block text-xs text-cm-text-muted">{row.username}{isMe && " (you)"}</span>
                    </td>
                    <td className="py-2 pr-3">{ROLE_TEXT[row.role] || row.role}</td>
                    <td className="py-2 pr-3">{row.role === "ADMIN" ? "All" : row.sections.join(", ") || "—"}</td>
                    <td className="py-2 pr-3">{row.last_login ? new Date(row.last_login).toLocaleString() : "Never"}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.is_active ? "bg-cm-success-100 text-cm-success-600" : "bg-cm-bg text-cm-text-muted"}`}>
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2">
                      {reset?.id === row.id ? (
                        <form onSubmit={handleReset} className="flex justify-end gap-2">
                          <input type="password" autoComplete="new-password" className={`${input} w-44`} placeholder="New password"
                            aria-label="New password" value={reset.password}
                            onChange={(event) => setReset({ ...reset, password: event.target.value })} />
                          <button type="submit" className={btnPrimary} disabled={busy || !reset.password}>Save</button>
                          <button type="button" className={btnSecondary} onClick={() => setReset(null)}>×</button>
                        </form>
                      ) : (
                        <span className="flex justify-end gap-2">
                          <button type="button" className={btnSecondary} onClick={() => setReset({ id: row.id, password: "" })}>
                            Reset password
                          </button>
                          {!isMe && (
                            <button type="button" className={btnSecondary} disabled={busy}
                              onClick={() => act(() => updateUser(row.id, { is_active: !row.is_active }))}>
                              {row.is_active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
