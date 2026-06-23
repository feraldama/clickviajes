"use client";

import { Select } from "@/components/ui/Select";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useTrips } from "@/lib/hooks/useTrips";

export function CustomerSelect({
  value,
  onChange,
  label = "Cliente",
  error,
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  error?: string;
}) {
  const { data } = useCustomers({ pageSize: 100 });
  const options = [
    { value: "", label: "— Selecciona —" },
    ...(data?.items.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })) ?? []),
  ];
  return <Select label={label} value={value} onChange={(e) => onChange(e.target.value)} options={options} error={error} />;
}

export function TripSelect({
  value,
  onChange,
  label = "Viaje",
  optional = false,
  error,
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  optional?: boolean;
  error?: string;
}) {
  const { data } = useTrips({ pageSize: 100 });
  const options = [
    { value: "", label: optional ? "— Sin viaje —" : "— Selecciona —" },
    ...(data?.items.map((t) => ({ value: t.id, label: t.name })) ?? []),
  ];
  return <Select label={label} value={value} onChange={(e) => onChange(e.target.value)} options={options} error={error} />;
}
