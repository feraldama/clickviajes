import type { AgendaEvent, DocumentType } from "@clickviajes/shared";
import { prisma } from "../../lib/prisma.js";

const DOC_LABELS: Record<DocumentType, string> = {
  PASSPORT: "pasaporte",
  VISA: "visa",
  ID_CARD: "cédula/DNI",
  OTHER: "documento",
};

/**
 * Agrega en una sola agenda los eventos del rango [from, to] del tenant:
 *  - Salidas de viajes (startDate)
 *  - Vencimientos de cuotas (dueDate)
 *  - Vencimientos de documentos de clientes (expiryDate)
 */
export async function getAgenda(from: Date, to: Date): Promise<AgendaEvent[]> {
  const [trips, installments, documents] = await Promise.all([
    prisma.trip.findMany({
      where: { startDate: { gte: from, lte: to } },
      select: { id: true, name: true, startDate: true, status: true },
    }),
    prisma.installment.findMany({
      where: { dueDate: { gte: from, lte: to } },
      select: {
        id: true,
        dueDate: true,
        amount: true,
        currency: true,
        status: true,
        bookingId: true,
        booking: { select: { customer: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.customerDocument.findMany({
      where: { expiryDate: { gte: from, lte: to } },
      select: {
        id: true,
        type: true,
        expiryDate: true,
        customerId: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const events: AgendaEvent[] = [];

  for (const t of trips) {
    events.push({
      id: `TRIP:${t.id}`,
      type: "TRIP",
      date: t.startDate.toISOString(),
      title: t.name,
      subtitle: "Salida programada",
      status: t.status,
      refId: t.id,
    });
  }

  for (const i of installments) {
    const c = i.booking.customer;
    events.push({
      id: `INST:${i.id}`,
      type: "INSTALLMENT",
      date: i.dueDate.toISOString(),
      title: `${c.firstName} ${c.lastName}`,
      subtitle: "Vence cuota",
      status: i.status,
      refId: i.bookingId,
      amount: i.amount.toString(),
      currency: i.currency,
    });
  }

  for (const d of documents) {
    if (!d.expiryDate) continue;
    events.push({
      id: `DOC:${d.id}`,
      type: "DOCUMENT",
      date: d.expiryDate.toISOString(),
      title: `${d.customer.firstName} ${d.customer.lastName}`,
      subtitle: `Vence ${DOC_LABELS[d.type]}`,
      refId: d.customerId,
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
