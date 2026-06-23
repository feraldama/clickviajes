"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Receipt, Printer } from "lucide-react";
import { formatFecha, formatMoney, fechaDesdeInput, fechaInputValue, type Currency, type PaymentMethod } from "@clickviajes/shared";
// Las fechas se pasan como Date a las mutaciones; JSON las serializa a ISO y el backend las coacciona.
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS, INSTALLMENT_STATUS_LABELS, INSTALLMENT_STATUS_STYLES } from "@/lib/options";
import { useAccount, useSetInstallments, useCreatePayment, useDeletePayment } from "@/lib/hooks/usePayments";
import type { InstallmentStatus } from "@clickviajes/shared";

export default function CuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: account, isLoading } = useAccount(id);
  const setPlan = useSetInstallments(id);
  const createPayment = useCreatePayment(id);
  const deletePayment = useDeletePayment(id);

  // Generador de plan
  const [count, setCount] = useState("3");
  const [firstDue, setFirstDue] = useState(fechaInputValue(new Date()));
  const [planError, setPlanError] = useState("");

  // Form de pago
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [installmentId, setInstallmentId] = useState("");
  const [paidAt, setPaidAt] = useState(fechaInputValue(new Date()));
  const [payError, setPayError] = useState("");

  const [toDelete, setToDelete] = useState<string | null>(null);

  const cur = (account?.currency ?? "PYG") as Currency;
  const hasPayments = (account?.payments.length ?? 0) > 0;

  function generarPlan() {
    setPlanError("");
    const n = Number(count);
    const first = fechaDesdeInput(firstDue);
    if (!n || n < 1) return setPlanError("Cantidad de cuotas inválida");
    if (!first) return setPlanError("Fecha inicial inválida");
    const total = account?.total ?? 0;
    const dec = cur === "PYG" ? 0 : 2;
    const factor = 10 ** dec;
    const per = Math.floor((total / n) * factor) / factor;
    const installments = Array.from({ length: n }, (_, i) => {
      const d = new Date(first);
      d.setMonth(d.getMonth() + i);
      const amt = i === n - 1 ? Math.round((total - per * (n - 1)) * factor) / factor : per;
      return { dueDate: d, amount: amt };
    });
    setPlan.mutate({ installments });
  }

  function registrarPago(e: React.FormEvent) {
    e.preventDefault();
    setPayError("");
    const monto = Number(amount);
    if (!monto || monto <= 0) return setPayError("Monto inválido");
    const fecha = fechaDesdeInput(paidAt);
    if (!fecha) return setPayError("Fecha inválida");
    createPayment.mutate(
      { amount: monto, method, installmentId: installmentId || null, paidAt: fecha, currency: cur },
      { onSuccess: () => setAmount("") },
    );
  }

  if (isLoading || !account) {
    return (
      <div className="grid place-items-center py-16">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Cargando" />
      </div>
    );
  }

  const installmentOptions = [
    { value: "", label: "General (sin imputar)" },
    ...account.installments.map((i) => ({ value: i.id, label: `Cuota ${i.number} · vence ${formatFecha(i.dueDate)}` })),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/reservas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-fg hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Volver a reservas
      </Link>
      <PageHeader title="Estado de cuenta" description="Cuotas, pagos y saldo de la reserva." />

      {account.incomplete && (
        <p className="mb-4 rounded-btn border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Faltan tasas de cambio para convertir algún pago a la moneda de la reserva; los totales pueden estar incompletos.
        </p>
      )}

      <section className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Total" value={formatMoney(account.total, cur)} />
        <Stat label="Pagado" value={formatMoney(account.paid, cur)} tone="success" />
        <Stat label="Saldo" value={formatMoney(account.balance, cur)} tone={account.balance > 0 ? "danger" : "success"} />
      </section>

      {/* Plan de cuotas */}
      <section className="mb-6 rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-foreground">Plan de cuotas</h2>
        {account.installments.length === 0 ? (
          <p className="mb-4 text-sm text-muted-fg">Aún no hay plan de cuotas. Genera uno dividiendo el total.</p>
        ) : (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Vencimiento</th>
                  <th className="px-3 py-2 font-semibold">Monto</th>
                  <th className="px-3 py-2 font-semibold">Pagado</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {account.installments.map((i) => (
                  <tr key={i.id} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 font-mono text-foreground">{i.number}</td>
                    <td className="px-3 py-2 text-muted-fg">{formatFecha(i.dueDate)}</td>
                    <td className="px-3 py-2 font-mono text-foreground">{formatMoney(i.amount, cur)}</td>
                    <td className="px-3 py-2 font-mono text-muted-fg">{formatMoney(i.paid, cur)}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${INSTALLMENT_STATUS_STYLES[i.status as InstallmentStatus]}`}>{INSTALLMENT_STATUS_LABELS[i.status as InstallmentStatus]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasPayments ? (
          <p className="text-xs text-muted-fg">El plan no se puede modificar porque ya hay pagos registrados.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-28"><Input label="Nº de cuotas" value={count} onChange={(e) => setCount(e.target.value)} inputMode="numeric" /></div>
            <div className="w-44"><Input label="1er vencimiento" type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} /></div>
            <Button type="button" onClick={generarPlan} loading={setPlan.isPending} variant="secondary">Generar plan mensual</Button>
            {planError && <p className="w-full text-sm text-destructive">{planError}</p>}
          </div>
        )}
      </section>

      {/* Registrar pago */}
      <section className="mb-6 rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-foreground">Registrar pago</h2>
        <form onSubmit={registrarPago} className="grid items-end gap-3 sm:grid-cols-5">
          <MoneyInput label="Monto" value={amount} onChange={setAmount} currency={cur} placeholder="0" />
          <Select label="Método" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} />
          <Select label="Imputar a" value={installmentId} onChange={(e) => setInstallmentId(e.target.value)} options={installmentOptions} />
          <Input label="Fecha" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} max={fechaInputValue(new Date())} />
          <Button type="submit" loading={createPayment.isPending}><Plus className="h-4 w-4" /> Registrar</Button>
          {payError && <p className="sm:col-span-5 text-sm text-destructive">{payError}</p>}
        </form>
      </section>

      {/* Pagos */}
      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-foreground">Pagos registrados</h2>
        {account.payments.length === 0 ? (
          <div className="grid place-items-center gap-2 py-8 text-center text-muted-fg">
            <Receipt className="h-8 w-8 opacity-50" />
            <p className="text-sm">Sin pagos aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="px-3 py-2 font-semibold">Recibo</th>
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-3 py-2 font-semibold">Método</th>
                  <th className="px-3 py-2 font-semibold">Monto</th>
                  <th className="px-3 py-2 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {account.payments.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 font-mono text-foreground">{p.receiptNumber ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-fg">{formatFecha(p.paidAt)}</td>
                    <td className="px-3 py-2 text-muted-fg">{PAYMENT_METHOD_LABELS[p.method as PaymentMethod]}</td>
                    <td className="px-3 py-2 font-mono text-foreground">{formatMoney(p.amount, p.currency as Currency)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/recibo/${p.id}`} target="_blank" title="Imprimir recibo" className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-primary/10 hover:text-primary" aria-label="Imprimir recibo"><Printer className="h-4 w-4" /></Link>
                        <button onClick={() => setToDelete(p.id)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-btn text-muted-fg hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar pago"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar pago"
        message="¿Eliminar este pago? Se recalculará el estado de cuenta."
        loading={deletePayment.isPending}
        onConfirm={async () => { if (toDelete) await deletePayment.mutateAsync(toDelete); setToDelete(null); }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  const color = tone === "success" ? "text-success" : tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
      <p className="text-xs text-muted-fg">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
