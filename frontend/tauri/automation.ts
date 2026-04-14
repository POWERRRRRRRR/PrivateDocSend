import { invoke } from "@tauri-apps/api/core";

export interface EditorContext {
  hwnd: number;
  title: string;
  class_name: string;
  editor_kind: string;
  supported: boolean;
  source: string;
}

export interface MappingEntryPayload {
  placeholder: string;
  original: string;
  entity_type: string;
}

export interface AutomationResponse {
  ok: boolean;
  message: string;
  steps: number;
  target?: EditorContext | null;
}

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function requireDesktop(): void {
  if (!hasTauriRuntime()) {
    throw new Error(
      "Editor automation only works in the Tauri desktop app. Run `npm run tauri dev`."
    );
  }
}

export async function getEditorContext(): Promise<EditorContext> {
  requireDesktop();
  return invoke<EditorContext>("get_editor_context");
}

export async function replaceAllInActiveEditor(
  findText: string,
  replaceText: string
): Promise<AutomationResponse> {
  requireDesktop();
  return invoke<AutomationResponse>("replace_all_in_active_editor", {
    findText,
    replaceText,
  });
}

export async function restoreAllInActiveEditor(
  mapping: MappingEntryPayload[]
): Promise<AutomationResponse> {
  requireDesktop();
  return invoke<AutomationResponse>("restore_all_in_active_editor", { mapping });
}

export { hasTauriRuntime };
