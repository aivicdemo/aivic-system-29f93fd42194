import { describe, test, expect } from "@jest/globals";
import { recordChangeHistory } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理 - 変更履歴・監査ログ自動記録", () => {
  test("SCEN-1255: [normal] 複数項目の同時変更時に全項目の差分が正確に記録される", () => {
    const userId = "user-test-001";
    const recordId = "record-sales-data-001";
    const timestamp = new Date("2024-01-15T10:30:00Z");

    const beforeValues = {
      customer_name: "A社",
      amount: 100000,
      status: "見積",
      assigned_user: "営業太郎",
    };

    const afterValues = {
      customer_name: "B社",
      amount: 150000,
      status: "受注",
      assigned_user: "営業太郎",
    };

    const changeRecord = recordChangeHistory({
      record_id: recordId,
      user_id: userId,
      timestamp: timestamp,
      before_values: beforeValues,
      after_values: afterValues,
    });

    expect(changeRecord).toBeDefined();
    expect(changeRecord.record_id).toBe(recordId);
    expect(changeRecord.user_id).toBe(userId);
    expect(changeRecord.timestamp).toEqual(timestamp);

    expect(changeRecord.changes).toBeDefined();
    expect(changeRecord.changes.length).toBe(3);

    const customerNameChange = changeRecord.changes.find(
      (c: any) => c.field_name === "customer_name"
    );
    expect(customerNameChange).toBeDefined();
    expect(customerNameChange.before_value).toBe("A社");
    expect(customerNameChange.after_value).toBe("B社");

    const amountChange = changeRecord.changes.find(
      (c: any) => c.field_name === "amount"
    );
    expect(amountChange).toBeDefined();
    expect(amountChange.before_value).toBe(100000);
    expect(amountChange.after_value).toBe(150000);

    const statusChange = changeRecord.changes.find(
      (c: any) => c.field_name === "status"
    );
    expect(statusChange).toBeDefined();
    expect(statusChange.before_value).toBe("見積");
    expect(statusChange.after_value).toBe("受注");

    expect(changeRecord.is_multi_field_change).toBe(true);
    expect(changeRecord.audit_entry_count).toBe(1);

    changeRecord.changes.forEach((change: any) => {
      expect(change.record_id).toBe(recordId);
      expect(change.changed_by).toBe(userId);
      expect(change.changed_at).toEqual(timestamp);
    });
  });
});