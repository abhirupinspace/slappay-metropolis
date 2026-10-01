"use client";

import Link from "next/link";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { EarningCard } from "@/components/dashboard/EarningCard";
import { RulesCard } from "@/components/dashboard/RulesCard";
import { SmartAccountCard } from "@/components/dashboard/SmartAccountCard";
import { SpendingCard } from "@/components/dashboard/SpendingCard";
import { Icon } from "@/components/ui";
import { mockAccount, mockActivity, mockEarning, mockSmartAccounts, mockSpendingToday } from "@/lib/mock";

// Layout only. Every card takes plain props; integration replaces the mock* imports with hooks.
export default function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <BalanceCard account={mockAccount} />
        <RulesCard accounts={mockSmartAccounts} committed={mockAccount.committed} />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-bold">Smart accounts</h2>
          <Link href="/" className="flex items-center gap-1 text-xs font-semibold text-forest"><Icon name="plus" className="size-3.5" /> What should your money do?</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mockSmartAccounts.map((a) => <SmartAccountCard key={`${a.kind}-${a.id}`} a={a} />)}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <SpendingCard {...mockSpendingToday} />
        <EarningCard {...mockEarning} />
        <ActivityCard items={mockActivity} />
      </div>
    </div>
  );
}
