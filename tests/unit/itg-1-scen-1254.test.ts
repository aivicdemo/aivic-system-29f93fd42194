import { recordChangeHistory } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - 変更履歴・監査ログ自動記録", () => {
  test("SCEN-1254: [normal] 契約・請求データ更新時に変更内容・変更者・変更日時・差分が自動記録される", () => {
    // 契約データ変更のテスト
    const contract_id = "CONTRACT_001";
    const user_id = "USER_12345";
    const change_timestamp = new Date("2024-01-15T10:30:00Z");
    const old_amount = 1000000;
    const new_amount = 1200000;

    const contract_change_result = recordChangeHistory({
      entity_type: "contract",
      entity_id: contract_id,
      changed_by_user_id: user_id,
      change_timestamp: change_timestamp,
      field_name: "amount",
      old_value: old_amount.toString(),
      new_value: new_amount.toString(),
    });

    expect(contract_change_result.success).toBe(true);
    expect(contract_change_result.change_history_id).toBeDefined();
    expect(contract_change_result.entity_type).toBe("contract");
    expect(contract_change_result.entity_id).toBe(contract_id);
    expect(contract_change_result.changed_by_user_id).toBe(user_id);
    expect(contract_change_result.change_timestamp.toISOString()).toBe(
      "2024-01-15T10:30:00.000Z"
    );
    expect(contract_change_result.field_name).toBe("amount");
    expect(contract_change_result.old_value).toBe("1000000");
    expect(contract_change_result.new_value).toBe("1200000");
    expect(contract_change_result.difference).toEqual({
      old_amount: 1000000,
      new_amount: 1200000,
      change_amount: 200000,
    });

    // 請求データ変更のテスト
    const invoice_id = "INVOICE_002";
    const user_id_2 = "USER_67890";
    const change_timestamp_2 = new Date("2024-01-15T11:45:00Z");
    const old_invoice_date = "2024-01-10";
    const new_invoice_date = "2024-01-15";

    const invoice_change_result = recordChangeHistory({
      entity_type: "invoice",
      entity_id: invoice_id,
      changed_by_user_id: user_id_2,
      change_timestamp: change_timestamp_2,
      field_name: "invoice_date",
      old_value: old_invoice_date,
      new_value: new_invoice_date,
    });

    expect(invoice_change_result.success).toBe(true);
    expect(invoice_change_result.change_history_id).toBeDefined();
    expect(invoice_change_result.entity_type).toBe("invoice");
    expect(invoice_change_result.entity_id).toBe(invoice_id);
    expect(invoice_change_result.changed_by_user_id).toBe(user_id_2);
    expect(invoice_change_result.change_timestamp.toISOString()).toBe(
      "2024-01-15T11:45:00.000Z"
    );
    expect(invoice_change_result.field_name).toBe("invoice_date");
    expect(invoice_change_result.old_value).toBe("2024-01-10");
    expect(invoice_change_result.new_value).toBe("2024-01-15");

    // 複数フィールド同時変更のテスト
    const contract_id_3 = "CONTRACT_003";
    const user_id_3 = "USER_11111";
    const change_timestamp_3 = new Date("2024-01-15T09:15:00Z");

    const multi_field_result = recordChangeHistory({
      entity_type: "contract",
      entity_id: contract_id_3,
      changed_by_user_id: user_id_3,
      change_timestamp: change_timestamp_3,
      field_name: "status,amount",
      old_value: "active,800000",
      new_value: "pending,950000",
    });

    expect(multi_field_result.success).toBe(true);
    expect(multi_field_result.field_name).toBe("status,amount");
    expect(multi_field_result.old_value).toBe("active,800000");
    expect(multi_field_result.new_value).toBe("pending,950000");

    // エラーケース: 必須項目欠落
    expect(() =>
      recordChangeHistory({
        entity_type: "contract",
        entity_id: "",
        changed_by_user_id: user_id,
        change_timestamp: change_timestamp,
        field_name: "amount",
        old_value: "1000000",
        new_value: "1200000",
      })
    ).toThrow(/entity_id/);

    expect(() =>
      recordChangeHistory({
        entity_type: "contract",
        entity_id: contract_id,
        changed_by_user_id: "",
        change_timestamp: change_timestamp,
        field_name: "amount",
        old_value: "1000000",
        new_value: "1200000",
      })
    ).toThrow(/user_id/);

    expect(() =>
      recordChangeHistory({
        entity_type: "contract",
        entity_id: contract_id,
        changed_by_user_id: user_id,
        change_timestamp: change_timestamp,
        field_name: "",
        old_value: "1000000",
        new_value: "1200000",
      })
    ).toThrow(/field_name/);

    // 無効なエンティティタイプ
    expect(() =>
      recordChangeHistory({
        entity_type: "invalid_type",
        entity_id: contract_id,
        changed_by_user_id: user_id,
        change_timestamp: change_timestamp,
        field_name: "amount",
        old_value: "1000000",
        new_value: "1200000",
      })
    ).toThrow(/entity_type/);
  });
});