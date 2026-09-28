"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Trophy,
  Users,
  Swords,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Players", href: "/players" },
  { label: "Matches", href: "/matches" },
  { label: "Brackets", href: "/brackets" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050705]">
      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/[0.06]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#19d46b] text-black transition-transform duration-300 group-hover:rotate-6">
              <Trophy size={20} strokeWidth={2.5} />
            </div>

            <div>
              <div className="text-sm font-black tracking-[0.18em] text-white">
                FC MOBILE
              </div>
              <div className="text-[10px] font-semibold tracking-[0.2em] text-[#19d46b]">
                CHAMPIONSHIP
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-[#89938b] transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:border-[#19d46b]/30 hover:bg-[#19d46b]/10"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute left-1/2 top-[-300px] h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-[#19d46b]/[0.08] blur-[130px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-10 lg:pb-32 lg:pt-32">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#19d46b]/20 bg-[#19d46b]/[0.06] px-3.5 py-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#19d46b] shadow-[0_0_10px_#19d46b]" />
              <span className="text-xs font-semibold tracking-wide text-[#a8b2ab]">
                TOURNAMENT 2026
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="text-6xl font-black leading-[0.95] tracking-[-0.05em] text-white sm:text-7xl lg:text-[100px]"
            >
              THE ROAD
              <br />
              <span className="text-[#19d46b]">TO GLORY.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 max-w-xl text-base leading-7 text-[#89938b] sm:text-lg"
            >
              Follow every matchup, result and knockout battle as players
              compete for the FC Mobile Championship.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link
                href="/brackets"
                className="group flex items-center gap-2 rounded-xl bg-[#19d46b] px-5 py-3.5 text-sm font-bold text-black transition-all hover:bg-[#25e57a] hover:shadow-[0_0_30px_rgba(25,212,107,0.18)]"
              >
                View Bracket
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/matches"
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
              >
                View Matches
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06] bg-[#080c09]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/[0.06] px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">
          <Stat
            icon={<Users size={20} />}
            value="26"
            label="Players"
          />

          <Stat
            icon={<Swords size={20} />}
            value="RO32"
            label="Current Round"
          />

          <Stat
            icon={<Trophy size={20} />}
            value="2"
            label="Legs Per Tie"
          />
        </div>
      </section>

      {/* Tournament section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#19d46b]">
              TOURNAMENT
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything in one place.
            </h2>
          </div>

          <Link
            href="/brackets"
            className="group flex items-center gap-1 text-sm font-semibold text-[#89938b] transition-colors hover:text-white"
          >
            Open bracket
            <ChevronRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Feature
            number="01"
            title="Players"
            description="Browse every competitor taking part in the championship."
            href="/players"
          />

          <Feature
            number="02"
            title="Matches"
            description="See every result across both legs of each knockout tie."
            href="/matches"
          />

          <Feature
            number="03"
            title="Brackets"
            description="Track the entire road from Round of 32 to the final."
            href="/brackets"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
          <p className="text-xs text-[#59635c]">
            FC Mobile Championship
          </p>

          <p className="text-xs text-[#59635c]">
            2026
          </p>
        </div>
      </footer>
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 px-0 py-7 sm:px-8 sm:py-8">
      <div className="text-[#19d46b]">{icon}</div>

      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="mt-0.5 text-xs font-medium text-[#59635c]">
          {label}
        </div>
      </div>
    </div>
  );
}

function Feature({
  number,
  title,
  description,
  href,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#19d46b]/20 hover:bg-[#101711]"
    >
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-[#19d46b]/[0.05] blur-2xl transition-all group-hover:bg-[#19d46b]/[0.1]" />

      <div className="relative">
        <span className="text-xs font-bold tracking-widest text-[#19d46b]">
          {number}
        </span>

        <h3 className="mt-8 text-xl font-bold text-white">{title}</h3>

        <p className="mt-3 max-w-sm text-sm leading-6 text-[#6f7a72]">
          {description}
        </p>

        <div className="mt-8 flex items-center gap-1 text-xs font-bold text-[#89938b] transition-colors group-hover:text-[#19d46b]">
          Explore
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}