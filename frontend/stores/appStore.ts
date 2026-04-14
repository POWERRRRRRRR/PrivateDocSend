import { create } from "zustand";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import {
  getEditorContext,
  hasTauriRuntime,
  replaceAllInActiveEditor,
  restoreAllInActiveEditor,
  type EditorContext,
} from "../tauri/automation";

export type Mode = "anonymize" | "restore";
export type Language = "en" | "zh";

export interface MappingEntry {
  placeholder: string;
  original: string;
  entity_type: string;
}

export const ENTITY_TYPES = [
  "PERSON",
  "ORG",
  "PROJECT",
  "FILE",
  "EMAIL_ADDRESS",
  "PHONE_NUMBER",
  "LOCATION",
] as const;

export const ENTITY_TYPE_LABELS = {
  en: {
    PERSON: "Person",
    ORG: "Organization",
    PROJECT: "Project",
    FILE: "File Name",
    EMAIL_ADDRESS: "Email",
    PHONE_NUMBER: "Phone Number",
    LOCATION: "Location",
  },
  zh: {
    PERSON: "人名",
    ORG: "组织/机构",
    PROJECT: "项目",
    FILE: "文件名",
    EMAIL_ADDRESS: "邮箱",
    PHONE_NUMBER: "手机号/电话",
    LOCATION: "地点",
  },
} as const;

export const ENTITY_COLORS: Record<string, string> = {
  PERSON: "bg-sky-100 text-sky-700",
  ORG: "bg-emerald-100 text-emerald-700",
  PROJECT: "bg-amber-100 text-amber-700",
  FILE: "bg-indigo-100 text-indigo-700",
  EMAIL_ADDRESS: "bg-rose-100 text-rose-700",
  PHONE_NUMBER: "bg-orange-100 text-orange-700",
  LOCATION: "bg-cyan-100 text-cyan-700",
};

export const UI_TEXT = {
  en: {
    appTagline: "Mask text in your editor now, restore it anytime later",
    tabAnonymize: "Mask",
    tabRestore: "Restore",
    activeEditor: "Current editor",
    editorUnavailable: "No editor window selected yet",
    editorRuntimeMissing: "Please use the desktop app. Browser mode cannot auto-replace.",
    editorSupportedHint: "Connected. You can replace and restore directly.",
    editorUnsupportedHint:
      "This window may not support automation. Switch to Word/Typora/VSCode/WPS.",
    findLabel: "Original text",
    findPlaceholder: "Type text you want to mask...",
    entityTypeLabel: "Info type",
    previewPlaceholder: "Generated tag:",
    replaceAll: "Replace all in current editor",
    working: "Working...",
    mappingTitle: "Replacement records",
    noMapping: "No records yet.",
    restoreSingleTitle: "Restore this record in editor and remove it",
    restoreSingleButton: "Undo",
    exportMapping: "Export mapping.json",
    importMapping: "Import mapping.json",
    restoreAll: "Restore all in current editor",
    statusReady: "Ready.",
    exportCanceled: "Export canceled.",
    exportDone: "Exported mapping.json",
    exportNone: "Nothing to export.",
    invalidMapping: "Invalid mapping.json format.",
    replaceRunning: "Replacing in your editor...",
    restoreRunning: "Restoring in your editor...",
    restoreSingleRunning: (placeholder: string) =>
      `Restoring ${placeholder} in your editor...`,
    mappingEmpty: "Mapping list is empty.",
    findEmpty: "Please enter text to replace.",
    restoreMissing: "Mapping record not found.",
    replaceFailed: "Replace failed.",
    restoreSingleFailed: "Single restore failed.",
    restoreAllFailed: "Restore all failed.",
    exportFailed: "Export failed.",
    importDone: (count: number) => `Imported ${count} mapping records.`,
    editorConnected: "Connected to editor",
    editorRuntimeLabel: "Desktop mode is required for automatic replacement.",
  },
  zh: {
    appTagline: "在文档里先替换敏感信息，之后随时一键恢复",
    tabAnonymize: "脱敏",
    tabRestore: "恢复",
    activeEditor: "当前编辑器",
    editorUnavailable: "还没有选中可操作的窗口",
    editorRuntimeMissing: "请使用桌面版，网页模式不支持自动替换。",
    editorSupportedHint: "已连接，可直接执行替换和恢复。",
    editorUnsupportedHint: "当前窗口可能不支持自动替换，请切到 Word/Typora/VSCode/WPS。",
    findLabel: "原始文字",
    findPlaceholder: "输入你想替换的文字...",
    entityTypeLabel: "信息类别",
    previewPlaceholder: "将生成的标记：",
    replaceAll: "在当前编辑器替换全部",
    working: "处理中...",
    mappingTitle: "替换记录",
    noMapping: "还没有替换记录。",
    restoreSingleTitle: "在编辑器中恢复这一条并从记录中移除",
    restoreSingleButton: "恢复",
    exportMapping: "导出 mapping.json",
    importMapping: "导入 mapping.json",
    restoreAll: "在当前编辑器恢复全部",
    statusReady: "准备就绪。",
    exportCanceled: "已取消导出。",
    exportDone: "已导出 mapping.json",
    exportNone: "没有可导出的映射记录。",
    invalidMapping: "mapping.json 格式不正确。",
    replaceRunning: "正在你的编辑器里执行替换...",
    restoreRunning: "正在你的编辑器里执行恢复...",
    restoreSingleRunning: (placeholder: string) =>
      `正在你的编辑器里恢复 ${placeholder}...`,
    mappingEmpty: "映射列表为空。",
    findEmpty: "请先输入要替换的文字。",
    restoreMissing: "没有找到这条映射。",
    replaceFailed: "替换失败。",
    restoreSingleFailed: "单条恢复失败。",
    restoreAllFailed: "恢复全部失败。",
    exportFailed: "导出失败。",
    importDone: (count: number) => `已导入 ${count} 条映射记录。`,
    editorConnected: "已连接编辑器",
    editorRuntimeLabel: "自动替换功能仅桌面版可用。",
  },
} as const;

