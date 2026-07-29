import { providerService } from "@/modules/provider/provider.service";
import { ProviderForm } from "@/modules/provider/ProviderForm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProviderDetailPage({ params }: Props) {
  const { id } = await params;
  const provider = await providerService.get(Number(id));

  if (!provider) notFound();

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Provider — {provider.name}</h1>
      <ProviderForm
        providerId={provider.id}
        initialValues={{
          abn: provider.abn,
          name: provider.name,
          email: provider.email ?? undefined,
          phone_number: provider.phone_number ?? undefined,
          address: provider.address ?? undefined,
          unit_building: provider.unit_building ?? undefined,
        }}
      />
    </div>
  );
}