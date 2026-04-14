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
    statusMessage,
    setFindText,
    setEntityType,
    setCustomTypeInput,
    addCustomEntityType,
    replaceAllInEditor,
  } = useAppStore();

  const placeholderPreview = useMemo(
    () => previewPlaceholder(findText, entityType, mapping, typeCounters, stablePlaceholders),
    [findText, entityType, mapping, typeCounters, stablePlaceholders]
  );

  const text = getUiText(language);

  return (
    <section className="glass-card panel">
      <div className="field">
        <label>{text.findLabel}</label>
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
          className="input"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <div className="field">
        <label>{text.entityTypeLabel}</label>
        <select
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          className="select"
        >
          {[...ENTITY_TYPES, ...Object.keys(customEntityTypes)].map((type) => (
            <option key={type} value={type}>
              {getEntityTypeLabel(type, language, customEntityTypes)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>{text.customTypeInputLabel}</label>
        <div className="input-row">
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
            className="input"
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
            className="btn btn-secondary"
          >
            {text.addCustomType}
          </button>
        </div>
      </div>

      <div className="placeholder-preview">
        {text.previewPlaceholder}
        <span className="placeholder-token">{placeholderPreview || "-"}</span>
      </div>

      <button
        type="button"
        disabled={isBusy || findText.trim().length === 0}
        onClick={() => {
          void replaceAllInEditor();
        }}
        className="btn btn-primary"
      >
        {isBusy ? text.working : text.replaceAll}
      </button>

      <div className="status-inline" role="status" aria-live="polite">
        {statusMessage}
      </div>
    </section>
  );
}
