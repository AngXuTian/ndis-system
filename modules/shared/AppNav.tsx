"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  ShopOutlined,
  FileTextOutlined,
  DollarOutlined,
} from "@ant-design/icons";

const { Header } = Layout;

const NAV_ITEMS = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/clients", icon: <TeamOutlined />, label: "Participants" },
  { key: "/providers", icon: <ShopOutlined />, label: "Providers" },
  { key: "/invoices", icon: <FileTextOutlined />, label: "Invoices" },
  { key: "/rate-sets", icon: <DollarOutlined />, label: "Rate Sets" },
];

export function AppNav() {
  const pathname = usePathname();

  const selectedKey =
    NAV_ITEMS.find((item) => pathname.startsWith(item.key))?.key ?? "/dashboard";

  return (
    <Header className="flex items-center" style={{ paddingInline: 24 }}>
      <div className="text-white font-semibold text-base mr-8 whitespace-nowrap">
        My NDIS Portal
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[selectedKey]}
        style={{ flex: 1, minWidth: 0 }}
        items={NAV_ITEMS.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: <Link href={item.key}>{item.label}</Link>,
        }))}
      />
    </Header>
  );
}