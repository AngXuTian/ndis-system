import { invoiceService } from "@/services/invoice.service";
import { InvoiceForm } from "@/modules/invoice/InvoiceForm";
import { notFound } from "next/navigation";
import dayjs from "dayjs";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await invoiceService.get(Number(id));

  if (!result) notFound();
  const { invoice, items } = result;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Edit Invoice — {invoice.invoice_number ?? "(draft)"}
      </h1>
      <InvoiceForm
        invoiceId={invoice.id}
        initialValues={{
          client_id: invoice.client_id ?? undefined,
          provider_id: invoice.provider_id ?? undefined,
          invoice_number: invoice.invoice_number ?? undefined,
          invoice_date: invoice.invoice_date ? dayjs(invoice.invoice_date as unknown as string) : undefined,
          expected_amount: invoice.expected_amount ? Number(invoice.expected_amount) : undefined,
          items: items.map((item) => ({
            rate_set_id: item.rate_set_id ?? undefined,
            category_id: item.category_id ?? undefined,
            support_item_id: item.support_item_id ?? undefined,
            start_date: item.start_date ? dayjs(item.start_date as unknown as string) : undefined,
            end_date: item.end_date ? dayjs(item.end_date as unknown as string) : undefined,
            unit: item.unit ? Number(item.unit) : undefined,
            input_rate: item.input_rate ? Number(item.input_rate) : undefined,
          })),
        }}
      />
    </div>
  );
}