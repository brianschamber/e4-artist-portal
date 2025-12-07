"use client";

import { useEffect, useState, FormEvent } from "react";

import { E4Card } from "../components/ui/E4Card";
import { E4PageHeader } from "../components/ui/E4PageHeader";
import { E4Input } from "../components/ui/E4Input";
import { E4Button } from "../components/ui/E4Button";

type ArtistProfile = {
  artist_id: string;
  display_name: string | null;
  bio: string | null;
  genre: string | null;
  instagram: string | null;
  twitter: string | null;
  website: string | null;
  avatar_url: string | null;
  // optional fields we can show in Account Info if the API returns them
  email?: string | null;
  role?: string | null;
};

export default function SettingsPage() {
  // Artist profile state
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  // Derive account info from profile (if backend sends it)
  const email = profile?.email ?? "";
  const artistId = profile?.artist_id ?? "";
  const role = profile?.role ?? "artist";

  // Load artist profile from API (backend can figure out who you are from cookies)
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoadingProfile(true);
        const res = await fetch("/api/account/profile");
        const data = await res.json();

        if (data.ok && data.profile) {
          // allow nulls from backend but keep state typed
          const p = data.profile as ArtistProfile;
          setProfile({
            ...p,
            display_name: p.display_name ?? "",
            bio: p.bio ?? "",
            genre: p.genre ?? "",
            instagram: p.instagram ?? "",
            twitter: p.twitter ?? "",
            website: p.website ?? "",
            avatar_url: p.avatar_url ?? "",
            email: p.email ?? "",
            role: p.role ?? "artist",
          });
        } else {
          console.error("Profile load error:", data);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, []);

  // Save artist profile
  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profile.display_name ?? "",
          bio: profile.bio ?? "",
          genre: profile.genre ?? "",
          instagram: profile.instagram ?? "",
          twitter: profile.twitter ?? "",
          website: profile.website ?? "",
          avatarUrl: profile.avatar_url ?? "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.error("Save profile error:", data);
        setProfileMessage(
          "Something went wrong while saving your artist profile."
        );
      } else {
        setProfileMessage("Artist profile saved.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setProfileMessage(
        "Something went wrong while saving your artist profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  // Change password
  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters.");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setPasswordMessage(data.error || "Unable to change password.");
      } else {
        setPasswordMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordMessage("Something went wrong while changing your password.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div>
      <E4PageHeader
        title="Account Settings"
        subtitle="Manage your E4 Artist Portal account and artist profile."
      />

      {/* Account Info */}
      <div style={{ marginBottom: 24 }}>
        <E4Card>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Account Info</h2>
          <p style={{ margin: "4px 0" }}>
            <strong>Email:</strong> {email || "—"}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Artist ID:</strong> {artistId || "—"}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Role:</strong> {role || "artist"}
          </p>
        </E4Card>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Artist Profile */}
        <div style={{ flex: "2 1 360px" }}>
          <E4Card>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Artist Profile</h2>
            {loadingProfile && <div>Loading artist profile…</div>}
            {!loadingProfile && !profile && (
              <div>No artist profile found for this account.</div>
            )}

            {!loadingProfile && profile && (
              <form
                onSubmit={handleProfileSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <label
                    style={{ display: "block", marginBottom: 4, fontSize: 14 }}
                  >
                    Display Name
                  </label>
                  <E4Input
                    value={profile.display_name ?? ""}
                    onChange={(e) =>
                      setProfile({ ...profile, display_name: e.target.value })
                    }
                    placeholder="Artist or project name"
                  />
                </div>

                <div>
                  <label
                    style={{ display: "block", marginBottom: 4, fontSize: 14 }}
                  >
                    Bio
                  </label>
                  <textarea
                    value={profile.bio ?? ""} // <- key fix: never null
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows={4}
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      border: "1px solid #333",
                      background: "#000",
                      color: "#fff",
                      padding: "10px 12px",
                      fontFamily: "inherit",
                      fontSize: 14,
                    }}
                    placeholder="Tell fans who you are, vibes, story, etc."
                  />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ flex: "1 1 220px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 14,
                      }}
                    >
                      Genre / Style
                    </label>
                    <E4Input
                      value={profile.genre ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, genre: e.target.value })
                      }
                      placeholder="Hip-Hop, R&B, EDM…"
                    />
                  </div>

                  <div style={{ flex: "1 1 220px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 14,
                      }}
                    >
                      Website
                    </label>
                    <E4Input
                      value={profile.website ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, website: e.target.value })
                      }
                      placeholder="https://…"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ flex: "1 1 220px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 14,
                      }}
                    >
                      Instagram
                    </label>
                    <E4Input
                      value={profile.instagram ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, instagram: e.target.value })
                      }
                      placeholder="@handle or URL"
                    />
                  </div>

                  <div style={{ flex: "1 1 220px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 14,
                      }}
                    >
                      Twitter / X
                    </label>
                    <E4Input
                      value={profile.twitter ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, twitter: e.target.value })
                      }
                      placeholder="@handle or URL"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{ display: "block", marginBottom: 4, fontSize: 14 }}
                  >
                    Avatar Image URL
                  </label>
                  <E4Input
                    value={profile.avatar_url ?? ""}
                    onChange={(e) =>
                      setProfile({ ...profile, avatar_url: e.target.value })
                    }
                    placeholder="https://…"
                  />
                </div>

                {profileMessage && (
                  <div
                    style={{
                      fontSize: 13,
                      color:
                        profileMessage === "Artist profile saved."
                          ? "#8fda8f"
                          : "#ff9999",
                    }}
                  >
                    {profileMessage}
                  </div>
                )}

                <div>
                  <E4Button type="submit" variant="gold" disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Save Profile"}
                  </E4Button>
                </div>
              </form>
            )}
          </E4Card>
        </div>

        {/* Change Password */}
        <div style={{ flex: "1 1 280px" }}>
          <E4Card>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Change Password</h2>
            <form
              onSubmit={handlePasswordSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div>
                <label
                  style={{ display: "block", marginBottom: 4, fontSize: 14 }}
                >
                  Current Password
                </label>
                <E4Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 4, fontSize: 14 }}
                >
                  New Password
                </label>
                <E4Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{ display: "block", marginBottom: 4, fontSize: 14 }}
                >
                  Confirm New Password
                </label>
                <E4Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordMessage && (
                <div
                  style={{
                    fontSize: 13,
                    color:
                      passwordMessage === "Password updated successfully."
                        ? "#8fda8f"
                        : "#ff9999",
                  }}
                >
                  {passwordMessage}
                </div>
              )}

              <div>
                <E4Button
                  type="submit"
                  variant="gold"
                  disabled={changingPassword}
                >
                  {changingPassword ? "Updating…" : "Update Password"}
                </E4Button>
              </div>
            </form>
          </E4Card>
        </div>
      </div>
    </div>
  );
}
