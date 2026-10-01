"use client";

import { motion } from "motion/react";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { EarningCard } from "@/components/dashboard/EarningCard";
import { RulesCard } from "@/components/dashboard/RulesCard";
import { SpendingCard } from "@/components/dashboard/SpendingCard";
import { stagger } from "@/components/motion";
import { mockAccount, mockActivity, mockEarning, mockSmartAccounts, mockSpendingToday } from "@/lib/mock";

// Five boxes fill the canvas: 7+5 on top, 4+4+4 below. Mock data until integration.
export default function Dashboard() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid gap-4 lg:h-[calc(100svh-5.5rem)] lg:min-h-[640px] lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_minmax(0,1.05fr)]"
    >
      <div className="lg:col-span-7"><BalanceCard account={mockAccount} /></div>
      <div className="lg:col-span-5"><RulesCard accounts={mockSmartAccounts} committed={mockAccount.committed} /></div>
      <div className="lg:col-span-4"><SpendingCard {...mockSpendingToday} /></div>
      <div className="lg:col-span-4"><EarningCard {...mockEarning} /></div>
      <div className="lg:col-span-4"><ActivityCard items={mockActivity} /></div>
    </motion.div>
  );
}
