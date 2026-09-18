"use client";

import { useCallback, useEffect, useState } from "react";

import { defaultCurriculumSelection } from "@/modules/catalog";
import { mappingStatusLabel, tr } from "@/shared/copy/tr";

type FieldRow = {
  field: string;
  status: "confirmed" | "proposed";
  value: string | null;
  note?: string;
};

type DenedioMapperWorkspaceProps = {
  generatedQuestionId: string;
  importExternalKey: string;
};

export function DenedioMapperWorkspace({
  generatedQuestionId,
  importExternalKey,
}: DenedioMapperWorkspaceProps) {
  const defaults = defaultCurriculumSelection();
  const [form, setForm] = useState({
    examTypeId: defaults.examTypeId,
    examSectionId: defaults.examSectionId,
    subjectId: defaults.subjectId,
    topicId: defaults.topicId,
    questionArchetypeId: "",
  });
  const [fieldRows, setFieldRows] = useState<FieldRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/questions/${generatedQuestionId}/denedio/mapping`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      mapping?: {
        examTypeId: string;
        examSectionId: string;
        subjectId: string;
        topicId: string;
        questionArchetypeId?: string | null;
      };
      fieldRows?: FieldRow[];
    };
    if (data.mapping) {
      setForm({
        examTypeId: data.mapping.examTypeId,
        examSectionId: data.mapping.examSectionId,
        subjectId: data.mapping.subjectId,
        topicId: data.mapping.topicId,
        questionArchetypeId: data.mapping.questionArchetypeId ?? "",
      });
    }
    if (data.fieldRows) setFieldRows(data.fieldRows);
  }, [generatedQuestionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async () => {
    setStatus(tr.common.saving);
    const res = await fetch(`/api/questions/${generatedQuestionId}/denedio/mapping`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        questionArchetypeId: form.questionArchetypeId || undefined,
        trapTypeMap: {},
      }),
    });
    if (!res.ok) {
      setStatus(tr.export.saveFailed);
      return;
    }
    const data = (await res.json()) as { fieldRows?: FieldRow[] };
    if (data.fieldRows) setFieldRows(data.fieldRows);
    setStatus(tr.export.mappingSaved);
  };

  return (
    <div data-testid="denedio-mapper" className="space-y-4">
      <p className="font-mono text-xs text-[var(--qs-text-muted)]">
        {tr.export.importKeyStable} {importExternalKey}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["examTypeId", "examSectionId", "subjectId", "topicId"] as const).map((key) => (
          <label key={key} className="block text-xs">
            <span className="font-medium">{key}</span>
            <input
              data-testid={`mapping-${key}`}
              className="mt-1 w-full rounded border border-[var(--qs-border)] px-2 py-1 font-mono text-xs"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        data-testid="mapping-save"
        className="rounded-md bg-[var(--qs-phase-ship)] px-3 py-2 text-sm font-medium text-white"
        onClick={() => void save()}
      >
        {tr.export.saveMapping}
      </button>
      {status ? <p className="text-sm text-[var(--qs-text-muted)]">{status}</p> : null}

      <table className="w-full text-left text-sm" data-testid="mapping-field-table">
        <thead>
          <tr className="border-b border-[var(--qs-border)] text-xs uppercase text-[var(--qs-text-muted)]">
            <th className="py-2">{tr.common.field}</th>
            <th className="py-2">{tr.common.status}</th>
            <th className="py-2">{tr.common.note}</th>
          </tr>
        </thead>
        <tbody>
          {fieldRows.map((row) => (
            <tr key={row.field} className="border-b border-[var(--qs-border)]">
              <td className="py-2 font-mono text-xs">{row.field}</td>
              <td className="py-2">
                <span
                  data-testid={`badge-${row.field}`}
                  className={`rounded px-2 py-0.5 text-xs ${
                    row.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {mappingStatusLabel(row.status)}
                </span>
              </td>
              <td className="py-2 text-xs text-[var(--qs-text-muted)]">{row.note ?? tr.common.none}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
