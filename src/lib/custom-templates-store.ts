import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomTemplate, TemplateSpec } from "./template-spec";
import { createDefaultSpec } from "./template-spec";

const uid = () => Math.random().toString(36).slice(2, 9);

/**
 * 自定义模板库 —— P1 先存 localStorage；P3 接后端后同步到用户名下。
 */
interface CustomTemplatesStore {
  items: CustomTemplate[];
  /** 新建一个默认 spec 的模板，返回其 id */
  add: (name?: string, spec?: TemplateSpec) => string;
  rename: (id: string, name: string) => void;
  updateSpec: (id: string, patch: Partial<TemplateSpec>) => void;
  remove: (id: string) => void;
}

export const useCustomTemplates = create<CustomTemplatesStore>()(
  persist(
    (set) => ({
      items: [],
      add: (name, spec) => {
        const id = uid();
        set((s) => ({
          items: [
            ...s.items,
            { id, name: name ?? `我的模板 ${s.items.length + 1}`, spec: spec ?? createDefaultSpec() },
          ],
        }));
        return id;
      },
      rename: (id, name) =>
        set((s) => ({ items: s.items.map((t) => (t.id === id ? { ...t, name } : t)) })),
      updateSpec: (id, patch) =>
        set((s) => ({
          items: s.items.map((t) => (t.id === id ? { ...t, spec: { ...t.spec, ...patch } } : t)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
    }),
    { name: "telos-custom-templates-v1" },
  ),
);
