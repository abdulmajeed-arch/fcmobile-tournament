"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Search, Users, Trophy } from "lucide-react";
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

export default function PlayersPage() {
  const supabase = createClient();

  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayers() {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("ovr", { ascending: false, nullsFirst: false })
        .order("full_name");

      if (!error && data) {
        setPlayers(data);
      }

      setLoading(false);
    }

    loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return players;

    return players.filter((player) =>
      [
        player.full_name,
        player.grade,
        player.section,
        player.nationality,
        player.roll_number,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [players, search]);

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
                <Users size={14} />
                COMPETITORS
              </div>

              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Players
              </h1>

              <p className="mt-3 text-sm text-[#68736b]">
                Every competitor in the FC Mobile Championship.
              </p>
            </div>

            <div className="text-left md:text-right">
              <div className="text-3xl font-black text-white">
                {players.length}
              </div>
              <div className="text-xs font-medium text-[#59635c]">
                REGISTERED PLAYERS
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="relative max-w-xl">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#59635c]"
          />

          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/[0.07] bg-[#0b100d] pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-[#4f5952] focus:border-[#19d46b]/30 focus:ring-2 focus:ring-[#19d46b]/5"
          />
        </div>
      </section>

      {/* Players */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-2xl border border-white/[0.05] bg-[#0b100d]"
              />
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0b100d] py-20 text-center">
            <Users className="mx-auto text-[#3e4841]" size={32} />
            <p className="mt-4 text-sm font-semibold text-[#89938b]">
              No players found
            </p>
            <p className="mt-1 text-xs text-[#59635c]">
              Try another search.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredPlayers.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </section>
    </main>
  );
}

function PlayerCard({
  player,
  index,
}: {
  player: Player;
  index: number;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.025, 0.3),
      }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#19d46b]/20 hover:bg-[#0f150f]"
    >
      {/* OVR */}
      <div className="absolute right-5 top-5 text-right">
        <div className="text-2xl font-black leading-none text-[#19d46b]">
          {player.ovr ?? "—"}
        </div>
        <div className="mt-1 text-[9px] font-bold tracking-[0.15em] text-[#59635c]">
          OVR
        </div>
      </div>

      {/* Avatar */}
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#19d46b]/10 bg-[#19d46b]/[0.06] text-lg font-black text-[#19d46b]">
        {player.full_name
          .split(" ")
          .slice(0, 2)
          .map((name) => name[0])
          .join("")
          .toUpperCase()}
      </div>

      <div className="mt-5 pr-14">
        <h2 className="truncate text-base font-bold text-white">
          {player.full_name}
        </h2>

        <p className="mt-1 text-xs text-[#59635c]">
          {player.grade ?? "Grade —"}
          {player.section ? ` • ${player.section}` : ""}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <div>
          <div className="text-[9px] font-bold tracking-[0.12em] text-[#4f5952]">
            NATIONALITY
          </div>
          <div className="mt-1 text-xs font-semibold text-[#89938b]">
            {player.nationality ?? "—"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[9px] font-bold tracking-[0.12em] text-[#4f5952]">
            ROLL
          </div>
          <div className="mt-1 text-xs font-semibold text-[#89938b]">
            {player.roll_number ?? "—"}
          </div>
        </div>
      </div>

      {/* Hover accent */}
      <div className="absolute bottom-0 left-0 h-px w-0 bg-[#19d46b] transition-all duration-500 group-hover:w-full" />
    </motion.article>
  );
}
