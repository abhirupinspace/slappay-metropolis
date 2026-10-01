"use client";

import { motion } from "motion/react";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { EarningCard } from "@/components/dashboard/EarningCard";
import { RulesCard } from "@/components/dashboard/RulesCard";
import { SpendingCard } from "@/components/dashboard/SpendingCard";
import { Gate } from "@/components/Gate";
import { stagger } from "@/components/motion";
import { mandateCall } from "@/lib/actions";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useTx } from "@/lib/hooks/useTx";

export default function Dashboard() {
  return (
    <Gate>
      <Overview />
    </Gate>
  );
}

// Five boxes fill the canvas: 7+5 on top, 4+4+4 below. All data from chain reads (useDashboard).
function Overview() {
  const d = useDashboard();
  const tx = useTx();
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid gap-4 lg:h-[calc(100svh-5.5rem)] lg:min-h-[640px] lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_minmax(0,1.05fr)]"
    >
      <div className="lg:col-span-7"><BalanceCard committed={d.committed} /></div>
      <div className="lg:col-span-5"><RulesCard accounts={d.accounts} committed={d.committed} /></div>
      <div className="lg:col-span-4"><SpendingCard {...d.spending} /></div>
      <div className="lg:col-span-4"><EarningCard {...d.earning} /></div>
      <div className="lg:col-span-4">
        <ActivityCard
          items={d.activity}
          loading={d.isLoading}
          tx={tx}
          onApprove={(id) => tx.run([mandateCall("approve", id)], "mandate_approve")}
          onDecline={(id) => tx.run([mandateCall("cancel", id)], "mandate_cancel")}
        />
      </div>
    </motion.div>
  );
}
