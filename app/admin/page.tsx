"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Shield,
  Trophy,
  Users,
  Plus,
  Trash2,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

type Player = {
  id: string;
  full_name: string;
  roll_number: string | null;
  grade: string | null;
  section: string | null;
  nationality: string | null;
  ovr: number | null;
};

const supabase = createClient();

const rounds = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final",
];

export default function AdminPage() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [nationality, setNationality] = useState("");
  const [ovr, setOvr] = useState("");

  const [addingPlayer, setAddingPlayer] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
  const { data, error } = await supabase.rpc("is_admin");

  if (error) {
    console.error("Admin check failed:", error);
    setIsAdmin(false);
  } else {
    setIsAdmin(data === true);
  }
}

    setSessionLoading(false);
  }

  async function login() {
    setLoginLoading(true);
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    await checkUser();
    setLoginLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }

  async function loadPlayers() {
    setLoadingPlayers(true);

    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("full_name");

    if (error) {
      setError(error.message);
    } else {
      setPlayers(data || []);
    }

    setLoadingPlayers(false);
  }

  useEffect(() => {
    if (isAdmin) {
      loadPlayers();
    }
  }, [isAdmin]);

  async function addPlayer() {
    if (!fullName.trim()) {
      setError("Player name is required.");
      return;
    }

    setAddingPlayer(true);
    setError("");
    setMessage("");

    const { error } = await supabase.from("players").insert({
      full_name: fullName.trim(),
      roll_number: rollNumber.trim() || null,
      grade: grade.trim() || null,
      section: section.trim() || null,
      nationality: nationality.trim() || null,
      ovr: ovr ? Number(ovr) : null,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Player added successfully.");
      setFullName("");
      setRollNumber("");
      setGrade("");
      setSection("");
      setNationality("");
      setOvr("");
      await loadPlayers();
    }

    setAddingPlayer(false);
  }

  async function deletePlayer(id: string) {
    const player = players.find((p) => p.id === id);

    if (!player) return;

    const confirmed = window.confirm(
      `Delete ${player.full_name}? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await supabase.from("players").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Player deleted.");
      await loadPlayers();
    }
  }

  async function generateTournament() {
    if (players.length < 32) {
  setError(
    `The tournament requires at least 32 players. You currently have ${players.length}.`
  );
  return;
}

    const { data: existingTies, error: existingError } = await supabase
      .from("tournament_ties")
      .select("id")
      .limit(1);

    if (existingError) {
      setError(existingError.message);
      return;
    }

    if (existingTies && existingTies.length > 0) {
      setError(
        "A tournament bracket already exists. Delete the existing tournament data before generating a new one."
      );
      return;
    }

    const confirmed = window.confirm(
  `Generate the 32-player knockout bracket?\n\nThe 32 highest-OVR registered players will enter the tournament.`
);

    if (!confirmed) return;

    setGenerating(true);
    setError("");
    setMessage("");

    try {
      const tournamentPlayers = [...players]
  .sort((a, b) => {
    const ovrA = a.ovr ?? -1;
    const ovrB = b.ovr ?? -1;

    if (ovrB !== ovrA) {
      return ovrB - ovrA;
    }

    return a.full_name.localeCompare(b.full_name);
  })
  .slice(0, 32);

const shuffled = tournamentPlayers.sort(() => Math.random() - 0.5);

const slots: (Player | null)[] = [...shuffled];

      const tiesToCreate: {
        round: string;
        bracket_position: number;
        player1_id: string | null;
        player2_id: string | null;
      }[] = [];

      for (let i = 0; i < 16; i++) {
        tiesToCreate.push({
          round: "Round of 32",
          bracket_position: i,
          player1_id: slots[i * 2]?.id || null,
          player2_id: slots[i * 2 + 1]?.id || null,
        });
      }

      for (let i = 0; i < 8; i++) {
        tiesToCreate.push({
          round: "Round of 16",
          bracket_position: i,
          player1_id: null,
          player2_id: null,
        });
      }

      for (let i = 0; i < 4; i++) {
        tiesToCreate.push({
          round: "Quarterfinals",
          bracket_position: i,
          player1_id: null,
          player2_id: null,
        });
      }

      for (let i = 0; i < 2; i++) {
        tiesToCreate.push({
          round: "Semifinals",
          bracket_position: i,
          player1_id: null,
          player2_id: null,
        });
      }

      tiesToCreate.push({
        round: "Final",
        bracket_position: 0,
        player1_id: null,
        player2_id: null,
      });

      const { data: createdTies, error: tieError } = await supabase
        .from("tournament_ties")
        .insert(tiesToCreate)
        .select();

      if (tieError || !createdTies) {
        throw new Error(tieError?.message || "Failed to create bracket.");
      }

      const tieMap = new Map<string, any>();

      for (const tie of createdTies) {
        tieMap.set(`${tie.round}-${tie.bracket_position}`, tie);
      }

      for (const round of rounds.slice(0, -1)) {
        const count =
          round === "Round of 32"
            ? 16
            : round === "Round of 16"
              ? 8
              : round === "Quarterfinals"
                ? 4
                : 2;

        const nextRound = rounds[rounds.indexOf(round) + 1];

        for (let i = 0; i < count; i++) {
          const current = tieMap.get(`${round}-${i}`);
          const next = tieMap.get(`${nextRound}-${Math.floor(i / 2)}`);

          if (current && next) {
            await supabase
              .from("tournament_ties")
              .update({ next_tie_id: next.id })
              .eq("id", current.id);
          }
        }
      }

      const round32 = createdTies.filter(
        (tie) => tie.round === "Round of 32"
      );

      for (const tie of round32) {
        const hasPlayer1 = !!tie.player1_id;
        const hasPlayer2 = !!tie.player2_id;

        if (hasPlayer1 !== hasPlayer2) {
          const winnerId = tie.player1_id || tie.player2_id;

          await supabase
            .from("tournament_ties")
            .update({ winner_id: winnerId })
            .eq("id", tie.id);

          const nextTie = tieMap.get(
            `Round of 16-${Math.floor(tie.bracket_position / 2)}`
          );

          if (nextTie) {
            const updateData =
              tie.bracket_position % 2 === 0
                ? { player1_id: winnerId }
                : { player2_id: winnerId };

            await supabase
              .from("tournament_ties")
              .update(updateData)
              .eq("id", nextTie.id);
          }
        }
      }

      await createInitialMatches(createdTies);

      setMessage(
        "Tournament generated successfully. 32 slots created with 6 byes."
      );
    } catch (err: any) {
      setError(err.message || "Something went wrong.");

      await supabase.from("tournament_ties").delete().neq("id", "");
    }

    setGenerating(false);
  }

  async function createInitialMatches(ties: any[]) {
    const matches = ties
      .filter(
        (tie) =>
          tie.round === "Round of 32" &&
          tie.player1_id &&
          tie.player2_id
      )
      .flatMap((tie) => [
        {
          tie_id: tie.id,
          leg: 1,
          player1_id: tie.player1_id,
          player2_id: tie.player2_id,
          status: "upcoming",
        },
        {
          tie_id: tie.id,
          leg: 2,
          player1_id: tie.player1_id,
          player2_id: tie.player2_id,
          status: "upcoming",
        },
      ]);

    if (matches.length > 0) {
      const { error } = await supabase.from("matches").insert(matches);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  if (sessionLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin text-[#19d46b]" size={24} />
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-[#0b100d] p-8 shadow-2xl"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#19d46b]/10 text-[#19d46b]">
                <Shield size={24} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#19d46b]">
                  Restricted
                </p>
                <h1 className="text-2xl font-bold">Admin Portal</h1>
              </div>
            </div>

            {!user ? (
              <div className="space-y-4">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin email"
                  type="email"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-[#19d46b]/60"
                />

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") login();
                  }}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-[#19d46b]/60"
                />

                {loginError && (
                  <p className="text-sm text-red-400">{loginError}</p>
                )}

                <button
                  onClick={login}
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-[#19d46b] px-4 py-3 font-bold text-black transition hover:bg-[#25e878] disabled:opacity-50"
                >
                  {loginLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-sm text-gray-400">
                  This account is signed in but does not have administrator
                  access.
                </p>

                <button
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 font-semibold hover:bg-white/5"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-white/10 bg-[#050705]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#19d46b]/10 text-[#19d46b]">
              <Trophy size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#19d46b]">
                FC Mobile
              </p>
              <h1 className="font-bold">Admin Portal</h1>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#19d46b]">
            Control Center
          </p>
          <h2 className="text-4xl font-black tracking-tight">
            Tournament management.
          </h2>
          <p className="mt-2 text-gray-500">
            Manage players and create the knockout bracket.
          </p>
        </div>

        {message && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#19d46b]/20 bg-[#19d46b]/5 px-5 py-4 text-sm text-[#65ed9c]">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0b100d] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#19d46b]/10 p-2.5 text-[#19d46b]">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="font-bold">Add player</h3>
                <p className="text-xs text-gray-500">
                  Register a new tournament player
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name *"
                className="admin-input"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Roll number"
                  className="admin-input"
                />
                <input
                  value={ovr}
                  onChange={(e) => setOvr(e.target.value)}
                  placeholder="OVR"
                  type="number"
                  className="admin-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Grade"
                  className="admin-input"
                />
                <input
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="Section"
                  className="admin-input"
                />
              </div>

              <input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Nationality"
                className="admin-input"
              />

              <button
                onClick={addPlayer}
                disabled={addingPlayer}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#19d46b] px-4 py-3 font-bold text-black transition hover:bg-[#25e878] disabled:opacity-50"
              >
                <Plus size={18} />
                {addingPlayer ? "Adding..." : "Add player"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b100d] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#19d46b]/10 p-2.5 text-[#19d46b]">
                  <Trophy size={20} />
                </div>

                <div>
                  <h3 className="font-bold">Tournament generator</h3>
                  <p className="text-xs text-gray-500">
                    Create the 32-slot knockout bracket
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-gray-400">
                {players.length} players
              </span>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
              <div className="grid grid-cols-2 gap-4 text-center">
  <div>
    <p className="text-2xl font-black text-white">32</p>
    <p className="text-xs text-gray-500">Bracket entrants</p>
  </div>

  <div>
    <p className="text-2xl font-black text-[#19d46b]">
      {players.length}
    </p>
    <p className="text-xs text-gray-500">Registered</p>
  </div>
</div>

              <button
                onClick={generateTournament}
                disabled={generating || players.length < 32}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#19d46b]/30 bg-[#19d46b]/10 px-4 py-3 font-bold text-[#19d46b] transition hover:bg-[#19d46b]/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Generating bracket...
                  </>
                ) : (
                  <>
                    <Trophy size={18} />
                    Generate tournament
                  </>
                )}
              </button>

              {players.length !== 32 && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  Add exactly {32 - players.length} more player
                  {32 - players.length === 1 ? "" : "s"} to enable generation.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0b100d] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#19d46b]/10 p-2.5 text-[#19d46b]">
                <Users size={20} />
              </div>

              <div>
                <h3 className="font-bold">Registered players</h3>
                <p className="text-xs text-gray-500">
                  Players currently in the tournament database
                </p>
              </div>
            </div>

            <button
              onClick={loadPlayers}
              className="rounded-xl border border-white/10 p-2.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              <RefreshCw
                size={17}
                className={loadingPlayers ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{player.full_name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {player.grade ? `Grade ${player.grade}` : "No grade"}
                    {player.section ? ` • ${player.section}` : ""}
                    {player.ovr ? ` • OVR ${player.ovr}` : ""}
                  </p>
                </div>

                <button
                  onClick={() => deletePlayer(player.id)}
                  className="ml-3 rounded-lg p-2 text-gray-600 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          {players.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">
              No players registered.
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.3);
          padding: 0.75rem 1rem;
          color: white;
          outline: none;
          transition: border-color 150ms ease;
        }

        .admin-input::placeholder {
          color: #59625c;
        }

        .admin-input:focus {
          border-color: rgba(25, 212, 107, 0.6);
        }
      `}</style>
    </main>
  );
}
