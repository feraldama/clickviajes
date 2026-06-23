import { beforeEach, describe, expect, it } from "vitest";
import type { CreateUserInput } from "@clickviajes/shared";
import { ctx, makeTenant, resetDb } from "./helpers.js";
import * as users from "../src/modules/users/user.service.js";
import * as auth from "../src/modules/auth/auth.service.js";

beforeEach(resetDb);

const newUser = (over: Partial<CreateUserInput>): CreateUserInput => ({
  fullName: "Vendedor", email: "v@test.com", password: "secret123", role: "SELLER", commissionRate: null, ...over,
});

describe("capa SaaS", () => {
  it("respeta el límite de usuarios del plan", async () => {
    // Plan con máximo 2 usuarios; el admin ya ocupa 1.
    const { tenant, admin } = await makeTenant({ planMaxUsers: 2 });

    // 2º usuario: OK
    await ctx(tenant.id, admin.id, () => users.createUser(newUser({ email: "v1@test.com" })));
    // 3º usuario: supera el límite
    await expect(
      ctx(tenant.id, admin.id, () => users.createUser(newUser({ email: "v2@test.com" }))),
    ).rejects.toThrow(/l[íi]mite/i);
  });

  it("permite el login de una agencia activa", async () => {
    const { admin } = await makeTenant({ status: "ACTIVE" });
    const res = await auth.login(admin.email, "secret123");
    expect(res.accessToken).toBeTruthy();
    expect(res.user.email).toBe(admin.email);
  });

  it("bloquea el login si la agencia está suspendida", async () => {
    const { admin } = await makeTenant({ status: "SUSPENDED" });
    await expect(auth.login(admin.email, "secret123")).rejects.toThrow(/suspendida/i);
  });
});
