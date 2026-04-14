import { useRef } from "react";
import { getUiText, type MappingEntry, useAppStore } from "../stores/appStore";

export default function RestorePanel() {
  const {
    mapping,
    isBusy,
    importMapping,
    restoreAllMappings,
    setStatusMessage,
    language,
  } = useAppStore();
  const text = getUiText(language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const raw = (loadEvent.target?.result as string) ?? "[]";
        const parsed = JSON.parse(raw) as MappingEntry[];
        importMapping(parsed);
      } catch {
        setStatusMessage(text.invalidMapping);
      }
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };

  return (
    <section className="border border-slate-200 rounded-lg bg-white p-4 space-y-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {text.importMapping}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      <button
        type="button"
        disabled={isBusy || mapping.length === 0}
        onClick={() => {
          void restoreAllMappings();
        }}
        className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBusy ? text.working : text.restoreAll}
      </button>
    </section>
  );
}
