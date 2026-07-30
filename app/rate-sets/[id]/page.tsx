// app/rate-sets/[id]/page.tsx
import { rateSetService } from "@/services/rate-set.service";
import { RateSetForm } from "@/modules/rate-set/RateSetForm";
import { RateSetImportPanel } from "@/modules/rate-set/RateSetImportPanel";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RateSetDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await rateSetService.get(Number(id));

  if (!result) notFound();
  const { rateSet, summary } = result;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Edit Rate Set — {rateSet.name}</h1>

      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <div className="border rounded p-3 text-center">
          <div className="text-2xl font-semibold">{summary.categories}</div>
          <div className="text-sm text-gray-500">Categories</div>
        </div>
        <div className="border rounded p-3 text-center">
          <div className="text-2xl font-semibold">{summary.supportItems}</div>
          <div className="text-sm text-gray-500">Support Items</div>
        </div>
        <div className="border rounded p-3 text-center">
          <div className="text-2xl font-semibold">{summary.prices}</div>
          <div className="text-sm text-gray-500">Price Entries</div>
        </div>
      </div>

      <RateSetForm
        rateSetId={rateSet.id}
        initialValues={{
          name: rateSet.name,
          description: rateSet.description ?? undefined,
          start_date: rateSet.start_date as unknown as string,
          end_date: rateSet.end_date as unknown as string | null,
        }}
      />

      <RateSetImportPanel rateSetId={rateSet.id} />
    </div>
  );
}