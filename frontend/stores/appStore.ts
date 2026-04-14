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
  entity_label?: string;
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

const BUILTIN_ENTITY_TYPE_SET = new Set<string>(ENTITY_TYPES);
const MAX_CUSTOM_TYPES = 50;

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
    customTypeInputLabel: "Custom type",
    customTypeInputPlaceholder: "e.g. Contract Number, Case ID",
    addCustomType: "Add type",
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
    customTypeEmpty: "Please enter a custom type name.",
    customTypeExists: (label: string) => `Type already exists: ${label}`,
    customTypeAdded: (label: string) => `Added custom type: ${label}`,
    customTypeLimit: "Too many custom types. Please keep up to 50.",
    importDone: (count: number) => `Imported ${count} mapping records.`,
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
    customTypeInputLabel: "自定义类别",
    customTypeInputPlaceholder: "例如：合同编号、案号、车牌号",
    addCustomType: "添加类别",
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
    customTypeEmpty: "请先输入自定义类别名称。",
    customTypeExists: (label: string) => `类别已存在：${label}`,
    customTypeAdded: (label: string) => `已添加自定义类别：${label}`,
    customTypeLimit: "自定义类别过多，请控制在 50 个以内。",
    importDone: (count: number) => `已导入 ${count} 条映射记录。`,
  },
} as const;

export function getUiText(language: Language) {
  return UI_TEXT[language] ?? UI_TEXT.zh;
}

function fallbackTypeLabel(type: string): string {
  return type
    .replace(/^CUSTOM_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function getEntityTypeLabel(
  type: string,
  language: Language,
  customLabels: Record<string, string> = {}
) {
  if (customLabels[type]) {
    return customLabels[type];
  }
  const labels = ENTITY_TYPE_LABELS[language] ?? ENTITY_TYPE_LABELS.zh;
  return labels[type as keyof typeof labels] ?? fallbackTypeLabel(type);
}

function mappingKey(original: string, entityType: string): string {
  return `${entityType}::${original}`;
}

const PLACEHOLDER_TOKEN_PATTERN = /^<[A-Z0-9_]+_\d{3}>$/;

function findPlaceholderConflict(needle: string, mapping: MappingEntry[]): string | null {
  const trimmed = needle.trim();
  if (!trimmed) return null;
  if (PLACEHOLDER_TOKEN_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const conflict = mapping.find(
    (entry) => entry.placeholder.includes(trimmed) || trimmed.includes(entry.placeholder)
  );
  return conflict?.placeholder ?? null;
}

function generatePlaceholder(type: string, count: number): string {
  return `<${type}_${String(count).padStart(3, "0")}>`;
}

function extractCounter(placeholder: string, entityType: string): number | null {
  const matched = placeholder.match(new RegExp(`^<${entityType}_(\\d{3})>$`));
  if (!matched) return null;
  return Number.parseInt(matched[1], 10);
}

function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function normalizeEntityTypeKey(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const ascii = trimmed
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "_")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toUpperCase();

  let token = ascii;
  if (!token) {
    token = `CUSTOM_${hashString(trimmed).slice(0, 6)}`;
  }
  if (/^\d/.test(token)) {
    token = `TYPE_${token}`;
  }
  if (token.length > 32) {
    token = token.slice(0, 32).replace(/_+$/g, "");
  }
  if (!token) {
    token = `CUSTOM_${hashString(trimmed).slice(0, 6)}`;
  }
  return token;
}

function normalizeImportedEntityType(input: string): string {
  const upper = input.trim().toUpperCase();
  if (BUILTIN_ENTITY_TYPE_SET.has(upper)) {
    return upper;
  }
  return normalizeEntityTypeKey(input);
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
    const entityTypeRaw = entry.entity_type?.trim();
    if (!placeholder || !entityTypeRaw || !original) continue;

    const normalizedType = normalizeImportedEntityType(entityTypeRaw);
    const normalized: MappingEntry = {
      placeholder,
      original,
      entity_type: normalizedType,
      entity_label: entry.entity_label?.trim() || undefined,
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
  customTypeInput: string;
  customEntityTypes: Record<string, string>;
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
  setCustomTypeInput: (value: string) => void;
  addCustomEntityType: () => boolean;
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
  customTypeInput: "",
  customEntityTypes: {},
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
  setCustomTypeInput: (value) => set({ customTypeInput: value }),
  setStatusMessage: (value) => set({ statusMessage: value }),

  addCustomEntityType: () => {
    const { customTypeInput, customEntityTypes, language } = get();
    const text = getUiText(language);
    const rawLabel = customTypeInput.trim();
    if (!rawLabel) {
      set({ statusMessage: text.customTypeEmpty });
      return false;
    }

    if (Object.keys(customEntityTypes).length >= MAX_CUSTOM_TYPES) {
      set({ statusMessage: text.customTypeLimit });
      return false;
    }

    const key = normalizeEntityTypeKey(rawLabel);
    if (!key) {
      set({ statusMessage: text.customTypeEmpty });
      return false;
    }

    if (BUILTIN_ENTITY_TYPE_SET.has(key)) {
      set({
        entityType: key,
        customTypeInput: "",
        statusMessage: text.customTypeExists(getEntityTypeLabel(key, language)),
      });
      return false;
    }

    if (customEntityTypes[key]) {
      set({
        entityType: key,
        customTypeInput: "",
        statusMessage: text.customTypeExists(customEntityTypes[key]),
      });
      return false;
    }

    set({
      customEntityTypes: { ...customEntityTypes, [key]: rawLabel },
      entityType: key,
      customTypeInput: "",
      statusMessage: text.customTypeAdded(rawLabel),
    });
    return true;
  },

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
    const {
      findText,
      entityType,
      customEntityTypes,
      mapping,
      typeCounters,
      stablePlaceholders,
      isBusy,
    } = get();
    if (isBusy) return false;

    const needle = findText.trim();
    if (!needle) {
      set({ statusMessage: getUiText(get().language).findEmpty });
      return false;
    }

    const placeholderConflict = findPlaceholderConflict(needle, mapping);
    if (placeholderConflict) {
      set({
        statusMessage:
          get().language === "zh"
            ? `当前输入会误伤已有标记（${placeholderConflict}），请先恢复后再替换。`
            : `This text conflicts with existing placeholder (${placeholderConflict}). Please restore first or choose exact original text.`,
      });
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
        {
          placeholder,
          original: needle,
          entity_type: entityType,
          entity_label: customEntityTypes[entityType],
        },
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
      const mergedCustomTypes = { ...state.customEntityTypes };

      for (const entry of normalized) {
        stable[mappingKey(entry.original, entry.entity_type)] = entry.placeholder;
        if (!BUILTIN_ENTITY_TYPE_SET.has(entry.entity_type)) {
          const label = entry.entity_label?.trim() || entry.entity_type;
          if (!mergedCustomTypes[entry.entity_type]) {
            mergedCustomTypes[entry.entity_type] = label;
          }
        }
      }

      return {
        mapping: normalized,
        typeCounters: counters,
        stablePlaceholders: stable,
        customEntityTypes: mergedCustomTypes,
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
