import { recordContractChange } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-861: [normal] 契約変更内容の標準化記録機能
  test("顧客企業からの契約変更・請求金額変更通知が標準化されたフォーマットで正確に記録される", () => {
    const customer_id = "CUST-001";
    const contract_id = "CTR-2024-001";
    const customer_name = "テスト顧客企業";
    const changed_amount_before = 100000;
    const changed_amount_after = 120000;
    const change_reason = "サービス追加に伴う単価改定";
    const change_datetime = new Date("2024-02-15T10:30:00Z").toISOString();

    const notification_input = {
      customer_id,
      contract_id,
      customer_name,
      changed_amount_before,
      changed_amount_after,
      change_reason,
      change_datetime,
    };

    const result = recordContractChange(notification_input);

    expect(result).toBeDefined();
    expect(result.record_id).toBeDefined();
    expect(typeof result.record_id).toBe("string");

    expect(result.customer_enterprise_id).toBe(customer_id);
    expect(result.contract_id).toBe(contract_id);
    expect(result.customer_enterprise_name).toBe(customer_name);

    expect(result.changed_item_type).toBe("billing_amount");
    expect(result.changed_value_before).toBe(changed_amount_before);
    expect(result.changed_value_after).toBe(changed_amount_after);
    expect(result.change_reason).toBe(change_reason);

    expect(result.change_notification_datetime).toBe(change_datetime);
    expect(result.record_datetime).toBeDefined();
    expect(typeof result.record_datetime).toBe("string");

    expect(result.status).toBe("recorded");

    expect(result.schema_version).toBe("1.0");
    expect(result.data_completeness_flag).toBe(true);

    const second_notification = {
      customer_id: "CUST-002",
      contract_id: "CTR-2024-002",
      customer_name: "別テスト顧客",
      changed_amount_before: 50000,
      changed_amount_after: 60000,
      change_reason: "割引適用",
      change_datetime: new Date("2024-02-16T14:00:00Z").toISOString(),
    };

    const second_result = recordContractChange(second_notification);

    expect(second_result).toBeDefined();
    expect(second_result.record_id).toBeDefined();
    expect(second_result.record_id).not.toBe(result.record_id);

    expect(second_result.customer_enterprise_id).toBe("CUST-002");
    expect(second_result.contract_id).toBe("CTR-2024-002");
    expect(second_result.customer_enterprise_name).toBe("別テスト顧客");
    expect(second_result.changed_value_before).toBe(50000);
    expect(second_result.changed_value_after).toBe(60000);
    expect(second_result.change_reason).toBe("割引適用");

    expect(second_result.status).toBe("recorded");
    expect(second_result.data_completeness_flag).toBe(true);

    const difference = second_result.changed_value_after - second_result.changed_value_before;
    expect(difference).toBe(10000);

    const first_difference =
      result.changed_value_after - result.changed_value_before;
    expect(first_difference).toBe(20000);
  });
});