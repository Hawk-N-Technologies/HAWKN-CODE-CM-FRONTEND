import { useCallback, useEffect, useState } from "react";
import {
  addSectionOperator,
  createSection,
  listConfigurations,
  listSections,
  listUsers,
  removeSectionOperator,
  updateSection,
} from "../../api/admin";
import Notice from "../../components/ui/Notice";
import { btnPrimary, btnSecondary, card, errorText, input, label } from "../../components/ui/ui";

/** Options for "which box configuration": latest version of each active configuration. */
function configOptions(configs, currentVersionId, currentLabel) {
  const options = configs
    .filter((config) => config.is_active && config.versions.length > 0)
    .map((config) => ({
      value: String(config.versions[0].id),
      text: `${config.versions[0].label} — ${config.name} (${config.versions[0].total_quantity} per box)`,
    }));
  if (currentVersionId && !options.some((option) => option.value === String(currentVersionId))) {
    options.unshift({ value: String(currentVersionId), text: `${currentLabel} (older version)` });
  }
  return options;
}

function SectionCard({ section, configs, operators, busy, act }) {
  const [versionId, setVersionId] = useState(section.active_config_version_id ? String(section.active_config_version_id) : "");
  const [newOperator, setNewOperator] = useState("");
  const assignedIds = new Set(section.operators.map((op) => op.id));
  const available = operators.filter((op) => op.is_active && !assignedIds.has(op.id));
  const changed = versionId !== (section.active_config_version_id ? String(section.active_config_version_id) : "");

  return (
    <section className={`${card} space-y-4 ${section.is_active ? "" : "opacity-70"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">Section {section.code} <span className="font-normal text-cm-text-muted">· {section.name}</span></h2>
        <span className="flex gap-2 text-xs font-semibold">
          {section.has_open_box && <span className="rounded-full bg-cm-warning-100 px-2 py-0.5 text-cm-warning-600">Box open</span>}
          <span className={`rounded-full px-2 py-0.5 ${section.is_active ? "bg-cm-success-100 text-cm-success-600" : "bg-cm-bg text-cm-text-muted"}`}>
            {section.is_active ? "Active" : "Inactive"}
          </span>
        </span>
      </div>

      <div>
        <label htmlFor={`cfg-${section.id}`} className={label}>Box configuration</label>
        <div className="flex gap-2">
          <select id={`cfg-${section.id}`} className={input} value={versionId} onChange={(event) => setVersionId(event.target.value)}>
            <option value="">None (packing not possible)</option>
            {configOptions(configs, section.active_config_version_id, section.active_config?.label).map((option) => (
              <option key={option.value} value={option.value}>{option.text}</option>
            ))}
          </select>
          <button type="button" className={btnPrimary} disabled={busy || !changed}
            onClick={() => act(() => updateSection(section.id, { active_config_version_id: versionId ? Number(versionId) : null }))}>
            Save
          </button>
        </div>
        {section.has_open_box && changed && (
          <p className="mt-1 text-xs text-cm-warning-600">The open box keeps its current configuration; the next box uses the new one.</p>
        )}
      </div>

      <div>
        <p className={label}>Operators</p>
        {section.operators.length === 0 ? (
          <p className="text-sm text-cm-text-muted">No operators assigned.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {section.operators.map((op) => (
              <li key={op.id} className="flex items-center gap-1 rounded-full bg-cm-blue-50 py-1 pl-3 pr-1 text-sm text-cm-blue-700">
                {op.display_name} <span className="text-xs opacity-70">({op.username})</span>
                <button type="button" disabled={busy} aria-label={`Remove ${op.username}`}
                  onClick={() => act(() => removeSectionOperator(section.id, op.id))}
                  className="ml-1 h-6 w-6 rounded-full font-bold hover:bg-cm-blue-100">
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex gap-2">
          <select className={input} aria-label="Operator to add" value={newOperator} onChange={(event) => setNewOperator(event.target.value)}>
            <option value="">Add operator…</option>
            {available.map((op) => <option key={op.id} value={op.id}>{op.display_name} ({op.username})</option>)}
          </select>
          <button type="button" className={btnSecondary} disabled={busy || !newOperator}
            onClick={async () => {
              const ok = await act(() => addSectionOperator(section.id, Number(newOperator)));
              if (ok) setNewOperator("");
            }}>
            Add
          </button>
        </div>
      </div>

      <button type="button" className={btnSecondary} disabled={busy}
        onClick={() => act(() => updateSection(section.id, { is_active: !section.is_active }))}>
        {section.is_active ? "Deactivate section" : "Activate section"}
      </button>
    </section>
  );
}

export default function SectionsPage() {
  const [data, setData] = useState({ status: "loading", sections: [], configs: [], operators: [], error: null });
  const [form, setForm] = useState({ code: "", name: "", version: "" });
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sections, configs, operators] = await Promise.all([listSections(), listConfigurations(), listUsers("OPERATOR")]);
      setData({ status: "ok", sections, configs, operators, error: null });
    } catch (error) {
      setData((prev) => ({ ...prev, status: "error", error }));
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
    const ok = await act(() =>
      createSection({ code: form.code, name: form.name, active_config_version_id: form.version ? Number(form.version) : null }),
    );
    if (ok) setForm({ code: "", name: "", version: "" });
  };

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-cm-navy-950">Packing sections</h1>
        <p className="text-sm text-cm-text-muted">Each section packs one box configuration. Operators only see sections they are assigned to.</p>
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <form onSubmit={handleCreate} className={`${card} grid gap-3 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-end`}>
        <div>
          <label htmlFor="sec-code" className={label}>Code</label>
          <input id="sec-code" className={input} placeholder="B" value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })} />
        </div>
        <div>
          <label htmlFor="sec-name" className={label}>Name</label>
          <input id="sec-name" className={input} placeholder="Section B" value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </div>
        <div>
          <label htmlFor="sec-cfg" className={label}>Box configuration</label>
          <select id="sec-cfg" className={input} value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })}>
            <option value="">Choose later</option>
            {configOptions(data.configs).map((option) => <option key={option.value} value={option.value}>{option.text}</option>)}
          </select>
        </div>
        <button type="submit" className={btnPrimary} disabled={busy || !form.code.trim() || !form.name.trim()}>Add section</button>
      </form>

      {data.status === "loading" && <p className="text-cm-text-muted">Loading…</p>}
      {data.status === "error" && <p className="text-cm-danger-600">{data.error.message}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {data.sections.map((section) => (
          <SectionCard
            key={`${section.id}-${section.active_config_version_id}`}
            section={section}
            configs={data.configs}
            operators={data.operators}
            busy={busy}
            act={act}
          />
        ))}
      </div>
    </main>
  );
}
