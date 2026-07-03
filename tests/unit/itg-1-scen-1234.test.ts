import { describe, test, expect } from "@jest/globals";
import { determinePriorityForMultipleContractChanges } from "../../src/logic/it-1781935279444-2-1-1";

describe("複数契約変更優先順位自動判定機能", () => {
  // SCEN-1234: [normal] 複数契約変更優先順位自動判定機能 - 影響範囲が同一の複数変更の場合、登録順序で優先順位が決定される
  test("影響範囲が同一の複数変更の場合、登録順序に従い優先順位が決定される", () => {
    const changeA = {
      change_id: "CHG-001",
      customer_id: "CUST-100",
      service_id: "SVC-A",
      change_type: "contract_term",
      impact_scope: "billing",
      registered_at: new Date("2024-01-10T09:00:00Z"),
      registered_by: "user_001",
    };

    const changeB = {
      change_id: "CHG-002",
      customer_id: "CUST-100",
      service_id: "SVC-A",
      change_type: "discount_rate",
      impact_scope: "billing",
      registered_at: new Date("2024-01-10T10:30:00Z"),
      registered_by: "user_002",
    };

    const changeC = {
      change_id: "CHG-003",
      customer_id: "CUST-100",
      service_id: "SVC-A",
      change_type: "payment_term",
      impact_scope: "billing",
      registered_at: new Date("2024-01-10T11:45:00Z"),
      registered_by: "user_003",
    };

    const changes = [changeA, changeB, changeC];

    const result = determinePriorityForMultipleContractChanges(changes);

    expect(result).toEqual([
      {
        change_id: "CHG-001",
        priority: 1,
        registered_at: new Date("2024-01-10T09:00:00Z"),
      },
      {
        change_id: "CHG-002",
        priority: 2,
        registered_at: new Date("2024-01-10T10:30:00Z"),
      },
      {
        change_id: "CHG-003",
        priority: 3,
        registered_at: new Date("2024-01-10T11:45:00Z"),
      },
    ]);

    expect(result[0].priority).toBe(1);
    expect(result[1].priority).toBe(2);
    expect(result[2].priority).toBe(3);

    expect(result[0].change_id).toBe("CHG-001");
    expect(result[1].change_id).toBe("CHG-002");
    expect(result[2].change_id).toBe("CHG-003");
  });
});