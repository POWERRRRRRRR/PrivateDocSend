import {
  ENTITY_COLORS,
  getEntityTypeLabel,
  getUiText,
  type Language,
  useAppStore,
} from "../stores/appStore";

function TypeBadge({
  entityType,
  language,
  customEntityTypes,
}: {
  entityType: string;
  language: Language;
  customEntityTypes: Record<string, string>;
}) {
  const colorClass = ENTITY_COLORS[entityType] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`tag ${colorClass}`}>
      {getEntityTypeLabel(entityType, language, customEntityTypes)}
    </span>
  );
}

export default function MappingList() {
  const { mapping, isBusy, restoreSingleMapping, language, customEntityTypes } = useAppStore();
  const text = getUiText(language);

  return (
    <section className="glass-card mapping-card">
      <div className="mapping-head">
        {text.mappingTitle} ({mapping.length})
      </div>

      {mapping.length === 0 ? (
        <div className="mapping-empty">{text.noMapping}</div>
      ) : (
        <div className="mapping-list">
          {mapping.map((entry) => (
            <div key={entry.placeholder} className="mapping-row">
              <span className="placeholder-text">{entry.placeholder}</span>
              <span className="arrow">-&gt;</span>
              <span className="original-text">{entry.original}</span>
              <TypeBadge
                entityType={entry.entity_type}
                language={language}
                customEntityTypes={customEntityTypes}
              />
              <button
                type="button"
                title={text.restoreSingleTitle}
                disabled={isBusy}
                onClick={() => {
                  void restoreSingleMapping(entry.placeholder);
                }}
                className="btn btn-ghost"
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
