"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";

import { E4Button } from "../components/ui/E4Button";
import { E4Card } from "../components/ui/E4Card";
import { E4PageHeader } from "../components/ui/E4PageHeader";
import { E4Input } from "../components/ui/E4Input";

type ArtistProfile = {
  artist_id: string;
  stage_name: string;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  spotify_url?: string | null;
  apple_music_url?: string | null;
  soundcloud_url?: string | null;
  youtube_url?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  website_url?: string | null;
};

export default function ArtistProfilePage() {
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ---------- LOAD PROFILE FROM API ----------
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/artist/profile", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          console.error("GET /api/artist/profile failed:", res.status);
          // Try to log error body for debugging
          try {
            const errBody = await res.json();
            console.error("Profile API error body:", errBody);
          } catch {
            // ignore
          }

          // Fall back to a minimal profile so the page still renders
          setError(
            "Something went wrong loading your profile. You can still edit and save."
          );

          const fallback: ArtistProfile = {
            artist_id: "unknown",
            stage_name: "Your Artist Name",
            email: session?.user?.email ?? null,
            avatar_url: "",
            bio: "",
            spotify_url: "",
            apple_music_url: "",
            soundcloud_url: "",
            youtube_url: "",
            instagram_handle: "",
            tiktok_handle: "",
            website_url: "",
          };

          setProfile(fallback);
          setLoading(false);
          return; // important: don't try to read res.json() again
        }

        const data = await res.json();
        // data is the profile payload from the API
        const nextProfile: ArtistProfile = {
          artist_id: data.artist_id ?? "—",
          stage_name: data.display_name ?? "New Artist",
          email: data.email ?? session?.user?.email ?? null,
          avatar_url: data.avatar_url ?? "",
          bio: data.bio ?? "",
          spotify_url: data.spotify_url ?? "",
          apple_music_url: data.apple_music_url ?? "",
          soundcloud_url: data.soundcloud_url ?? "",
          youtube_url: data.youtube_url ?? "",
          instagram_handle:
            data.instagram_handle ?? data.instagram ?? "",
          tiktok_handle: data.tiktok_handle ?? "",
          website_url: data.website_url ?? data.website ?? "",
        };

        setProfile(nextProfile);
      } catch (err) {
        console.error(err);
        setError(
          "Something went wrong loading your profile. You can still edit and save."
        );

        const fallback: ArtistProfile = {
          artist_id: "unknown",
          stage_name: "Your Artist Name",
          email: session?.user?.email ?? null,
          avatar_url: "",
          bio: "",
          spotify_url: "",
          apple_music_url: "",
          soundcloud_url: "",
          youtube_url: "",
          instagram_handle: "",
          tiktok_handle: "",
          website_url: "",
        };
        setProfile(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [status, session]);

  const updateField = <K extends keyof ArtistProfile>(
    key: K,
    value: ArtistProfile[K]
  ) => {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  };

  // ---------- SAVE PROFILE TO API ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Map front-end fields → backend snake_case payload
      const payload = {
        display_name: profile.stage_name,
        bio: profile.bio ?? "",
        website: profile.website_url ?? "",
        instagram: profile.instagram_handle ?? "",
        twitter: null,
        avatar_url: profile.avatar_url ?? "",
        // Extras for when the DB supports them
        spotify_url: profile.spotify_url ?? "",
        apple_music_url: profile.apple_music_url ?? "",
        soundcloud_url: profile.soundcloud_url ?? "",
        youtube_url: profile.youtube_url ?? "",
        tiktok_handle: profile.tiktok_handle ?? "",
      };

      const res = await fetch("/api/artist/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("PUT /api/artist/profile failed:", res.status);
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile.");
      }

      const data = await res.json();
      // Optionally refresh state from server response:
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              stage_name: data.display_name ?? prev.stage_name,
              bio: data.bio ?? prev.bio,
              avatar_url: data.avatar_url ?? prev.avatar_url,
              website_url: data.website ?? prev.website_url,
              instagram_handle: data.instagram ?? prev.instagram_handle,
            }
          : prev
      );

      setSuccess("Profile saved successfully.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- AUTH GUARDS ----------
  if (status === "loading") {
    return (
      <main className="max-w-5xl mx-auto py-10 px-4">
        <E4PageHeader
          title="Artist Profile"
          subtitle="Loading your account..."
        />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="max-w-3xl mx-auto py-10 px-4">
        <E4PageHeader
          title="Sign in required"
          subtitle="You need to log in to view your artist profile."
        />
        <div className="mt-6">
          <E4Button className="w-full max-w-xs" onClick={() => signIn()}>
            Go to Sign In
          </E4Button>
        </div>
      </main>
    );
  }

  // ---------- MAIN UI ----------
  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "24px 24px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Page header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#d4af37",
          }}
        >
          E4 Artist Portal
        </p>
        <E4PageHeader
          title="Artist Profile"
          subtitle="Update how you appear across E4 Distro, E4 Records, and E4 Social."
        />
      </div>

      {loading && (
        <p style={{ fontSize: 14, color: "#bbbbbb" }}>Loading your profile…</p>
      )}

      {!loading && error && (
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(248, 113, 113, 0.5)",
            background: "rgba(127, 29, 29, 0.25)",
            padding: "10px 14px",
            fontSize: 13,
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      {!loading && profile && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {success && (
            <div
              style={{
                borderRadius: 10,
                border: "1px solid rgba(16, 185, 129, 0.5)",
                background: "rgba(6, 95, 70, 0.25)",
                padding: "10px 14px",
                fontSize: 13,
                color: "#a7f3d0",
              }}
            >
              {success}
            </div>
          )}

          {/* TOP SECTION: Avatar + identity */}
          <E4Card>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  minWidth: 140,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 96,
                    height: 96,
                    overflow: "hidden",
                    borderRadius: "999px",
                    border: "1px solid var(--gold)",
                    background: "#050505",
                  }}
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.stage_name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.16em",
                        color: "#777",
                      }}
                    >
                      No Photo
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#999",
                    }}
                  >
                    Artist ID
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: "#ddd",
                    }}
                  >
                    {profile.artist_id}
                  </p>
                </div>
              </div>

              {/* Identity fields */}
              <div
                style={{
                  flex: 1,
                  minWidth: 260,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 600 }}>
                    {profile.stage_name || "Your Artist Name"}
                  </h2>
                  {profile.email && (
                    <p style={{ fontSize: 12, color: "#bbbbbb" }}>
                      {profile.email}
                    </p>
                  )}
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "#888888",
                      maxWidth: 520,
                    }}
                  >
                    This information is used for your artist header, statements,
                    and internal E4 communications.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                  }}
                >
                  <E4Input
                    id="stage_name"
                    label="Stage Name"
                    placeholder="Artist / band name"
                    value={profile.stage_name}
                    onChange={(e) =>
                      updateField("stage_name", e.target.value)
                    }
                  />
                  <E4Input
                    id="email"
                    type="email"
                    label="Contact Email"
                    placeholder="you@example.com"
                    value={profile.email ?? ""}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </E4Card>

          {/* BIO SECTION */}
          <E4Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>Artist Bio</h3>
                  <p style={{ fontSize: 12, color: "#aaaaaa" }}>
                    A clear, compelling story that represents your sound,
                    journey, and achievements.
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    borderRadius: 999,
                    border: "1px solid var(--gold)",
                    background: "rgba(212, 175, 55, 0.08)",
                    padding: "4px 10px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "var(--gold)",
                  }}
                >
                  Public facing
                </span>
              </div>

              <textarea
                id="bio"
                style={{
                  marginTop: 4,
                  width: "100%",
                  borderRadius: 8,
                  border: "1px solid #333",
                  background: "#050505",
                  padding: "10px 12px",
                  fontSize: 13,
                  color: "#f5f5f5",
                  outline: "none",
                  resize: "vertical",
                  minHeight: 110,
                }}
                value={profile.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Describe your style, influences, milestones, and what listeners can expect from your music."
              />

              <p style={{ fontSize: 11, color: "#888888" }}>
                Tip: keep this to 3–5 short paragraphs. We’ll reuse it on
                one-sheets, E4 Social, and promo materials.
              </p>
            </div>
          </E4Card>

          {/* PROFILES & LINKS SECTION */}
          <E4Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                    Profiles & Links
                  </h3>
                  <p style={{ fontSize: 12, color: "#aaaaaa" }}>
                    Connect your streaming profiles and social handles so E4
                    can route traffic and promotion to the right places.
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    borderRadius: 999,
                    border: "1px solid #444",
                    background: "#050505",
                    padding: "4px 10px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#dddddd",
                  }}
                >
                  Ecosystem
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 24,
                }}
              >
                {/* Streaming profiles */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#aaaaaa",
                    }}
                  >
                    Streaming Profiles
                  </p>
                  <E4Input
                    id="spotify_url"
                    label="Spotify Artist URL"
                    placeholder="https://open.spotify.com/artist/..."
                    value={profile.spotify_url ?? ""}
                    onChange={(e) =>
                      updateField("spotify_url", e.target.value)
                    }
                  />
                  <E4Input
                    id="apple_music_url"
                    label="Apple Music Artist URL"
                    placeholder="https://music.apple.com/artist/..."
                    value={profile.apple_music_url ?? ""}
                    onChange={(e) =>
                      updateField("apple_music_url", e.target.value)
                    }
                  />
                  <E4Input
                    id="soundcloud_url"
                    label="SoundCloud URL"
                    placeholder="https://soundcloud.com/..."
                    value={profile.soundcloud_url ?? ""}
                    onChange={(e) =>
                      updateField("soundcloud_url", e.target.value)
                    }
                  />
                  <E4Input
                    id="youtube_url"
                    label="YouTube Channel / Artist URL"
                    placeholder="https://youtube.com/..."
                    value={profile.youtube_url ?? ""}
                    onChange={(e) =>
                      updateField("youtube_url", e.target.value)
                    }
                  />
                </div>

                {/* Social + web */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#aaaaaa",
                    }}
                  >
                    Social & Web
                  </p>
                  <E4Input
                    id="instagram_handle"
                    label="Instagram Handle"
                    placeholder="@yourhandle"
                    value={profile.instagram_handle ?? ""}
                    onChange={(e) =>
                      updateField("instagram_handle", e.target.value)
                    }
                  />
                  <E4Input
                    id="tiktok_handle"
                    label="TikTok Handle"
                    placeholder="@yourhandle"
                    value={profile.tiktok_handle ?? ""}
                    onChange={(e) =>
                      updateField("tiktok_handle", e.target.value)
                    }
                  />
                  <E4Input
                    id="website_url"
                    label="Official Website"
                    placeholder="https://your-site.com"
                    value={profile.website_url ?? ""}
                    onChange={(e) =>
                      updateField("website_url", e.target.value)
                    }
                  />
                  <p style={{ fontSize: 11, color: "#888888" }}>
                    These links help E4 Experiences, E4 Agency, and E4 Social
                    tag and feature you correctly in campaigns.
                  </p>
                </div>
              </div>
            </div>
          </E4Card>

          {/* FOOTER ACTIONS */}
          <div
            style={{
              marginTop: 8,
              paddingTop: 14,
              borderTop: "1px solid #222",
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 11,
              color: "#888888",
            }}
          >
            <p>
              Changes here apply across your E4 ecosystem. You can update this
              anytime before or after a release.
            </p>
            <E4Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </E4Button>
          </div>
        </form>
      )}
    </div>
  );
}
