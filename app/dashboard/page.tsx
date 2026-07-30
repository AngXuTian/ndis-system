import { clientService } from "@/services/client.service";
import { providerService } from "@/services/provider.service";
import { invoiceService } from "@/services/invoice.service";
import { rateSetService } from "@/services/rate-set.service";
import { DashboardView, type RecentInvoiceRow } from "@/modules/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [clients, providers, invoices, rateSets, recentInvoices] = await Promise.all([
    clientService.list({ pageSize: 1 }),
    providerService.list({ pageSize: 1 }),
    invoiceService.list({ pageSize: 1 }),
    rateSetService.list({ pageSize: 1 }),
    invoiceService.list({ pageSize: 5 }),
  ]);

  return (
    <DashboardView
      counts={{
        clients: clients.total,
        providers: providers.total,
        invoices: invoices.total,
        rateSets: rateSets.total,
      }}
      recentInvoices={recentInvoices.rows as unknown as RecentInvoiceRow[]}
    />
  );
}