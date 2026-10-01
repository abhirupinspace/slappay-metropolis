export const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");
export const ts = (s: bigint | number) => new Date(Number(s) * 1000).toLocaleString();
export const conditionLabel = (t: number) => ["Manual approval", "Attestation", "Time"][t] ?? "?";
export const mandateStatus = (s: number) => ["Active", "Released", "Cancelled"][s] ?? "?";
