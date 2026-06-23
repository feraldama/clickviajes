import type { AccountStatement, Currency, InstallmentPlanInput, PaymentInput } from "@clickviajes/shared";
import { Prisma, type InstallmentStatus } from "@prisma/client";
import { prisma, prismaBase } from "../../lib/prisma.js";
import { currentTenantId, getTenantContext } from "../../lib/tenant-context.js";
import { buildConverter, getRate } from "../../lib/currency.js";
import { AppError } from "../../utils/app-error.js";

async function getBookingOwned(bookingId: string) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound("Reserva no encontrada");
  return booking;
}

async function getBaseCurrency(tenantId: string): Promise<Currency> {
  const tenant = await prismaBase.tenant.findUnique({ where: { id: tenantId } });
  return (tenant?.baseCurrency ?? "PYG") as Currency;
}

/** Recalcula el estado (PAID/PARTIAL/OVERDUE/PENDING) de cada cuota de la reserva. */
async function recomputeInstallmentStatuses(bookingId: string) {
  const [installments, payments] = await Promise.all([
    prisma.installment.findMany({ where: { bookingId } }),
    prisma.payment.findMany({ where: { bookingId } }),
  ]);
  const conv = await buildConverter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const inst of installments) {
    let paid = new Prisma.Decimal(0);
    for (const p of payments.filter((x) => x.installmentId === inst.id)) {
      const c = conv(p.amount, p.currency as Currency, inst.currency as Currency);
      if (c) paid = paid.plus(c);
    }
    let status: InstallmentStatus;
    if (paid.greaterThanOrEqualTo(inst.amount)) status = "PAID";
    else if (inst.dueDate < today) status = "OVERDUE";
    else if (paid.greaterThan(0)) status = "PARTIAL";
    else status = "PENDING";
    if (status !== inst.status) {
      await prisma.installment.update({ where: { id: inst.id }, data: { status } });
    }
  }
}

export async function getAccount(bookingId: string): Promise<AccountStatement> {
  const booking = await getBookingOwned(bookingId);
  const [installments, payments] = await Promise.all([
    prisma.installment.findMany({ where: { bookingId }, orderBy: { number: "asc" } }),
    prisma.payment.findMany({ where: { bookingId }, orderBy: { paidAt: "asc" } }),
  ]);
  const bookingCurrency = booking.currency as Currency;
  const conv = await buildConverter();
  let incomplete = false;

  let paidTotal = new Prisma.Decimal(0);
  for (const p of payments) {
    const c = conv(p.amount, p.currency as Currency, bookingCurrency);
    if (c === null) incomplete = true;
    else paidTotal = paidTotal.plus(c);
  }

  const installmentsOut = installments.map((inst) => {
    let paidInst = new Prisma.Decimal(0);
    for (const p of payments.filter((x) => x.installmentId === inst.id)) {
      const c = conv(p.amount, p.currency as Currency, inst.currency as Currency);
      if (c === null) incomplete = true;
      else paidInst = paidInst.plus(c);
    }
    return {
      id: inst.id,
      number: inst.number,
      dueDate: inst.dueDate.toISOString(),
      amount: inst.amount.toString(),
      currency: inst.currency,
      status: inst.status,
      paid: paidInst.toNumber(),
    };
  });

  const total = Number(booking.totalAmount);
  const paid = paidTotal.toNumber();
  return {
    bookingId,
    currency: bookingCurrency,
    total,
    paid,
    balance: total - paid,
    incomplete,
    installments: installmentsOut,
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      currency: p.currency,
      method: p.method,
      paidAt: p.paidAt.toISOString(),
      receiptNumber: p.receiptNumber,
      installmentId: p.installmentId,
    })),
  };
}

export async function setInstallments(bookingId: string, plan: InstallmentPlanInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");
  const booking = await getBookingOwned(bookingId);

  const payCount = await prisma.payment.count({ where: { bookingId } });
  if (payCount > 0) throw AppError.conflict("No se puede cambiar el plan: ya hay pagos registrados");

  await prisma.$transaction(async (tx) => {
    await tx.installment.deleteMany({ where: { bookingId, tenantId } });
    let n = 1;
    for (const it of plan.installments) {
      await tx.installment.create({
        data: {
          tenantId,
          bookingId,
          number: n++,
          dueDate: it.dueDate,
          amount: it.amount,
          currency: booking.currency,
          status: "PENDING",
        },
      });
    }
  });
  await recomputeInstallmentStatuses(bookingId);
  return getAccount(bookingId);
}

export async function createPayment(bookingId: string, input: PaymentInput) {
  const tenantId = currentTenantId();
  const userId = getTenantContext()?.userId;
  if (!tenantId || !userId) throw AppError.unauthorized("Sin contexto de agencia/usuario");
  const booking = await getBookingOwned(bookingId);
  const currency = (input.currency ?? booking.currency) as Currency;

  if (input.installmentId) {
    const ok = await prisma.installment.count({ where: { id: input.installmentId, bookingId } });
    if (ok === 0) throw AppError.badRequest("La cuota no pertenece a la reserva");
  }

  // Tasa a moneda base "congelada" al momento del pago (reproducibilidad).
  const baseCurrency = await getBaseCurrency(tenantId);
  const rate = await getRate(currency, baseCurrency, input.paidAt ?? new Date());

  // Nº de recibo correlativo si no se provee.
  let receiptNumber = input.receiptNumber?.trim() || null;
  if (!receiptNumber) {
    const count = await prisma.payment.count();
    receiptNumber = `R-${String(count + 1).padStart(6, "0")}`;
  }

  const payment = await prisma.payment.create({
    data: {
      tenantId,
      bookingId,
      installmentId: input.installmentId || null,
      amount: input.amount,
      currency,
      rateToBase: rate ?? null,
      method: input.method,
      paidAt: input.paidAt ?? new Date(),
      receiptNumber,
      receivedById: userId,
    },
  });
  await recomputeInstallmentStatuses(bookingId);
  return payment;
}

export async function deletePayment(id: string) {
  const payment = await prisma.payment.findFirst({ where: { id } });
  if (!payment) throw AppError.notFound("Pago no encontrado");
  await prisma.payment.delete({ where: { id } });
  await recomputeInstallmentStatuses(payment.bookingId);
}
