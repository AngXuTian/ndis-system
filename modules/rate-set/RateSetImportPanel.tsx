// modules/rate-set/RateSetImportPanel.tsx
"use client";

import { useState } from "react";
import { Upload, Button, message, Descriptions, Alert } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useRouter } from "next/navigation";

interface ImportSummary {
  processedSheets: string[];
  skippedSheets: string[];
  categories: { inserted: number; updated: number; reactivated: number; deactivated: number };
  supportItems: { inserted: number; updated: number; reactivated: number; deactivated: number };
  attributes: { inserted: number; updated: number };
  prices: { inserted: number; updated: number; deleted: number; unchanged: number };
}

export function RateSetImportPanel({ rateSetId }: { rateSetId: number }) {
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const router = useRouter();

  const props: UploadProps = {
    accept: ".xlsx",
    maxCount: 1,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      setUploading(true);
      setSummary(null);
      try {
        const formData = new FormData();
        formData.append("file", file as File);

        const res = await fetch(`/api/rate-sets/${rateSetId}/import`, {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (!res.ok) {
          message.error(json.error?.message ?? "Import failed");
          onError?.(new Error(json.error?.message ?? "Import failed"));
          return;
        }

        setSummary(json.data);
        message.success("Import completed");
        onSuccess?.(json.data);
        router.refresh();
      } catch (err) {
        onError?.(err as Error);
        message.error("Import failed");
      } finally {
        setUploading(false);
      }
    },
  };

  return (
    <div className="border rounded p-4 bg-gray-50">
      <h3 className="font-medium mb-2">Upload NDIS Excel Pricing File</h3>
      <Upload {...props}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          Select .xlsx file
        </Button>
      </Upload>

      {summary && (
        <div className="mt-4 space-y-3">
          {summary.skippedSheets.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`Skipped non-catalogue sheets: ${summary.skippedSheets.join(", ")}`}
            />
          )}
          <Alert type="success" showIcon message={`Processed sheets: ${summary.processedSheets.join(", ")}`} />

          <Descriptions title="Categories" size="small" column={4} bordered>
            <Descriptions.Item label="Inserted">{summary.categories.inserted}</Descriptions.Item>
            <Descriptions.Item label="Updated">{summary.categories.updated}</Descriptions.Item>
            <Descriptions.Item label="Reactivated">{summary.categories.reactivated}</Descriptions.Item>
            <Descriptions.Item label="Deactivated">{summary.categories.deactivated}</Descriptions.Item>
          </Descriptions>

          <Descriptions title="Support Items" size="small" column={4} bordered>
            <Descriptions.Item label="Inserted">{summary.supportItems.inserted}</Descriptions.Item>
            <Descriptions.Item label="Updated">{summary.supportItems.updated}</Descriptions.Item>
            <Descriptions.Item label="Reactivated">{summary.supportItems.reactivated}</Descriptions.Item>
            <Descriptions.Item label="Deactivated">{summary.supportItems.deactivated}</Descriptions.Item>
          </Descriptions>

          <Descriptions title="Prices" size="small" column={4} bordered>
            <Descriptions.Item label="Inserted">{summary.prices.inserted}</Descriptions.Item>
            <Descriptions.Item label="Updated">{summary.prices.updated}</Descriptions.Item>
            <Descriptions.Item label="Deleted">{summary.prices.deleted}</Descriptions.Item>
            <Descriptions.Item label="Unchanged">{summary.prices.unchanged}</Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </div>
  );
}