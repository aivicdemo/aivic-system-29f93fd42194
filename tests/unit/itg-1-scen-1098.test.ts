import { validateSalesDataTypes } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1098: [error] 月次営業データ集計・検証機能 - データ型不正の営業レコードが検出されて集計が中断される
  test("データ型不正の営業レコードを検出し集計を中断する", () => {
    // テストデータ: データ型が不正なレコード
    const invalidSalesRecords = [
      {
        recordId: 1,
        salesAmount: "123456", // 正常: 数値文字列
        contactDate: "2024-01-15",
        appointmentStatus: "confirmed",
      },
      {
        recordId: 2,
        salesAmount: "abc123def", // 不正: 数値として解析不可な文字列
        contactDate: "2024-01-16",
        appointmentStatus: "pending",
      },
      {
        recordId: 3,
        salesAmount: 250000,
        contactDate: "2024/01/17", // 不正: 日付形式が不正 (ISO 8601 でない)
        appointmentStatus: "confirmed",
      },
    ];

    // データ型検証を実行
    const result = validateSalesDataTypes(invalidSalesRecords);

    // 検証結果: 不正なレコードが検出されている
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);

    // エラー1: recordId=2, 売上金額が数値として無効
    expect(result.errors[0]).toEqual({
      recordId: 2,
      columnName: "salesAmount",
      expectedType: "number",
      actualValue: "abc123def",
      errorMessage: "売上金額が数値型で正しくありません",
    });

    // エラー2: recordId=3, 日付形式が ISO 8601 でない
    expect(result.errors[1]).toEqual({
      recordId: 3,
      columnName: "contactDate",
      expectedType: "ISO8601Date",
      actualValue: "2024/01/17",
      errorMessage: "接触日時がISO8601形式で正しくありません",
    });

    // 集計処理の中断を確認
    expect(result.aggregationStatus).toBe("suspended");
    expect(result.processedRecordCount).toBe(1); // 1番目のレコードまで処理
    expect(result.totalRecordCount).toBe(3);
  });

  // エラーテスト: 売上金額が不正な型の場合
  test("売上金額が数値型でない場合はThrowする", () => {
    const invalidRecords = [
      {
        recordId: 1,
        salesAmount: null, // 不正: null
        contactDate: "2024-01-15",
        appointmentStatus: "confirmed",
      },
    ];

    expect(() => validateSalesDataTypes(invalidRecords)).toThrow(/売上金額/);
  });

  // エラーテスト: 日付形式が不正な場合
  test("接触日時が ISO 8601 形式でない場合はThrowする", () => {
    const invalidRecords = [
      {
        recordId: 1,
        salesAmount: 100000,
        contactDate: "15-01-2024", // 不正: ISO 8601 ではない
        appointmentStatus: "confirmed",
      },
    ];

    expect(() => validateSalesDataTypes(invalidRecords)).toThrow(/接触日時/);
  });
});