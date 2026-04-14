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
    statusMessage,
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
    <div className="min-h-screen bg-slate-100 text-slate-900 p-3">
      <div className="max-w-xl mx-auto space-y-3">
        <header className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold tracking-tight">PrivateDocSend</h1>
              <p className="text-[11px] text-slate-500">{text.appTagline}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
                className="px-2 py-1 text-[11px] border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50"
                title="Language"
              >
                {language === "zh" ? "ZH/EN" : "EN/ZH"}
              </button>

              <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setMode("anonymize")}
                className={`px-3 py-1.5 font-semibold ${
                  mode === "anonymize"
                    ? "bg-sky-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {text.tabAnonymize}
              </button>
              <button
                type="button"
                onClick={() => setMode("restore")}
                className={`px-3 py-1.5 font-semibold border-l border-slate-200 ${
                  mode === "restore"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {text.tabRestore}
              </button>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] text-slate-500 mb-1">{text.activeEditor}</p>
          <p
            className={`text-xs font-medium truncate ${
              activeEditor?.supported ? "text-emerald-700" : "text-amber-700"
            }`}
            title={editorLabel}
          >
            {editorLabel}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{editorHint}</p>
        </section>

        {mode === "anonymize" && (
          <>
            <ReplacePanel />
            <MappingList />
            <section className="border border-slate-200 rounded-lg bg-white p-4">
              <button
                type="button"
                onClick={() => {
                  void exportMapping();
                }}
                disabled={mapping.length === 0 || isBusy}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

        <section className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-xs text-slate-600">{statusMessage}</p>
        </section>
      </div>
    </div>
  );
}