export function getUiText(language: Language) {
  return UI_TEXT[language] ?? UI_TEXT.zh;
}

export function getEntityTypeLabel(type: string, language: Language) {
  const labels = ENTITY_TYPE_LABELS[language] ?? ENTITY_TYPE_LABELS.zh;
  return labels[type as keyof typeof labels] ?? type;
}

function mappingKey(original: string, entityType: string): string {
  return `${entityType}::${original}`;
}

function generatePlaceholder(type: string, count: number): string {
  return `<${type}_${String(count).padStart(3, "0")}>`;
}

function extractCounter(placeholder: string, entityType: string): number | null {
  const matched = placeholder.match(new RegExp(`^<${entityType}_(\\d{3})>$`));
  if (!matched) return null;
  return Number.parseInt(matched[1], 10);
}

function deriveTypeCounters(entries: MappingEntry[]): Record<string, number> {
  const counters: Record<string, number> = {};
  for (const entry of entries) {
    const value = extractCounter(entry.placeholder, entry.entity_type);
    if (value === null) continue;
    counters[entry.entity_type] = Math.max(counters[entry.entity_type] ?? 0, value);
  }
  return counters;
}

function normalizeImportedEntries(entries: MappingEntry[]): MappingEntry[] {
  const byPlaceholder = new Map<string, MappingEntry>();
  const byKey = new Map<string, MappingEntry>();

  for (const entry of entries) {
    const placeholder = entry.placeholder?.trim();
    const original = entry.original ?? "";
    const entityType = entry.entity_type?.trim();
    if (!placeholder || !entityType || !original) continue;

    const normalized: MappingEntry = {
      placeholder,
      original,
      entity_type: entityType.toUpperCase(),
    };
    const key = mappingKey(normalized.original, normalized.entity_type);

    if (byPlaceholder.has(normalized.placeholder)) continue;
    if (byKey.has(key)) continue;

    byPlaceholder.set(normalized.placeholder, normalized);
    byKey.set(key, normalized);
  }

  return Array.from(byPlaceholder.values());
}

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") {
      return serialized;
    }
  } catch {
    // ignore serialization failures and use fallback
  }
  return fallback;
}

