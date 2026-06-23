import { beforeEach, describe, expect, it } from "vitest";
import type { CustomerInput } from "@clickviajes/shared";
import { ctx, makeTenant, resetDb } from "./helpers.js";
import * as customers from "../src/modules/customers/customer.service.js";

beforeEach(resetDb);

const baseCustomer = (over: Partial<CustomerInput> = {}): CustomerInput => ({
  firstName: "Juan",
  lastName: "Pérez",
  ci: null,
  ruc: null,
  email: null,
  phone: null,
  address: null,
  birthDate: null,
  notes: null,
  documents: [],
  ...over,
});

const listQuery = { page: 1, pageSize: 20, sortBy: "createdAt" as const, sortDir: "desc" as const };

describe("aislamiento multi-tenant", () => {
  it("un tenant no ve los clientes de otro", async () => {
    const a = await makeTenant();
    const b = await makeTenant();

    await ctx(a.tenant.id, a.admin.id, () => customers.createCustomer(baseCustomer({ firstName: "Cliente", lastName: "DeA" })));

    const listA = await ctx(a.tenant.id, a.admin.id, () => customers.listCustomers(listQuery));
    const listB = await ctx(b.tenant.id, b.admin.id, () => customers.listCustomers(listQuery));

    expect(listA.total).toBe(1);
    expect(listB.total).toBe(0);
  });

  it("un tenant no puede leer un cliente de otro por id (404)", async () => {
    const a = await makeTenant();
    const b = await makeTenant();
    const created = await ctx(a.tenant.id, a.admin.id, () => customers.createCustomer(baseCustomer()));

    await expect(ctx(b.tenant.id, b.admin.id, () => customers.getCustomer(created.id))).rejects.toThrow();
  });

  it("autocompleta el RUC desde el CI (módulo 11)", async () => {
    const a = await makeTenant();
    const c = await ctx(a.tenant.id, a.admin.id, () => customers.createCustomer(baseCustomer({ ci: "1234567" })));
    expect(c.ruc).toBe("1234567-9");
  });
});
