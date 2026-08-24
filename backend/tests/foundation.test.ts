import { describe, expect, it } from "vitest";

import {
  mayAssignRole,
  PERMISSION_CODES,
  ROLE_CODES,
} from "../src/security/authorization-catalog.js";

describe("authorization catalog", () => {
  it("contains unique role and permission codes", () => {
    expect(new Set(ROLE_CODES).size).toBe(ROLE_CODES.length);
    expect(new Set(PERMISSION_CODES).size).toBe(PERMISSION_CODES.length);
  });

  it("only lets root administrators assign approved admin roles", () => {
    expect(mayAssignRole(["ROOT_ADMIN"], "ADMISSION_ADMIN")).toBe(true);
    expect(mayAssignRole(["ROOT_ADMIN"], "FINANCE_ADMIN")).toBe(true);
    expect(mayAssignRole(["ROOT_ADMIN"], "PRINCIPAL")).toBe(true);
    expect(mayAssignRole(["ROOT_ADMIN"], "ROOT_ADMIN")).toBe(false);
    expect(mayAssignRole(["ADMISSION_ADMIN"], "ROOT_ADMIN")).toBe(false);
    expect(mayAssignRole(["FINANCE_ADMIN"], "ADMISSION_ADMIN")).toBe(false);
  });
});
