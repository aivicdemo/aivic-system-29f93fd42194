import { updateContractAndBillingData } from "../../src/logic/it-1-2-1";

describe("契約・請求データリアルタイム更新機能", () => {
  // SCEN-1222
  test("複数の変更項目がある場合、すべてが一括で契約・請求データに反映される", () => {
    const contract_id = "CTR-2024-001";
    const updated_at = new Date("2024-01-15T10:00:00Z");
    const user_id = "USR-REP-001";

    const input = {
      contract_id: contract_id,
      changes: [
        {
          field_name: "contract_amount",
          old_value: 1000000,
          new_value: 1200000,
        },
        {
          field_name: "contract_period_end",
          old_value: "2024-12-31",
          new_value: "2025-12-31",
        },
        {
          field_name: "billing_address",
          old_value: "東京都渋谷区1-1-1",
          new_value: "東京都渋谷区2-2-2",
        },
        {
          field_name: "manager_name",
          old_value: "山田太郎",
          new_value: "鈴木次郎",
        },
      ],
      updated_by: user_id,
      updated_at: updated_at,
    };

    const result = updateContractAndBillingData(input);

    expect(result).toEqual({
      status: "success",
      contract_id: contract_id,
      updated_fields_count: 4,
      updated_at: updated_at,
      contract_master_updated: true,
      billing_data_updated: true,
      change_history_records: [
        {
          field_name: "contract_amount",
          old_value: 1000000,
          new_value: 1200000,
          timestamp: updated_at,
          user_id: user_id,
        },
        {
          field_name: "contract_period_end",
          old_value: "2024-12-31",
          new_value: "2025-12-31",
          timestamp: updated_at,
          user_id: user_id,
        },
        {
          field_name: "billing_address",
          old_value: "東京都渋谷区1-1-1",
          new_value: "東京都渋谷区2-2-2",
          timestamp: updated_at,
          user_id: user_id,
        },
        {
          field_name: "manager_name",
          old_value: "山田太郎",
          new_value: "鈴木次郎",
          timestamp: updated_at,
          user_id: user_id,
        },
      ],
      related_documents_updated: true,
      affected_invoice_ids: ["INV-2024-001", "INV-2024-002"],
    });

    expect(result.status).toBe("success");
    expect(result.contract_id).toBe(contract_id);
    expect(result.updated_fields_count).toBe(4);
    expect(result.contract_master_updated).toBe(true);
    expect(result.billing_data_updated).toBe(true);
    expect(result.change_history_records.length).toBe(4);
    expect(
      result.change_history_records.every(
        (rec) => rec.timestamp.getTime() === updated_at.getTime()
      )
    ).toBe(true);
    expect(result.related_documents_updated).toBe(true);
    expect(result.affected_invoice_ids.length).toBeGreaterThan(0);
  });
});