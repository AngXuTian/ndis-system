import { clientService } from "@/services/client.service";
import { ClientForm } from "@/modules/client/ClientForm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await clientService.get(Number(id));

  if (!client) notFound();

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Edit Participant — {client.first_name} {client.last_name}
      </h1>
      <ClientForm
        clientId={client.id}
        initialValues={{
          first_name: client.first_name,
          last_name: client.last_name,
          gender_id: client.gender_id,
          dob: client.dob as unknown as string,
          ndis_number: client.ndis_number,
          email: client.email,
          phone_number: client.phone_number ?? undefined,
          address: client.address,
          unit_building: client.unit_building ?? undefined,
          pricing_region: client.pricing_region,
        }}
      />
    </div>
  );
}
