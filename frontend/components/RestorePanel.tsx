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
    statusMessage,
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
    <section className="glass-card panel actions">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="btn btn-secondary"
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
        className="btn btn-success"
      >
        {isBusy ? text.working : text.restoreAll}
      </button>

      <div className="status-inline" role="status" aria-live="polite">
        {statusMessage}
      </div>
    </section>
  );
}
