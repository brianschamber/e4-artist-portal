"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

import { E4Card } from "../components/ui/E4Card";
import { E4PageHeader } from "../components/ui/E4PageHeader";
import { E4Button } from "../components/ui/E4Button";

type DashboardStats = {
  releasesCount: number;
  tracksCount: number;
  pendingPayouts: number;
  totalEarnings: number;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats when authenticated
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        setError(null);

        const res = await fetch("/api/dashboard");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load dashboard.");

        setStats(data);
      } catch (err: any) {
        setError(err.message || "Error loading dashboard.");
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [status]);

  const displayName =
    (session as any)?.user?.display_name || session?.user?.name || "Artist";

  // Loading
  if (status === "loading") {
    return (
      <main className="max-w-5xl mx-auto py-10 px-4">
        <E4PageHeader
          title="Artist Dashboard"
          subtitle="Loading your account..."
        />
      </main>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <main className="max-w-3xl mx-auto py-10 px-4">
        <E4PageHeader
          title="Sign in required"
          subtitle="You need to log in to view your artist dashboard."
        />
        <div className="mt-6">
          <E4Button
            className="w-full max-w-xs"
            onClick={() => signIn()}
          >
            Go to Sign In
          </E4Button>
        </div>
      </main>
    );
  }

  // Dashboard
  return (
    <main className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <E4PageHeader
        title="Artist Dashboard"
        subtitle={`Welcome back, ${displayName}`}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* New Release */}
        <E4Card>
          <div>
            <h3 className="text-lg font-semibold mb-2">New Release</h3>
            <p className="text-sm text-muted-foreground">
              Upload a single or album and get it ready for distribution.
            </p>

            <Link
              href="/releases/new"
              style={{ display: "inline-block", marginTop: "24px" }}
            >
              <E4Button className="w-full">Create Release</E4Button>
            </Link>
          </div>
        </E4Card>

        {/* Manage Catalog */}
        <E4Card>
          <div>
            <h3 className="text-lg font-semibold mb-2">Manage Catalog</h3>
            <p className="text-sm text-muted-foreground">
              View and edit your existing releases and tracks.
            </p>

            <Link
              href="/releases"
              style={{ display: "inline-block", marginTop: "24px" }}
            >
              <E4Button variant="outline" className="w-full">
                View Releases
              </E4Button>
            </Link>
          </div>
        </E4Card>

        {/* Account & Profile */}
        <E4Card>
          <div>
            <h3 className="text-lg font-semibold mb-2">Account & Profile</h3>
            <p className="text-sm text-muted-foreground">
              Update your artist profile, links, and account details.
            </p>

            <Link
              href="/settings"
              style={{ display: "inline-block", marginTop: "24px" }}
            >
              <E4Button variant="outline" className="w-full">
                Artist Settings
              </E4Button>
            </Link>
          </div>
        </E4Card>
      </section>

      {/* Stats */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Overview</h2>

        <div className="grid gap-4 md:grid-cols-4">
          <E4Card>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Releases
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loadingStats ? "…" : stats?.releasesCount ?? 0}
            </p>
          </E4Card>

          <E4Card>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tracks
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loadingStats ? "…" : stats?.tracksCount ?? 0}
            </p>
          </E4Card>

          <E4Card>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Pending Payouts
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loadingStats ? "…" : `$${(stats?.pendingPayouts ?? 0).toFixed(
                2
              )}`}
            </p>
          </E4Card>

          <E4Card>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Lifetime Earnings
            </p>
            <p className="mt-2 text-2xl font-bold">
              {loadingStats ? "…" : `$${(stats?.totalEarnings ?? 0).toFixed(
                2
              )}`}
            </p>
          </E4Card>
        </div>
      </section>
    </main>
  );
}
