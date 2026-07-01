import { describe, test, expect } from "@jest/globals";
import { prioritizeContractChanges } from "../../src/logic/it-1781935279444-2-2-1";

describe("複数契約変更の優先順序判定機能", () => {
  test("SCEN-1265: メタデータが不完全な場合にエラーが発生すること", () => {
    // 完全なメタデータを持つ契約変更データ
    const completeChange = {
      contractChangeId: "CC-001",
      customerId: "CUST-123",
      changeType: "price_update",
      changedAt: "2024-01-15T09:00:00Z",
      impactAmount: 50000,
    };

    // メタデータが不完全なデータ: customerId が欠損
    const incompleteChange1 = {
      contractChangeId: "CC-002",
      customerId: undefined,
      changeType: "service_add",
      changedAt: "2024-01-15T10:00:00Z",
      impactAmount: 75000,
    };

    // メタデータが不完全なデータ: changedAt が欠損
    const incompleteChange2 = {
      contractChangeId: "CC-003",
      customerId: "CUST-456",
      changeType: "schedule_change",
      changedAt: undefined,
      impactAmount: 30000,
    };

    // メタデータが不完全なデータ: changeType が欠損
    const incompleteChange3 = {
      contractChangeId: "CC-004",
      customerId: "CUST-789",
      changeType: undefined,
      changedAt: "2024-01-15T11:00:00Z",
      impactAmount: 100000,
    };

    const mixedChanges = [completeChange, incompleteChange1, incompleteChange2, incompleteChange3];

    // メタデータが不完全な場合、適切なエラーメッセージとともにエラーが発生することを確認
    expect(() => prioritizeContractChanges(mixedChanges)).toThrow(/メタデータ/);
  });
});