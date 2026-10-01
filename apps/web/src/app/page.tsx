import { Gate } from "@/components/Gate";
import { IntentFlow } from "@/components/IntentFlow";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tell money what to do.</h1>
        <p className="mt-1 text-neutral-600">Describe a payment in plain English. Slappay turns it into an enforceable instruction on Monad.</p>
      </div>
      <Gate>
        <IntentFlow />
      </Gate>
    </div>
  );
}
