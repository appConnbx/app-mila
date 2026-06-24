"use client";

import { useState } from "react";
import { inputCbx } from "./_ui";

function gen() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Campo de senha visível com gerador — o operador vê e repassa a senha. */
export function PasswordField({
  id,
  name = "password",
  placeholder = "Senha",
}: { id?: string; name?: string; placeholder?: string }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <input
        id={id}
        name={name}
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        required
        minLength={6}
        className={inputCbx}
      />
      <button
        type="button"
        onClick={() => setV(gen())}
        className="shrink-0 rounded-lg border border-white/10 px-3 text-sm text-slate-300 transition hover:bg-white/10"
      >
        Gerar
      </button>
    </div>
  );
}
