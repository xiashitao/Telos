"use client";

import { useEffect, useState } from "react";

interface MeUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
interface MeResponse {
  enabled: boolean;
  user: MeUser | null;
}

/**
 * 导航栏登录态入口。
 * - auth 未启用：显示静态“登录”（网关就绪前的占位）。
 * - 已登录：显示用户名/邮箱 + 退出。
 * - 未登录：显示“登录”，点击跳网关登录页并带回跳。
 */
export function AccountChip() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => (r.status === 401 ? { enabled: true, user: null } : r.json()))
      .then((d: MeResponse) => alive && setMe(d))
      .catch(() => alive && setMe({ enabled: false, user: null }));
    return () => {
      alive = false;
    };
  }, []);

  // 加载中 / auth 未启用：保持原有静态“登录”外观
  if (!me || !me.enabled) {
    return (
      <a href="/api/auth/login" className="hidden text-[0.86rem] text-ink-2 hover:text-ink sm:inline">
        登录
      </a>
    );
  }

  if (!me.user) {
    return (
      <a
        href={loginHref()}
        className="hidden text-[0.86rem] text-ink-2 hover:text-ink sm:inline"
      >
        登录
      </a>
    );
  }

  const label = me.user.name?.trim() || me.user.email || "已登录";
  return (
    <div className="hidden items-center gap-2.5 sm:flex">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-[0.7rem] font-semibold text-brand-deep">
        {label.slice(0, 1).toUpperCase()}
      </span>
      <span className="max-w-[9rem] truncate text-[0.86rem] text-ink" title={me.user.email}>
        {label}
      </span>
      <a href={logoutHref()} className="text-[0.8rem] text-muted hover:text-ink">
        退出
      </a>
    </div>
  );
}

function loginHref(): string {
  if (typeof window === "undefined") return "/api/auth/login";
  return `/api/auth/login?next=${encodeURIComponent(window.location.href)}`;
}

function logoutHref(): string {
  if (typeof window === "undefined") return "/api/auth/logout";
  return `/api/auth/logout?next=${encodeURIComponent(window.location.origin + "/")}`;
}
