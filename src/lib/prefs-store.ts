import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 用户偏好（本地持久化）。
 * localMode（本地模式/隐私模式）：数据本就只存浏览器本地，开启后进一步——
 * 隐藏一切云写入(模板分享)与登录入口，并对「会临时经服务器处理」的 AI/导出加透明提示。
 */
interface PrefsStore {
  localMode: boolean;
  setLocalMode: (v: boolean) => void;
  toggleLocalMode: () => void;
}

export const usePrefs = create<PrefsStore>()(
  persist(
    (set) => ({
      localMode: false,
      setLocalMode: (v) => set({ localMode: v }),
      toggleLocalMode: () => set((s) => ({ localMode: !s.localMode })),
    }),
    { name: "telos-prefs-v1" },
  ),
);
