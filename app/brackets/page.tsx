"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Trophy, Loader2 } from "lucide-react";
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
};

const supabase = createClient();

const rounds = [
  {
    name: "Round of 32",
    short: "R32",
    count: 16,
  },
  {
    name: "Round of 16",
    short: "R16",
    count: 8,
  },
  {
    name: "Quarterfinals",
    short: "QF",
    count: 4,
  },
  {
    name: "Semifinals",
    short: "SF",
    count: 2,
  },
  {
    name: "Final",
    short: "FINAL",
    count: 1,
  },
];

export default function BracketsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [ties, setTies] = useState<Tie[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBracket();
  }, []);

  async function loadBracket() {
    setLoading(true);

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
        .select(
          "id, round, bracket_position, player1_id, player2_id, winner_id"
        )
        .order("bracket_position"),

      supabase.from("matches").select("*"),
    ]);

    if (!playerError && !tieError && !matchError) {
      setPlayers(playerData || []);
      setTies(tieData || []);
      setMatches(matchData || []);
    }

    setLoading(false);
  }

  const playerMap = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players]
  );

  const tiesByRound = useMemo(() => {
    const map = new Map<string, Tie[]>();

    for (const round of rounds) {
      map.set(
        round.name,
        ties
          .filter((tie) => tie.round === round.name)
          .sort((a, b) => a.bracket_position - b.bracket_position)
      );
    }

    return map;
  }, [ties]);

  function getPlayer(id: string | null) {
    return id ? playerMap.get(id) : undefined;
  }

  function getTieMatches(tieId: string) {
    return matches
      .filter((match) => match.tie_id === tieId)
      .sort((a, b) => a.leg - b.leg);
  }

  function getAggregate(tie: Tie, playerId: string) {
    const tieMatches = getTieMatches(tie.id);

    return tieMatches.reduce((total, match) => {
      if (
        match.player1_id === playerId &&
        match.player1_score !== null
      ) {
        return total + match.player1_score;
      }

      if (
        match.player2_id === playerId &&
        match.player2_score !== null
      ) {
        return total + match.player2_score;
      }

      return total;
    }, 0);
  }

  function getLegScore(match: Match | undefined, playerId: string) {
    if (!match) return null;

    if (match.player1_id === playerId) {
      return match.player1_score;
    }

    if (match.player2_id === playerId) {
      return match.player2_score;
    }

    return null;
  }

  function PlayerRow({
    playerId,
    winner,
  }: {
    playerId: string | null;
    winner: boolean;
  }) {
    const player = getPlayer(playerId);

    return (
      <div
        className={`flex min-w-0 items-center justify-between gap-2 px-3 py-2.5 ${
          winner
            ? "bg-[#19d46b]/10 text-[#19d46b]"
            : "text-gray-200"
        }`}
      >
        <div className="min-w-0">
          <p
            className={`truncate text-[12px] font-bold ${
              winner ? "text-[#19d46b]" : "text-gray-200"
            }`}
          >
            {player?.full_name || "TBD"}
          </p>

          {player?.ovr && (
            <p className="mt-0.5 text-[9px] text-gray-600">
              OVR {player.ovr}
            </p>
          )}
        </div>

        {winner && (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#19d46b] text-black">
            <Trophy size={10} />
          </div>
        )}
      </div>
    );
  }

  function TieCard({ tie }: { tie: Tie }) {
    const p1 = getPlayer(tie.player1_id);
    const p2 = getPlayer(tie.player2_id);

    const tieMatches = getTieMatches(tie.id);

    const leg1 = tieMatches.find((match) => match.leg === 1);
    const leg2 = tieMatches.find((match) => match.leg === 2);

    const p1Aggregate = tie.player1_id
      ? getAggregate(tie, tie.player1_id)
      : 0;

    const p2Aggregate = tie.player2_id
      ? getAggregate(tie, tie.player2_id)
      : 0;

    const completed =
      !!leg1?.winner_id &&
      !!leg2?.winner_id;

    return (
      <div
        className={`relative w-[235px] overflow-hidden rounded-xl border bg-[#0b100d] shadow-lg ${
          tie.winner_id
            ? "border-[#19d46b]/25"
            : "border-white/[0.08]"
        }`}
      >
        <PlayerRow
          playerId={tie.player1_id}
          winner={tie.winner_id === tie.player1_id}
        />

        <div className="border-y border-white/[0.06]" />

        <PlayerRow
          playerId={tie.player2_id}
          winner={tie.winner_id === tie.player2_id}
        />

        {(tieMatches.length > 0 || tie.winner_id) && (
          <div className="border-t border-white/[0.06] bg-black/20 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600">
                Aggregate
              </span>

              <span className="text-xs font-black text-white">
                {p1Aggregate} — {p2Aggregate}
              </span>
            </div>

            {tieMatches.length > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-[9px] text-gray-600">
                <span>
                  L1{" "}
                  {getLegScore(
                    leg1,
                    tie.player1_id || ""
                  ) ?? "—"}{" "}
                  -{" "}
                  {getLegScore(
                    leg1,
                    tie.player2_id || ""
                  ) ?? "—"}
                </span>

                <span>
                  L2{" "}
                  {getLegScore(
                    leg2,
                    tie.player1_id || ""
                  ) ?? "—"}{" "}
                  -{" "}
                  {getLegScore(
                    leg2,
                    tie.player2_id || ""
                  ) ?? "—"}
                </span>
              </div>
            )}
          </div>
        )}

        {tie.winner_id && (
          <div className="border-t border-[#19d46b]/10 bg-[#19d46b]/5 px-3 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-[#19d46b]">
            Advanced
          </div>
        )}

        {!p1 && !p2 && (
          <div className="border-t border-white/[0.06] px-3 py-1.5 text-center text-[9px] text-gray-700">
            Waiting for previous round
          </div>
        )}

        {completed && !tie.winner_id && (
          <div className="border-t border-yellow-500/10 px-3 py-1.5 text-center text-[9px] text-yellow-600">
            Awaiting result
          </div>
        )}
      </div>
    );
  }

  function RoundColumn({
    round,
    roundIndex,
  }: {
    round: (typeof rounds)[number];
    roundIndex: number;
  }) {
    const roundTies = tiesByRound.get(round.name) || [];

    const placeholderCount =
      ties.length === 0 ? round.count : round.count;

    const items =
      roundTies.length > 0
        ? roundTies
        : Array.from({ length: placeholderCount }).map(
            (_, index) => ({
              id: `placeholder-${round.name}-${index}`,
              round: round.name,
              bracket_position: index,
              player1_id: null,
              player2_id: null,
              winner_id: null,
            })
          );

    return (
      <div className="flex min-w-[235px] flex-1 flex-col">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#19d46b]">
            {round.short}
          </p>
          <h2 className="mt-1 text-sm font-bold text-white">
            {round.name}
          </h2>
        </div>

        <div
          className="relative flex flex-1 flex-col justify-around gap-4"
          style={{
            minHeight: `${Math.max(760, round.count * 95)}px`,
          }}
        >
          {items.map((tie, index) => (
            <motion.div
              key={tie.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: roundIndex * 0.08 + index * 0.025,
              }}
              className="relative"
            >
              <TieCard tie={tie} />

              {roundIndex < rounds.length - 1 && (
                <>
                  <div className="absolute left-full top-1/2 h-px w-6 bg-white/10" />

                  {index % 2 === 0 && (
                    <div
                      className="absolute left-[calc(100%+24px)] top-1/2 w-px bg-white/10"
                      style={{
                        height: "calc(100% + 1rem)",
                      }}
                    />
                  )}
                </>
              )}

              {roundIndex > 0 && (
                <div className="absolute right-full top-1/2 h-px w-6 bg-white/10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050705]">
        <Loader2
          className="animate-spin text-[#19d46b]"
          size={28}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050705]">
      <nav className="border-b border-white/[0.08] bg-[#050705]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#19d46b]/10 text-[#19d46b]">
              <Trophy size={20} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#19d46b]">
                FC Mobile
              </p>
              <p className="font-bold">Championship</p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-gray-500 md:flex">
            <Link
              href="/players"
              className="transition hover:text-white"
            >
              Players
            </Link>

            <Link
              href="/matches"
              className="transition hover:text-white"
            >
              Matches
            </Link>

            <Link
              href="/brackets"
              className="font-semibold text-white"
            >
              Brackets
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1700px] px-6 py-10">
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#19d46b]">
            Knockout Stage
          </p>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                The Road to Glory
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                Follow every two-leg tie from the Round of 32
                all the way to the championship final.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-gray-500">
              <span className="h-2 w-2 rounded-full bg-[#19d46b]" />
              2 legs per tie
            </div>
          </div>
        </div>

        {ties.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#0b100d] py-24 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#19d46b]/10 text-[#19d46b]">
              <Trophy size={25} />
            </div>

            <h2 className="text-xl font-bold">
              Bracket not generated yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              The knockout bracket will appear here once the
              tournament administrator generates it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-white/[0.08] bg-[#080c09] p-6 pb-8 shadow-2xl">
            <div className="min-w-[1390px]">
              <div className="flex items-stretch gap-8">
                {rounds.map((round, index) => (
                  <RoundColumn
                    key={round.name}
                    round={round}
                    roundIndex={index}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          <span>Aggregate score shown</span>
          <span>•</span>
          <span>Winner advances</span>
          <span>•</span>
          <span>Two legs per tie</span>
        </div>
      </div>
    </main>
  );
}
