import {
  validateAndNotifyContractChangeCustomers,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("契約変更顧客通知順序最適化機能 - 不完全な顧客情報のエラーハンドリング", () => {
  test("SCEN-1241: 顧客情報が不完全なレコードはスキップ、有効なレコードは通知送信、エラーが記録される", () => {
    // Arrange
    const customers = [
      {
        customer_id: "CUST_001",
        customer_name: "株式会社ABC",
        email: "contact@abc.co.jp",
        phone: "09012345678",
        contact_person: "営業太郎",
        notification_priority: 1,
      },
      {
        customer_id: "CUST_002",
        customer_name: "株式会社DEF",
        email: "",
        phone: "09087654321",
        contact_person: "営業花子",
        notification_priority: 2,
      },
      {
        customer_id: "CUST_003",
        customer_name: "株式会社GHI",
        email: "contact@ghi.co.jp",
        phone: "",
        contact_person: "",
        notification_priority: 3,
      },
      {
        customer_id: "CUST_004",
        customer_name: "株式会社JKL",
        email: "contact@jkl.co.jp",
        phone: "09011112222",
        contact_person: "営業次郎",
        notification_priority: 4,
      },
    ];

    const contract_change_content = {
      old_value: "基本料金 100,000円/月",
      new_value: "基本料金 120,000円/月",
      effective_date: "2024-02-01",
    };

    // Act
    const result = validateAndNotifyContractChangeCustomers({
      customers,
      contract_change_content,
    });

    // Assert: 結果構造の検証
    expect(result).toEqual(
      expect.objectContaining({
        total_customers: 4,
        successfully_notified: 2,
        skipped_invalid: 2,
        errors_recorded: 2,
      })
    );

    // Assert: 成功した通知対象の顧客ID
    expect(result.notified_customer_ids).toContain("CUST_001");
    expect(result.notified_customer_ids).toContain("CUST_004");
    expect(result.notified_customer_ids.length).toBe(2);

    // Assert: スキップされた不完全な顧客ID
    expect(result.skipped_customer_ids).toContain("CUST_002");
    expect(result.skipped_customer_ids).toContain("CUST_003");
    expect(result.skipped_customer_ids.length).toBe(2);

    // Assert: エラーログの記録
    expect(result.error_log).toBeDefined();
    expect(result.error_log.length).toBe(2);

    // Assert: CUST_002のエラー内容（メールアドレス欠落）
    const error_cust_002 = result.error_log.find(
      (err: any) => err.customer_id === "CUST_002"
    );
    expect(error_cust_002).toBeDefined();
    expect(error_cust_002.error_message).toMatch(/メールアドレス/);
    expect(error_cust_002.error_type).toBe("incomplete_contact_info");

    // Assert: CUST_003のエラー内容（電話番号と連絡先名欠落）
    const error_cust_003 = result.error_log.find(
      (err: any) => err.customer_id === "CUST_003"
    );
    expect(error_cust_003).toBeDefined();
    expect(error_cust_003.error_message).toMatch(/電話番号|連絡先/);
    expect(error_cust_003.error_type).toBe("incomplete_contact_info");

    // Assert: システムが正常に処理を継続した（クラッシュしていない）
    expect(result.system_status).toBe("active");
    expect(result.processing_completed).toBe(true);

    // Assert: 処理の実行タイムスタンプが存在する
    expect(result.executed_at).toBeDefined();
    expect(typeof result.executed_at).toBe("string");
  });
});