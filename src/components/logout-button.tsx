"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[18px] font-bold text-[#EEEEEE] hover:bg-white/5 cursor-pointer transition-colors text-left"
    >
      <LogOut className="h-5 w-5 shrink-0" />
      <span>Log out</span>
    </button>
  );
}