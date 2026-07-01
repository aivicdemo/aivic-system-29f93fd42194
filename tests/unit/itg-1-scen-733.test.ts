import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業活動データ自動検証・エラー通知機能", () => {
  // SCEN-733
  test("文字列型フィールドへの数値入力を検出し、エラーログ・通知メッセージを生成し、データ保存をスキップする", () => {
    // === 入力準備 ===
    // 顧客名に数値を入力（文字列型期待値に対する不正）
    const invalidSalesActivityData = {
      activity_id: "ACT-20240115-001",
      customer_name: 123, // ❌ 文字列期待、数値入力
      sales_person_name: "営業太郎",
      contact_date: "2024-01-15",
      contact_content: "提案資料を送付",
      appointment_status: "未確定",
      service_type: "基本契約",
      appointment_count: 1,
      agreement_count: 0,
    };

    // === 検証実行 ===
    const result = validateSalesActivityData(invalidSalesActivityData);

    // === 期待結果の検証 ===
    // 1. 検証失敗が判定される
    expect(result.is_valid).toBe(false);

    // 2. エラーが検出される
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);

    // 3. エラーオブジェクトに必須情報が含まれる
    const customerNameError = result.errors.find(
      (err: any) => err.field === "customer_name"
    );
    expect(customerNameError).toBeDefined();
    expect(customerNameError.field).toBe("customer_name");
    expect(customerNameError.expected_type).toBe("string");
    expect(customerNameError.actual_value).toBe(123);
    expect(customerNameError.actual_type).toBe("number");

    // 4. ユーザー向けエラーメッセージが生成される
    expect(result.user_message).toBeDefined();
    expect(typeof result.user_message).toBe("string");
    expect(result.user_message.length).toBeGreaterThan(0);
    // 顧客名フィールド名とデータ型情報を含む
    expect(result.user_message).toMatch(/顧客名/);
    expect(result.user_message).toMatch(/文字列/);

    // 5. エラーログ情報が記録される
    expect(result.error_log).toBeDefined();
    expect(result.error_log.activity_id).toBe("ACT-20240115-001");
    expect(result.error_log.error_count).toBe(1);
    expect(result.error_log.logged_at).toBeDefined();
    expect(typeof result.error_log.logged_at).toBe("string");

    // 6. データベース保存フラグが False に設定される
    expect(result.should_save_to_db).toBe(false);

    // 7. エラーが business keyword を含む
    expect(result.errors[0].message).toMatch(/型/);
  });
});