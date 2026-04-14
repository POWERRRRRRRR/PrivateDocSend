import {
  ENTITY_COLORS,
  getEntityTypeLabel,
  getUiText,
  type Language,
  useAppStore,
} from "../stores/appStore";

function TypeBadge({ entityType, language }: { entityType: string; language: Language }) {
  const colorClass = ENTITY_COLORS[entityType] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${colorClass}`}>
      {getEntityTypeLabel(entityType, language)}
    </span>
  );
}

export default function MappingList() {
  const { mapping, isBusy, restoreSingleMapping, language } = useAppStore();
  const text = getUiText(language);

  return (
    <section className="border border-slate-200 rounded-lg bg-white">
      <div className="border-b border-slate-200 px-4 py-2">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500">
          {text.mappingTitle} ({mapping.length})
        </h2>
      </div>

      {mapping.length === 0 ? (
        <div className="px-4 py-5 text-sm text-slate-400">
          {text.noMapping}
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
          {mapping.map((entry) => (
            <div
              key={entry.placeholder}
              className="flex items-center gap-2 px-4 py-2 text-sm"
            >
              <span className="font-mono text-sky-700 shrink-0">{entry.placeholder}</span>
              <span className="text-slate-300 shrink-0">-&gt;</span>
              <span className="font-mono text-slate-800 flex-1 min-w-0 truncate">
                {entry.original}
              </span>
              <TypeBadge entityType={entry.entity_type} language={language} />
              <button
                type="button"
                title={text.restoreSingleTitle}
                disabled={isBusy}
                onClick={() => {
                  void restoreSingleMapping(entry.placeholder);
                }}
                className="ml-1 rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {text.restoreSingleButton}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
