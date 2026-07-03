import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1153: [edge] 営業データ品質検証・エラー検出機能 - 複数の検証ルール違反を同時検出し全て記録される
  test("複数の検証ルール違反が同時に検出され、全てのエラーが個別に記録される", () => {
    const testDataSet = {
      records: [
        {
          // エラー1: 必須項目の欠落（顧客名が空）
          customer_name: "",
          contact_date: "2024-01-15T09:00:00Z",
          service_type: "アポ",
          appointment_confirmed: true,
          deal_amount: 50000,
          record_id: "REC001",
        },
        {
          // エラー2: データ型の不正（deal_amount が文字列）
          customer_name: "顧客A",
          contact_date: "2024-01-15T09:00:00Z",
          service_type: "アポ",
          appointment_confirmed: true,
          deal_amount: "50000invalid",
          record_id: "REC002",
        },
        {
          // エラー3: 金額の範囲外（deal_amount が負数）
          customer_name: "顧客B",
          contact_date: "2024-01-15T09:00:00Z",
          service_type: "アポ",
          appointment_confirmed: true,
          deal_amount: -10000,
          record_id: "REC003",
        },
        {
          // エラー4: 日付フォーマット不正
          customer_name: "顧客C",
          contact_date: "2024/01/15 09:00",
          service_type: "アポ",
          appointment_confirmed: true,
          deal_amount: 75000,
          record_id: "REC004",
        },
        {
          // エラー5: 無効なサービスタイプ
          customer_name: "顧客D",
          contact_date: "2024-01-15T09:00:00Z",
          service_type: "無効なタイプ",
          appointment_confirmed: true,
          deal_amount: 60000,
          record_id: "REC005",
        },
        {
          // エラー6: 論理矛盾（deal_amount が 0 かつ appointment_confirmed が true）
          customer_name: "顧客E",
          contact_date: "2024-01-15T09:00:00Z",
          service_type: "アポ",
          appointment_confirmed: true,
          deal_amount: 0,
          record_id: "REC006",
        },
      ],
    };

    const validationResult = validateSalesData(testDataSet);

    // 期待: 複数の検証ルール違反が全て検出される
    expect(validationResult.errors).toBeDefined();
    expect(Array.isArray(validationResult.errors)).toBe(true);
    expect(validationResult.errors.length).toBeGreaterThanOrEqual(6);

    // 期待: エラー1 - 必須項目の欠落（顧客名）
    const error1 = validationResult.errors.find(
      (e: any) => e.record_id === "REC001" && e.field_name === "customer_name"
    );
    expect(error1).toBeDefined();
    expect(error1.error_code).toBe("REQUIRED_FIELD_MISSING");
    expect(error1.error_message).toMatch(/必須項目/);
    expect(error1.violation_rule).toBe("必須項目チェック");
    expect(error1.field_name).toBe("customer_name");
    expect(error1.timestamp).toBeDefined();

    // 期待: エラー2 - データ型の不正（deal_amount が数値ではない）
    const error2 = validationResult.errors.find(
      (e: any) => e.record_id === "REC002" && e.field_name === "deal_amount"
    );
    expect(error2).toBeDefined();
    expect(error2.error_code).toBe("INVALID_DATA_TYPE");
    expect(error2.error_message).toMatch(/データ型/);
    expect(error2.violation_rule).toBe("データ型チェック");
    expect(error2.field_name).toBe("deal_amount");
    expect(error2.timestamp).toBeDefined();

    // 期待: エラー3 - 金額の範囲外（負数）
    const error3 = validationResult.errors.find(
      (e: any) => e.record_id === "REC003" && e.field_name === "deal_amount"
    );
    expect(error3).toBeDefined();
    expect(error3.error_code).toBe("VALUE_OUT_OF_RANGE");
    expect(error3.error_message).toMatch(/範囲/);
    expect(error3.violation_rule).toBe("値の範囲チェック");
    expect(error3.field_name).toBe("deal_amount");
    expect(error3.timestamp).toBeDefined();

    // 期待: エラー4 - 日付フォーマット不正
    const error4 = validationResult.errors.find(
      (e: any) => e.record_id === "REC004" && e.field_name === "contact_date"
    );
    expect(error4).toBeDefined();
    expect(error4.error_code).toBe("INVALID_DATE_FORMAT");
    expect(error4.error_message).toMatch(/フォーマット/);
    expect(error4.violation_rule).toBe("日付フォーマットチェック");
    expect(error4.field_name).toBe("contact_date");
    expect(error4.timestamp).toBeDefined();

    // 期待: エラー5 - 無効なサービスタイプ
    const error5 = validationResult.errors.find(
      (e: any) => e.record_id === "REC005" && e.field_name === "service_type"
    );
    expect(error5).toBeDefined();
    expect(error5.error_code).toBe("INVALID_ENUM_VALUE");
    expect(error5.error_message).toMatch(/無効な値/);
    expect(error5.violation_rule).toBe("列挙値チェック");
    expect(error5.field_name).toBe("service_type");
    expect(error5.timestamp).toBeDefined();

    // 期待: エラー6 - 論理矛盾（deal_amount = 0 かつ appointment_confirmed = true）
    const error6 = validationResult.errors.find(
      (e: any) => e.record_id === "REC006" && e.error_code === "LOGICAL_CONTRADICTION"
    );
    expect(error6).toBeDefined();
    expect(error6.error_message).toMatch(/矛盾/);
    expect(error6.violation_rule).toBe("論理矛盾チェック");
    expect(error6.timestamp).toBeDefined();

    // 期待: 全エラーが一意のエラーコードを持つ
    const errorCodes = validationResult.errors.map((e: any) => e.error_code);
    const uniqueErrorCodes = new Set(errorCodes);
    // 同一フィールドの異なるエラー（例: REC003 と REC006 の deal_amount）を除外して重複チェック
    expect(uniqueErrorCodes.size).toBeGreaterThanOrEqual(6);

    // 期待: 全エラーに対象フィールド名が記録されている
    validationResult.errors.forEach((error: any) => {
      expect(error.field_name).toBeDefined();
      expect(typeof error.field_name).toBe("string");
      expect(error.field_name.length).toBeGreaterThan(0);
    });

    // 期待: 全エラーに検証ルール名が記録されている
    validationResult.errors.forEach((error: any) => {
      expect(error.violation_rule).toBeDefined();
      expect(typeof error.violation_rule).toBe("string");
      expect(error.violation_rule.length).toBeGreaterThan(0);
    });

    // 期待: 全エラーにタイムスタンプが記録されている
    const baseTime = new Date("2024-01-15T10:00:00Z").getTime();
    validationResult.errors.forEach((error: any) => {
      expect(error.timestamp).toBeDefined();
      const errorTime = new Date(error.timestamp).getTime();
      // タイムスタンプが妥当な時間帯（テスト実行日付付近）であることを確認
      expect(errorTime).toBeGreaterThan(baseTime - 86400000); // 1日前以降
      expect(errorTime).toBeLessThan(baseTime + 86400000); // 1日後以前
    });

    // 期待: エラー記録の重複がないこと（record_id + error_code + field_name の組み合わせが一意）
    const errorKeys = validationResult.errors.map(
      (e: any) => `${e.record_id}|${e.error_code}|${e.field_name}`
    );
    const uniqueErrorKeys = new Set(errorKeys);
    expect(uniqueErrorKeys.size).toBe(validationResult.errors.length);

    // 期待: 全体的なバリデーション結果が失敗（is_valid = false）
    expect(validationResult.is_valid).toBe(false);

    // 期待: エラー件数が 6 件以上
    expect(validationResult.error_count).toBeGreaterThanOrEqual(6);
    expect(validationResult.error_count).toBe(validationResult.errors.length);

    // 期待: 各エラーに具体的なメッセージが含まれている
    validationResult.errors.forEach((error: any) => {
      expect(error.error_message).toBeDefined();
      expect(typeof error.error_message).toBe("string");
      expect(error.error_message.length).toBeGreaterThan(0);
    });

    // 期待: 成功レコードが存在しないこと（全レコードにエラーがある）
    expect(validationResult.valid_records).toEqual([]);
    expect(validationResult.invalid_records.length).toBeGreaterThanOrEqual(6);
  });
});