import { ProviderForm } from "@/modules/provider/ProviderForm";

export default function NewProviderPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Add Provider</h1>
      <ProviderForm />
    </div>
  );
}