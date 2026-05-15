"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function AuthCard() {
  const { configured, loading, user, error, signIn, signUp, signOut, clearError } =
    useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);

  if (!configured) {
    return (
      <Card>
        <h3 className="section-title">云同步账号</h3>
        <p className="mt-1 text-xs muted">
          未配置 Supabase, 当前为纯本地模式。在 <code>.env.local</code> 设置{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> 和{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 后即可启用云同步。
        </p>
      </Card>
    );
  }

  if (user) {
    return (
      <Card>
        <h3 className="section-title">云同步账号</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="pill bg-brand-100 text-brand-700">已登录</span>
          <span className="break-all text-ink-soft">{user.email}</span>
        </div>
        <div className="mt-3">
          <Button variant="ghost" onClick={signOut}>
            登出
          </Button>
        </div>
      </Card>
    );
  }

  const submit = async () => {
    setInfo(null);
    clearError();
    if (!email.trim() || !password) return;
    const ok =
      mode === "signIn"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    if (ok && mode === "signUp") {
      setInfo("注册请求已发送。如果你的 Supabase 项目开启了邮箱验证, 请到邮箱点击确认链接后再登录。");
    }
  };

  return (
    <Card>
      <h3 className="section-title">云同步账号</h3>
      <p className="mt-1 text-xs muted">
        登录后,你可以在另一台设备(电脑/手机)用同一账号下载学习进度。
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          variant={mode === "signIn" ? "primary" : "soft"}
          onClick={() => setMode("signIn")}
        >
          登录
        </Button>
        <Button
          variant={mode === "signUp" ? "primary" : "soft"}
          onClick={() => setMode("signUp")}
        >
          注册
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          className="input"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          className="input"
          placeholder="密码 (至少 6 位)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
        />
        <Button onClick={submit} disabled={loading}>
          {loading ? "处理中..." : mode === "signIn" ? "登录" : "创建账号"}
        </Button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg bg-accent-rose/10 p-2 text-xs text-accent-rose">
          ✗ {error}
        </div>
      ) : null}
      {info ? (
        <div className="mt-3 rounded-lg bg-brand-50 p-2 text-xs text-brand-700">
          {info}
        </div>
      ) : null}
    </Card>
  );
}
