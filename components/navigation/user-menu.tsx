"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown, LayoutDashboard, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/actions/auth-actions";

const menuLinkClassName =
  "text-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium outline-none";

export function UserMenu({ userName }: { userName: string }) {
  const initial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <Menu.Root>
      <Menu.Trigger
        className="border-border text-foreground hover:bg-accent focus-visible:outline-ring inline-flex min-h-10 min-w-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`${userName}'s account menu`}
      >
        <span className="bg-secondary text-secondary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
          {initial}
        </span>
        <span className="max-w-36 truncate">{userName}</span>
        <ChevronDown aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8}>
          <Menu.Popup className="border-border bg-popover text-popover-foreground z-50 min-w-52 rounded-xl border p-1.5 shadow-lg outline-none">
            <Menu.LinkItem
              render={<Link href="/profile" />}
              closeOnClick
              className={menuLinkClassName}
            >
              <UserRound aria-hidden="true" className="size-4" />
              My profile
            </Menu.LinkItem>
            <Menu.LinkItem
              render={<Link href="/dashboard" />}
              closeOnClick
              className={menuLinkClassName}
            >
              <LayoutDashboard aria-hidden="true" className="size-4" />
              Dashboard
            </Menu.LinkItem>
            <Menu.LinkItem
              render={<Link href="/settings" />}
              closeOnClick
              className={menuLinkClassName}
            >
              <Settings aria-hidden="true" className="size-4" />
              Settings
            </Menu.LinkItem>
            <Menu.Separator className="bg-border my-1 h-px" />
            <Menu.Item
              onClick={() => {
                void signOutAction();
              }}
              className="text-destructive data-highlighted:bg-destructive/10 flex min-h-10 cursor-default items-center gap-2.5 rounded-lg px-3 text-sm font-medium outline-none"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
