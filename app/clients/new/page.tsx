import { ClientForm } from "@/modules/client/ClientForm";

export default function NewClientPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Add Participant</h1>
      <ClientForm />
    </div>
  );
}