interface AppStore {
  mode: Mode;
  language: Language;
  findText: string;
  entityType: string;
  mapping: MappingEntry[];
  typeCounters: Record<string, number>;
  stablePlaceholders: Record<string, string>;
  activeEditor: EditorContext | null;
  isDesktopRuntime: boolean;
  isBusy: boolean;
  statusMessage: string;

  setMode: (mode: Mode) => void;
  setLanguage: (language: Language) => void;
  setFindText: (value: string) => void;
  setEntityType: (value: string) => void;
  setStatusMessage: (value: string) => void;
  refreshEditorContext: () => Promise<void>;
  replaceAllInEditor: () => Promise<boolean>;
  restoreSingleMapping: (placeholder: string) => Promise<boolean>;
  restoreAllMappings: () => Promise<boolean>;
  importMapping: (entries: MappingEntry[]) => void;
  exportMapping: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  mode: "anonymize",
  language: "zh",
  findText: "",
  entityType: "PERSON",
  mapping: [],
  typeCounters: {},
  stablePlaceholders: {},
  activeEditor: null,
  isDesktopRuntime: hasTauriRuntime(),
  isBusy: false,
  statusMessage: UI_TEXT.zh.statusReady,

  setMode: (mode) => set({ mode }),
  setLanguage: (language) =>
    set({ language, statusMessage: getUiText(language).statusReady }),
  setFindText: (value) => set({ findText: value }),
  setEntityType: (value) => set({ entityType: value }),
  setStatusMessage: (value) => set({ statusMessage: value }),

  refreshEditorContext: async () => {
    if (!hasTauriRuntime()) {
      set({
        isDesktopRuntime: false,
        activeEditor: null,
        statusMessage: getUiText(get().language).editorRuntimeMissing,
      });
      return;
    }

    try {
      const context = await getEditorContext();
      set({ isDesktopRuntime: true, activeEditor: context });
    } catch (error) {
      set({
        activeEditor: null,
        statusMessage:
          error instanceof Error ? error.message : getUiText(get().language).editorRuntimeMissing,
      });
    }
  },

  replaceAllInEditor: async () => {
    const { findText, entityType, mapping, typeCounters, stablePlaceholders, isBusy } = get();
    if (isBusy) return false;

    const needle = findText.trim();
    if (!needle) {
      set({ statusMessage: getUiText(get().language).findEmpty });
      return false;
    }

    let placeholder = "";
    let nextMapping = mapping;
    let nextCounters = typeCounters;
    const key = mappingKey(needle, entityType);

    const existing = mapping.find(
      (entry) => entry.original === needle && entry.entity_type === entityType
    );
    if (existing) {
      placeholder = existing.placeholder;
    } else {
      const stable = stablePlaceholders[key];
      const stableTakenByAnother = mapping.some(
        (entry) =>
          entry.placeholder === stable &&
          mappingKey(entry.original, entry.entity_type) !== key
      );

      if (stable && !stableTakenByAnother) {
        placeholder = stable;
      } else {
        let count = typeCounters[entityType] ?? 0;
        do {
          count += 1;
          placeholder = generatePlaceholder(entityType, count);
        } while (mapping.some((entry) => entry.placeholder === placeholder));
        nextCounters = { ...typeCounters, [entityType]: count };
      }

      if (
        !nextCounters[entityType] ||
        (extractCounter(placeholder, entityType) ?? 0) > nextCounters[entityType]
      ) {
        nextCounters = {
          ...nextCounters,
          [entityType]: extractCounter(placeholder, entityType) ?? nextCounters[entityType] ?? 0,
        };
      }

      nextMapping = [
        ...mapping,
        { placeholder, original: needle, entity_type: entityType },
      ];
    }

    set({ isBusy: true, statusMessage: getUiText(get().language).replaceRunning });
    try {
      const response = await replaceAllInActiveEditor(needle, placeholder);
      set((state) => ({
        isBusy: false,
        findText: "",
        mapping: nextMapping,
        typeCounters: nextCounters,
        stablePlaceholders: { ...state.stablePlaceholders, [key]: placeholder },
        activeEditor: response.target ?? state.activeEditor,
        statusMessage: response.message,
      }));
      return true;
    } catch (error) {
      set({
        isBusy: false,
        statusMessage:
          error instanceof Error ? error.message : getUiText(get().language).replaceFailed,
      });
      return false;
    }
  },

