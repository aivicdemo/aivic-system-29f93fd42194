import { validateSalesDataRange } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ値の範囲検証機能", () => {
  // SCEN-689: [error] 営業データ値の範囲検証機能 - 数値項目が最大値を超過している場合に範囲外エラーが検出される
  test("数値項目が最大値を超過した場合、範囲外エラーが検出されてエラーメッセージが表示され、保存が拒否される", () => {
    // 前提: 営業データ入力画面が表示され、数値項目の入力フィールドが利用可能
    // 発生条件: 売上金額フィールドに最大値 9999999 を超える値 10000000 を入力して保存ボタンをクリック
    // 期待結果: 範囲外エラーが検出され、エラーメッセージが表示される。データ保存が拒否される。

    const salesData = {
      customerId: "CUST-001",
      serviceName: "営業サポート",
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: 10000000, // 最大値 9999999 を超過
      dataDate: "2024-01-15",
    };

    // エラーケース: 最大値超過
    expect(() => validateSalesDataRange(salesData)).toThrow(/最大値/);

    // 正常系: 最大値以内の値
    const validSalesData = {
      customerId: "CUST-001",
      serviceName: "営業サポート",
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: 9999999, // 最大値と同じ値
      dataDate: "2024-01-15",
    };

    const validResult = validateSalesDataRange(validSalesData);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual([]);

    // 境界値テスト: 最大値を1超過
    const boundaryViolationData = {
      customerId: "CUST-002",
      serviceName: "営業支援",
      appointmentCount: 10,
      contractCount: 3,
      salesAmount: 10000000, // 最大値を1超過
      dataDate: "2024-01-16",
    };

    expect(() => validateSalesDataRange(boundaryViolationData)).toThrow(
      /最大値/
    );

    // エラーログ確認: エラーが検出される場合、エラーオブジェクトにエラー情報が含まれることを確認
    const errorData = {
      customerId: "CUST-003",
      serviceName: "営業管理",
      appointmentCount: 15,
      contractCount: 5,
      salesAmount: 50000000, // 大幅に超過
      dataDate: "2024-01-17",
    };

    try {
      validateSalesDataRange(errorData);
      fail("エラーが発生すべき");
    } catch (error) {
      expect(error).toMatchObject({
        message: expect.stringMatching(/最大値/),
        errorCode: "RANGE_EXCEEDED",
        field: "salesAmount",
      });
    }
  });
});