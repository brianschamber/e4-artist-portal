"use client";

import { useEffect, useState } from "react";

import { E4Card } from "../components/ui/E4Card";
import { E4PageHeader } from "../components/ui/E4PageHeader";
import { E4Button } from "../components/ui/E4Button";

type EarningsSummary = {
  totalEarned: number;
  totalPaid: number;
  balanceDue: number;
};

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);

        // For now this is just mocked.
        // Later we can wire it to /api/earnings for real data.
        const fake: EarningsSummary = {
          totalEarned: 0,
          totalPaid: 0,
          balanceDue: 0,
        };

        setSummary(fake);
      } catch (err) {
        console.error(err);
        setError("Failed to load earnings.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <E4PageHeader
        title="Your Earnings"
        subtitle="View your royalties, payouts, and current balance."
      />

      {error && (
        <div
          style={{
            color: "#ff6b6b",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <E4Card>
        {loading ? (
          <p>Loading earnings…</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <div style={{ minWidth: 180 }}>
              <p style={{ fontSize: 12, textTransform: "uppercase", opacity: 0.7 }}>
                Lifetime Earnings
              </p>
              <p style={{ fontSize: 24, fontWeight: 600 }}>
                ${summary?.totalEarned.toFixed(2)}
              </p>
            </div>

            <div style={{ minWidth: 180 }}>
              <p style={{ fontSize: 12, textTransform: "uppercase", opacity: 0.7 }}>
                Total Paid Out
              </p>
              <p style={{ fontSize: 24, fontWeight: 600 }}>
                ${summary?.totalPaid.toFixed(2)}
              </p>
            </div>

            <div style={{ minWidth: 180 }}>
              <p style={{ fontSize: 12, textTransform: "uppercase", opacity: 0.7 }}>
                Current Balance
              </p>
              <p style={{ fontSize: 24, fontWeight: 600 }}>
                ${summary?.balanceDue.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </E4Card>

      <div style={{ marginTop: 24 }}>
        <E4Card>
          <p style={{ marginBottom: 8, fontWeight: 500 }}>
            Detailed earnings breakdown coming soon.
          </p>
          <p style={{ fontSize: 14, color: "#aaa", marginBottom: 12 }}>
            Once your royalty engine is wired up, this page will show payouts by
            release, platform, and date, plus exportable reports.
          </p>

          <E4Button variant="gold" type="button" disabled>
            Export Statement (soon)
          </E4Button>
        </E4Card>
      </div>
    </div>
  );
}