  restoreSingleMapping: async (placeholder: string) => {
    const { mapping, isBusy } = get();
    if (isBusy) return false;

    const entry = mapping.find((item) => item.placeholder === placeholder);
    if (!entry) {
      set({ statusMessage: getUiText(get().language).restoreMissing });
      return false;
    }

    set({
      isBusy: true,
      statusMessage: getUiText(get().language).restoreSingleRunning(entry.placeholder),
    });
    try {
      const response = await replaceAllInActiveEditor(entry.placeholder, entry.original);
      set((state) => ({
        isBusy: false,
        mapping: state.mapping.filter((item) => item.placeholder !== placeholder),
        activeEditor: response.target ?? state.activeEditor,
        statusMessage: response.message,
      }));
      return true;
    } catch (error) {
      set({
        isBusy: false,
        statusMessage:
          error instanceof Error ? error.message : getUiText(get().language).restoreSingleFailed,
      });
      return false;
    }
  },

  restoreAllMappings: async () => {
    const { mapping, isBusy } = get();
    if (isBusy) return false;
    if (mapping.length === 0) {
      set({ statusMessage: getUiText(get().language).mappingEmpty });
      return false;
    }

    set({ isBusy: true, statusMessage: getUiText(get().language).restoreRunning });
    try {
      const response = await restoreAllInActiveEditor(mapping);
      set((state) => ({
        isBusy: false,
        activeEditor: response.target ?? state.activeEditor,
        statusMessage: response.message,
      }));
      return true;
    } catch (error) {
      set({
        isBusy: false,
        statusMessage:
          error instanceof Error ? error.message : getUiText(get().language).restoreAllFailed,
      });
      return false;
    }
  },

  importMapping: (entries) => {
    const normalized = normalizeImportedEntries(entries);
    const counters = deriveTypeCounters(normalized);
    const text = getUiText(get().language);
    set((state) => {
      const stable = { ...state.stablePlaceholders };
      for (const entry of normalized) {
        stable[mappingKey(entry.original, entry.entity_type)] = entry.placeholder;
      }
      return {
        mapping: normalized,
        typeCounters: counters,
        stablePlaceholders: stable,
        statusMessage: text.importDone(normalized.length),
      };
    });
  },

  exportMapping: async () => {
    const { mapping } = get();
    const text = getUiText(get().language);

    if (mapping.length === 0) {
      set({ statusMessage: text.exportNone });
      return;
    }

    const payload = JSON.stringify(mapping, null, 2);
    if (hasTauriRuntime()) {
      try {
        const filePath = await save({
          defaultPath: "mapping.json",
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (!filePath) {
          set({ statusMessage: text.exportCanceled });
          return;
        }
        await writeTextFile(filePath, payload);
        set({ statusMessage: text.exportDone });
        return;
      } catch (error) {
        set({
          statusMessage: getErrorMessage(error, text.exportFailed),
        });
        return;
      }
    }

    downloadBlob(payload, "mapping.json", "application/json;charset=utf-8");
    set({ statusMessage: text.exportDone });
  },
}));

export function previewPlaceholder(
  findText: string,
  entityType: string,
  mapping: MappingEntry[],
  typeCounters: Record<string, number>,
  stablePlaceholders: Record<string, string>
): string {
  const needle = findText.trim();
  if (!needle) return "";

  const existing = mapping.find(
    (entry) => entry.original === needle && entry.entity_type === entityType
  );
  if (existing) return existing.placeholder;

  const key = mappingKey(needle, entityType);
  const stable = stablePlaceholders[key];
  if (stable) return stable;

  let count = typeCounters[entityType] ?? 0;
  let placeholder = "";
  do {
    count += 1;
    placeholder = generatePlaceholder(entityType, count);
  } while (mapping.some((entry) => entry.placeholder === placeholder));

  return placeholder;
}
