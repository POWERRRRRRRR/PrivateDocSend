import { useMemo } from "react";
import {
  ENTITY_TYPES,
  getEntityTypeLabel,
  getUiText,
  previewPlaceholder,
  useAppStore,
} from "../stores/appStore";

export default function ReplacePanel() {
  const {
    findText,
    entityType,
    customTypeInput,
    customEntityTypes,
    mapping,
    typeCounters,
    stablePlaceholders,
    isBusy,
    language,
    setFindText,
    setEntityType,
    setCustomTypeInput,
    addCustomEntityType,
    replaceAllInEditor,
  } = useAppStore();

  const placeholderPreview = useMemo(
    () =>
      previewPlaceholder(
        findText,
        entityType,
        mapping,
        typeCounters,
        stablePlaceholders
      ),
    [findText, entityType, mapping, typeCounters, stablePlaceholders]
  );

  const text = getUiText(language);

  return (
    <section className="border border-slate-200 rounded-lg bg-white p-4 space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-slate-500 font-semibold tracking-wide">
          {text.findLabel}
        </label>
        <input
          type="text"
          value={findText}
          onChange={(event) => setFindText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void replaceAllInEditor();
            }
          }}
          placeholder={text.findPlaceholder}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-500 font-semibold tracking-wide">
          {text.entityTypeLabel}
        </label>
        <select
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          {[...ENTITY_TYPES, ...Object.keys(customEntityTypes)].map((type) => (
            <option key={type} value={type}>
              {getEntityTypeLabel(type, language, customEntityTypes)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-500 font-semibold tracking-wide">
          {text.customTypeInputLabel}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTypeInput}
            onChange={(event) => setCustomTypeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addCustomEntityType();
              }
            }}
            placeholder={text.customTypeInputPlaceholder}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => {
              addCustomEntityType();
            }}
            disabled={isBusy || customTypeInput.trim().length === 0}
            className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {text.addCustomType}
          </button>
        </div>
      </div>

      <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
        <span className="text-slate-500 mr-2">{text.previewPlaceholder}</span>
        <span className="font-mono text-sky-700 font-semibold">
          {placeholderPreview || "-"}
        </span>
      </div>

      <button
        type="button"
        disabled={isBusy || findText.trim().length === 0}
        onClick={() => {
          void replaceAllInEditor();
        }}
        className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBusy ? text.working : text.replaceAll}
      </button>
    </section>
  );
}
