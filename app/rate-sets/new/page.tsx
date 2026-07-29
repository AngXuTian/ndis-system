// app/rate-sets/new/page.tsx
import { RateSetForm } from "@/modules/rate-set/RateSetForm";

export default function NewRateSetPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Add Rate Set</h1>
      <RateSetForm />
    </div>
  );
}