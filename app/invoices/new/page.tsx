import { InvoiceForm } from "@/modules/invoice/InvoiceForm";

export default function NewInvoicePage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Add Invoice</h1>
      <InvoiceForm />
    </div>
  );
}