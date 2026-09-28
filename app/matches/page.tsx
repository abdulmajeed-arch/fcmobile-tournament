"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock,
  Swords,
  Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

type Player = {
  id: string;
  full_name: string;
  ovr: number | null;
};

type Match = {
  id: string;
  leg: number;
  player1_id: string | null;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  status: "upcoming" | "completed";
  played_at: string | null;
  tie_id: string;
  tournament_ties: {
    round: string;
    bracket_position: number;
  } | null;
};

type MatchWithPlayers = Match & {
  player1: Player | null;
  player2: Player | null;
};

const rounds = [
  "All Rounds",
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final",
];

export default function MatchesPage() {
  const supabase = createClient();

  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [round, setRound] = useState("All Rounds");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          leg,
          player1_id,
          player2_id,
          player1_score,
          player2_score,
          status,
          played_at,
          tie_id,
          tournament_ties (
            round,
            bracket_position
          )
        `)
        .order("played_at", { ascending: false, nullsFirst: false });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const playerIds = Array.from(
        new Set(
          data.flatMap((match) =>
            [match.player1_id, match.player2_id].filter(Boolean)
          )
        )
      );

      let players: Player[] = [];

      if (playerIds.length > 0) {
        const { data: playerData } = await supabase
          .from("players")
          .select("id, full_name, ovr")
          .in("id", playerIds);

        players = playerData ?? [];
      }

      const playerMap = new Map(players.map((player) => [player.id, player]));

      const formatted = data.map((match) => ({
        ...match,
        tournament_ties: Array.isArray(match.tournament_ties)
          ? match.tournament_ties[0] ?? null
          : match.tournament_ties,
        player1: match.player1_id
          ? playerMap.get(match.player1_id) ?? null
          : null,
        player2: match.player2_id
          ? playerMap.get(match.player2_id) ?? null
          : null,
      }));

      setMatches(formatted as MatchWithPlayers[]);
      setLoading(false);
    }

    loadMatches();
  }, []);

  const filteredMatches = useMemo(() => {
    if (round === "All Rounds") return matches;

    return matches.filter(
      (match) => match.tournament_ties?.round === round
    );
  }, [matches, round]);

  const upcoming = filteredMatches.filter(
    (match) => match.status === "upcoming"
  );

  const completed = filteredMatches.filter(
    (match) => match.status === "completed"
  );

  return (
    <main className="min-h-screen bg-[#050705] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#68736b] transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back home
          </Link>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#19d46b]">
                <Swords size={14} />
                MATCH CENTRE
              </div>

              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Matches
              </h1>

              <p className="mt-3 text-sm text-[#68736b]">
                Every battle on the road to the championship.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <Stat value={completed.length.toString()} label="COMPLETED" />
              <div className="h-9 w-px bg-white/[0.07]" />
              <Stat value={upcoming.length.toString()} label="UPCOMING" />
            </div>
          </div>
        </div>
      </header>

      {/* Filter */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="relative w-full max-w-xs">
          <select
            value={round}
            onChange={(e) => setRound(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#0b100d] px-4 pr-10 text-sm font-medium text-[#c1c9c3] outline-none transition-colors focus:border-[#19d46b]/30"
          >
            {rounds.map((item) => (
              <option key={item} value={item} className="bg-[#0b100d]">
                {item}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#59635c]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-white/[0.05] bg-[#0b100d]"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {upcoming.length > 0 && (
              <MatchSection
                title="Upcoming"
                icon={<Clock size={15} />}
                matches={upcoming}
              />
            )}

            {completed.length > 0 && (
              <MatchSection
                title="Completed"
                icon={<Trophy size={15} />}
                matches={completed}
              />
            )}

            {upcoming.length === 0 && completed.length === 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0b100d] py-24 text-center">
                <Swords
                  size={32}
                  className="mx-auto text-[#3e4841]"
                />
                <h2 className="mt-4 text-sm font-bold text-[#89938b]">
                  No matches yet
                </h2>
                <p className="mt-1 text-xs text-[#59635c]">
                  Matches will appear here once the tournament begins.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function MatchSection({
  title,
  icon,
  matches,
}: {
  title: string;
  icon: React.ReactNode;
  matches: MatchWithPlayers[];
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[#19d46b]">
        {icon}
        {title.toUpperCase()}
      </div>

      <div className="space-y-3">
        {matches.map((match, index) => (
          <MatchCard key={match.id} match={match} index={index} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  index,
}: {
  match: MatchWithPlayers;
  index: number;
}) {
  const player1 = match.player1;
  const player2 = match.player2;

  const player1Won =
    match.status === "completed" &&
    match.player1_score !== null &&
    match.player2_score !== null &&
    match.player1_score > match.player2_score;

  const player2Won =
    match.status === "completed" &&
    match.player1_score !== null &&
    match.player2_score !== null &&
    match.player2_score > match.player1_score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] transition-all duration-300 hover:border-white/[0.12] hover:bg-[#0e130f]"
    >
      <div className="flex flex-col md:flex-row md:items-center">
        {/* Round */}
        <div className="border-b border-white/[0.06] px-5 py-4 md:w-44 md:border-b-0 md:border-r">
          <div className="text-[9px] font-bold tracking-[0.16em] text-[#59635c]">
            {match.tournament_ties?.round ?? "Tournament"}
          </div>

          <div className="mt-1 text-xs font-semibold text-[#89938b]">
            LEG {match.leg}
          </div>
        </div>

        {/* Players */}
        <div className="flex-1 px-5 py-5">
          <PlayerRow
            name={player1?.full_name ?? "TBD"}
            ovr={player1?.ovr}
            score={match.player1_score}
            winner={player1Won}
          />

          <div className="my-3 h-px bg-white/[0.05]" />

          <PlayerRow
            name={player2?.full_name ?? "TBD"}
            ovr={player2?.ovr}
            score={match.player2_score}
            winner={player2Won}
          />
        </div>

        {/* Date / status */}
        <div className="border-t border-white/[0.06] px-5 py-4 md:w-48 md:border-l md:border-t-0">
          {match.status === "completed" ? (
            <div className="flex items-center gap-2 text-xs font-bold text-[#19d46b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#19d46b]" />
              COMPLETED
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-[#89938b]">
              <Clock size={13} />
              UPCOMING
            </div>
          )}

          {match.played_at && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#59635c]">
              <CalendarDays size={12} />
              {new Date(match.played_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PlayerRow({
  name,
  ovr,
  score,
  winner,
}: {
  name: string;
  ovr: number | null | undefined;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#19d46b]/[0.06] text-xs font-black text-[#19d46b]">
          {name === "TBD"
            ? "?"
            : name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
        </div>

        <div className="min-w-0">
          <div
            className={`truncate text-sm font-bold ${
              winner ? "text-[#19d46b]" : "text-white"
            }`}
          >
            {name}
          </div>

          {ovr !== null && ovr !== undefined && (
            <div className="text-[10px] text-[#59635c]">
              OVR {ovr}
            </div>
          )}
        </div>
      </div>

      <div
        className={`ml-4 text-xl font-black ${
          score !== null
            ? winner
              ? "text-[#19d46b]"
              : "text-[#89938b]"
            : "text-[#3e4841]"
        }`}
      >
        {score ?? "—"}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-black text-white">{value}</div>
      <div className="mt-0.5 text-[9px] font-bold tracking-[0.14em] text-[#59635c]">
        {label}
      </div>
    </div>
  );
}
