import { useEffect } from "react";
import MappingList from "./components/MappingList";
import ReplacePanel from "./components/ReplacePanel";
import RestorePanel from "./components/RestorePanel";
import { getUiText, useAppStore } from "./stores/appStore";

export default function App() {
  const {
    mode,
    setMode,
    language,
    setLanguage,
    mapping,
    isBusy,
    exportMapping,
    activeEditor,
    isDesktopRuntime,
    refreshEditorContext,
  } = useAppStore();

  useEffect(() => {
    void refreshEditorContext();
  }, [refreshEditorContext]);

  useEffect(() => {
    if (!isDesktopRuntime) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.hidden) return;
      void refreshEditorContext();
    };

    timer = setInterval(tick, 3000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [isDesktopRuntime, refreshEditorContext]);

  const text = getUiText(language);
  const editorLabel =
    activeEditor && activeEditor.hwnd > 0
      ? activeEditor.title || activeEditor.class_name
      : text.editorUnavailable;
  const editorHint = !isDesktopRuntime
    ? text.editorRuntimeMissing
    : activeEditor?.supported
      ? text.editorSupportedHint
      : text.editorUnsupportedHint;

  return (
    <div className="app-root">
      <main className="app-shell">
        <header className="glass-card app-header">
          <div className="brand">
            <h1>PrivateDocSend</h1>
            <p>{text.appTagline}</p>
          </div>

          <div className="header-tools">
            <button
              type="button"
              onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
              className="lang-button"
              title="Language"
            >
              {language === "zh" ? "ZH / EN" : "EN / ZH"}
            </button>

            <div className="segment" role="tablist" aria-label="mode switch">
              <button
                type="button"
                onClick={() => setMode("anonymize")}
                className={mode === "anonymize" ? "active" : ""}
              >
                {text.tabAnonymize}
              </button>
              <button
                type="button"
                onClick={() => setMode("restore")}
                className={mode === "restore" ? "active" : ""}
              >
                {text.tabRestore}
              </button>
            </div>
          </div>
        </header>

        <section className="glass-card editor-card">
          <div className="meta-label">{text.activeEditor}</div>
          <p className={`editor-title ${activeEditor?.supported ? "" : "unsupported"}`}>
            {editorLabel}
          </p>
          <p className="editor-hint">{editorHint}</p>
        </section>

        {mode === "anonymize" && (
          <>
            <ReplacePanel />
            <MappingList />
            <section className="glass-card panel">
              <button
                type="button"
                onClick={() => {
                  void exportMapping();
                }}
                disabled={mapping.length === 0 || isBusy}
                className="btn btn-secondary"
              >
                {text.exportMapping}
              </button>
            </section>
          </>
        )}

        {mode === "restore" && (
          <>
            <MappingList />
            <RestorePanel />
          </>
        )}
      </main>
    </div>
  );
}
