import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LogoutButton } from "./LogoutButton";

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user
    ? (await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } }))?.role
    : null;
  const staff = role === "ADMIN" || role === "REVIEWER";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-bold text-emerald-900">
          ChayilResources
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/browse" className="text-zinc-700 hover:underline">
            Browse
          </Link>
          <Link href="/search" className="text-zinc-700 hover:underline">
            Search
          </Link>
          <Link href="/packs" className="text-zinc-700 hover:underline">
            Packs
          </Link>
          <Link href="/assessments" className="text-zinc-700 hover:underline">
            Assessments
          </Link>
          <Link href="/strategies" className="text-zinc-700 hover:underline">
            Strategies
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="text-zinc-700 hover:underline">
                Dashboard
              </Link>
              <Link href="/my-resources" className="text-zinc-700 hover:underline">
                My resources
              </Link>
              <Link href="/notifications" className="text-zinc-700 hover:underline">
                Notifications
              </Link>
              <Link href="/contribute" className="text-zinc-700 hover:underline">
                Contribute
              </Link>
              {staff && (
                <Link href="/admin" className="text-zinc-700 hover:underline">
                  Admin
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-700 hover:underline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-emerald-800 px-4 py-1.5 font-medium text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
