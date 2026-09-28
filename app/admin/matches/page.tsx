"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  LogOut,
  RefreshCw,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Player = {
  id: string;
  full_name: string;
  ovr: number | null;
};

type Tie = {
  id: string;
  round: string;
  bracket_position: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  next_tie_id: string | null;
};

type Match = {
  id: string;
  tie_id: string;
  leg: number;
  player1_id: string;
  player2_id: string;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  status: string;
  played_at: string | null;
};

const supabase = createClient();

const rounds = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final",
];

export default function AdminMatchesPage() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [ties, setTies] = useState<Tie[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [selectedRound, setSelectedRound] = useState("Round of 32");
  const [saving, setSaving] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("is_admin");

    if (error || data !== true) {
      setLoading(false);
      return;
    }

    setAdmin(true);
    await loadData();
    setLoading(false);
  }

  async function loadData() {
    const [
      { data: playerData, error: playerError },
      { data: tieData, error: tieError },
      { data: matchData, error: matchError },
    ] = await Promise.all([
      supabase
        .from("players")
        .select("id, full_name, ovr")
        .order("full_name"),

      supabase
        .from("tournament_ties")
        .select("*")
        .order("bracket_position"),

      supabase
        .from("matches")
        .select("*")
        .order("leg"),
    ]);

    if (playerError || tieError || matchError) {
      setError(
        playerError?.message ||
          tieError?.message ||
          matchError?.message ||
          "Failed to load tournament."
      );
      return;
    }

    setPlayers(playerData || []);
    setTies(tieData || []);
    setMatches(matchData || []);
  }

  const playerMap = useMemo(() => {
    return new Map(players.map((player) => [player.id, player]));
  }, [players]);

  const visibleTies = ties
    .filter((tie) => tie.round === selectedRound)
    .sort((a, b) => a.bracket_position - b.bracket_position);

  function getPlayer(id: string | null) {
    return id ? playerMap.get(id) : undefined;
  }

  function getMatchesForTie(tieId: string) {
    return matches
      .filter((match) => match.tie_id === tieId)
      .sort((a, b) => a.leg - b.leg);
  }

  function updateLocalMatch(
    matchId: string,
    field: "player1_score" | "player2_score" | "winner_id",
    value: number | string | null
  ) {
    setMatches((current) =>
      current.map((match) =>
        match.id === matchId ? { ...match, [field]: value } : match
      )
    );
  }

  async function saveMatch(match: Match) {
    setSaving(match.id);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("matches")
      .update({
        player1_score: match.player1_score,
        player2_score: match.player2_score,
        winner_id: match.winner_id,
        status: match.winner_id ? "completed" : "upcoming",
        played_at: match.winner_id ? new Date().toISOString() : null,
      })
      .eq("id", match.id);

    if (error) {
      setError(error.message);
    } else {
      setMessage(`Leg ${match.leg} saved.`);
      await loadData();
    }

    setSaving(null);
  }

  async function completeTie(tie: Tie) {
    const tieMatches = getMatchesForTie(tie.id);

    if (tieMatches.length !== 2) {
      setError("This tie does not have both legs created yet.");
      return;
    }

    const leg1 = tieMatches.find((m) => m.leg === 1);
    const leg2 = tieMatches.find((m) => m.leg === 2);

    if (!leg1 || !leg2) {
      setError("Both legs are required.");
      return;
    }

    if (!leg1.winner_id || !leg2.winner_id) {
      setError("Record the winner of both legs first.");
      return;
    }

    const p1 = tie.player1_id;
    const p2 = tie.player2_id;

    if (!p1 || !p2) {
      setError("This tie does not have two players.");
      return;
    }

    let tieWinner: string | null = null;

    const p1LegWins =
      (leg1.winner_id === p1 ? 1 : 0) + (leg2.winner_id === p1 ? 1 : 0);

    const p2LegWins =
      (leg1.winner_id === p2 ? 1 : 0) + (leg2.winner_id === p2 ? 1 : 0);

    if (p1LegWins > p2LegWins) {
      tieWinner = p1;
    } else if (p2LegWins > p1LegWins) {
      tieWinner = p2;
    } else {
      const p1Goals =
        (leg1.player1_id === p1
          ? leg1.player1_score || 0
          : leg1.player2_score || 0) +
        (leg2.player1_id === p1
          ? leg2.player1_score || 0
          : leg2.player2_score || 0);

      const p2Goals =
        (leg1.player1_id === p2
          ? leg1.player1_score || 0
          : leg1.player2_score || 0) +
        (leg2.player1_id === p2
          ? leg2.player1_score || 0
          : leg2.player2_score || 0);

      if (p1Goals > p2Goals) {
        tieWinner = p1;
      } else if (p2Goals > p1Goals) {
        tieWinner = p2;
      }
    }

    if (!tieWinner) {
      setError(
        "The tie is level. Resolve the tie-break and choose the advancing player."
      );
      return;
    }

    await advanceWinner(tie, tieWinner);
  }

  async function advanceWinner(tie: Tie, winnerId: string) {
    setSaving(tie.id);
    setError("");
    setMessage("");

    const { error: winnerError } = await supabase
      .from("tournament_ties")
      .update({ winner_id: winnerId })
      .eq("id", tie.id);

    if (winnerError) {
      setError(winnerError.message);
      setSaving(null);
      return;
    }

    if (!tie.next_tie_id) {
      setMessage("Final completed. Tournament winner recorded.");
      await loadData();
      setSaving(null);
      return;
    }

    const { data: nextTie, error: nextError } = await supabase
      .from("tournament_ties")
      .select("*")
      .eq("id", tie.next_tie_id)
      .single();

    if (nextError || !nextTie) {
      setError(nextError?.message || "Could not find the next tie.");
      setSaving(null);
      return;
    }

    const slot =
      tie.bracket_position % 2 === 0 ? "player1_id" : "player2_id";

    const { error: updateNextError } = await supabase
      .from("tournament_ties")
      .update({ [slot]: winnerId })
      .eq("id", nextTie.id);

    if (updateNextError) {
      setError(updateNextError.message);
      setSaving(null);
      return;
    }

    const updatedNextTie = {
      ...nextTie,
      [slot]: winnerId,
    };

    const otherPlayer =
      slot === "player1_id"
        ? updatedNextTie.player2_id
        : updatedNextTie.player1_id;

    if (otherPlayer) {
      const { data: existingMatches } = await supabase
        .from("matches")
        .select("id")
        .eq("tie_id", nextTie.id);

      if (!existingMatches || existingMatches.length === 0) {
        const { error: matchError } = await supabase.from("matches").insert([
          {
            tie_id: nextTie.id,
            leg: 1,
            player1_id: updatedNextTie.player1_id,
            player2_id: updatedNextTie.player2_id,
            status: "upcoming",
          },
          {
            tie_id: nextTie.id,
            leg: 2,
            player1_id: updatedNextTie.player1_id,
            player2_id: updatedNextTie.player2_id,
            status: "upcoming",
          },
        ]);

        if (matchError) {
          setError(matchError.message);
          setSaving(null);
          return;
        }
      }
    }

    setMessage(
      `${getPlayer(winnerId)?.full_name || "Winner"} advanced to ${getNextRound(tie.round)}.`
    );

    await loadData();
    setSaving(null);
  }

  function getNextRound(round: string) {
    const index = rounds.indexOf(round);
    return rounds[index + 1] || "the next stage";
  }

  async function forceAdvance(tie: Tie) {
    if (tie.player1_id && !tie.player2_id) {
      await advanceWinner(tie, tie.player1_id);
      return;
    }

    if (tie.player2_id && !tie.player1_id) {
      await advanceWinner(tie, tie.player2_id);
      return;
    }

    setError("This tie does not have a bye.");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#19d46b]" size={28} />
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg font-bold">Administrator access required.</p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-sm text-[#19d46b]"
          >
            Return to admin
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-white/10 bg-[#050705]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#19d46b]/10 text-[#19d46b]">
              <Trophy size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#19d46b]">
                FC Mobile
              </p>
              <h1 className="font-bold">Match Control</h1>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#19d46b]">
            Match Control
          </p>
          <h2 className="text-4xl font-black tracking-tight">
            Run the tournament.
          </h2>
          <p className="mt-2 text-gray-500">
            Record both legs and advance winners through the bracket.
          </p>
        </div>

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#19d46b]/20 bg-[#19d46b]/5 px-5 py-4 text-sm text-[#65ed9c]">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {rounds.map((round) => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                selectedRound === round
                  ? "bg-[#19d46b] text-black"
                  : "border border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {round}
            </button>
          ))}
        </div>

        {ties.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0b100d] py-20 text-center">
            <Trophy
              size={34}
              className="mx-auto mb-4 text-gray-700"
            />
            <h3 className="font-bold">No tournament generated</h3>
            <p className="mt-2 text-sm text-gray-500">
              Generate the tournament from the admin dashboard first.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleTies.map((tie, index) => {
              const p1 = getPlayer(tie.player1_id);
              const p2 = getPlayer(tie.player2_id);
              const tieMatches = getMatchesForTie(tie.id);
              const hasBye =
                (!!tie.player1_id && !tie.player2_id) ||
                (!tie.player1_id && !!tie.player2_id);

              return (
                <motion.div
                  key={tie.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-3xl border border-white/10 bg-[#0b100d] p-5"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#19d46b]">
                        {tie.round}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Tie {tie.bracket_position + 1}
                      </p>
                    </div>

                    {tie.winner_id && (
                      <span className="flex items-center gap-1.5 rounded-full bg-[#19d46b]/10 px-3 py-1.5 text-xs font-bold text-[#19d46b]">
                        <CheckCircle2 size={14} />
                        Advanced
                      </span>
                    )}
                  </div>

                  <div className="mb-5 rounded-2xl border border-white/5 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate font-bold ${
                            tie.winner_id === p1?.id
                              ? "text-[#19d46b]"
                              : ""
                          }`}
                        >
                          {p1?.full_name || "TBD"}
                        </p>
                        {p1?.ovr && (
                          <p className="mt-1 text-xs text-gray-500">
                            OVR {p1.ovr}
                          </p>
                        )}
                      </div>

                      <span className="text-xs font-black text-gray-700">
                        VS
                      </span>

                      <div className="min-w-0 flex-1 text-right">
                        <p
                          className={`truncate font-bold ${
                            tie.winner_id === p2?.id
                              ? "text-[#19d46b]"
                              : ""
                          }`}
                        >
                          {p2?.full_name || "TBD"}
                        </p>
                        {p2?.ovr && (
                          <p className="mt-1 text-xs text-gray-500">
                            OVR {p2.ovr}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasBye ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-[#19d46b]/20 bg-[#19d46b]/5 p-4 text-center text-sm text-[#65ed9c]">
                        Bye — this player advances automatically.
                      </div>

                      {!tie.winner_id && (
                        <button
                          onClick={() => forceAdvance(tie)}
                          disabled={saving === tie.id}
                          className="w-full rounded-xl bg-[#19d46b] px-4 py-3 font-bold text-black transition hover:bg-[#25e878] disabled:opacity-50"
                        >
                          {saving === tie.id
                            ? "Advancing..."
                            : "Advance player"}
                        </button>
                      )}
                    </div>
                  ) : tie.player1_id && tie.player2_id ? (
                    <div className="space-y-4">
                      {[1, 2].map((leg) => {
                        const match = tieMatches.find(
                          (m) => m.leg === leg
                        );

                        if (!match) {
                          return (
                            <div
                              key={leg}
                              className="rounded-2xl border border-yellow-500/10 bg-yellow-500/5 p-4 text-sm text-yellow-500"
                            >
                              Leg {leg} has not been created.
                            </div>
                          );
                        }

                        const matchP1 = getPlayer(match.player1_id);
                        const matchP2 = getPlayer(match.player2_id);

                        return (
                          <div
                            key={match.id}
                            className="rounded-2xl border border-white/5 bg-black/20 p-4"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Leg {leg}
                              </span>

                              <span
                                className={`text-xs font-semibold ${
                                  match.status === "completed"
                                    ? "text-[#19d46b]"
                                    : "text-gray-600"
                                }`}
                              >
                                {match.status === "completed"
                                  ? "Completed"
                                  : "Upcoming"}
                              </span>
                            </div>

                            <div className="grid grid-cols-[1fr_70px_1fr] items-center gap-3">
                              <p className="truncate text-sm font-semibold">
                                {matchP1?.full_name || "Player 1"}
                              </p>

                              <input
                                type="number"
                                min="0"
                                value={match.player1_score ?? ""}
                                onChange={(e) =>
                                  updateLocalMatch(
                                    match.id,
                                    "player1_score",
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value)
                                  )
                                }
                                className="w-full rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-center text-lg font-black outline-none focus:border-[#19d46b]/50"
                              />

                              <p className="truncate text-right text-sm font-semibold">
                                {matchP2?.full_name || "Player 2"}
                              </p>
                            </div>

                            <div className="mt-4">
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                                Winner
                              </label>

                              <div className="relative">
                                <select
                                  value={match.winner_id || ""}
                                  onChange={(e) =>
                                    updateLocalMatch(
                                      match.id,
                                      "winner_id",
                                      e.target.value || null
                                    )
                                  }
                                  className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#19d46b]/50"
                                >
                                  <option value="">Select winner</option>
                                  <option value={match.player1_id}>
                                    {matchP1?.full_name}
                                  </option>
                                  <option value={match.player2_id}>
                                    {matchP2?.full_name}
                                  </option>
                                </select>

                                <ChevronDown
                                  size={16}
                                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => saveMatch(match)}
                              disabled={saving === match.id}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                            >
                              {saving === match.id && (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              )}
                              Save leg {leg}
                            </button>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => completeTie(tie)}
                        disabled={
                          saving === tie.id ||
                          !!tie.winner_id ||
                          tieMatches.length !== 2
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#19d46b] px-4 py-3 font-bold text-black transition hover:bg-[#25e878] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving === tie.id && (
                          <Loader2 size={17} className="animate-spin" />
                        )}
                        <Trophy size={17} />
                        {tie.winner_id
                          ? "Winner advanced"
                          : "Complete tie & advance winner"}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center text-sm text-gray-600">
                      Waiting for the previous round.
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={async () => {
              setError("");
              setMessage("");
              await loadData();
            }}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <RefreshCw size={16} />
            Refresh tournament
          </button>
        </div>
      </div>
    </main>
  );
}
