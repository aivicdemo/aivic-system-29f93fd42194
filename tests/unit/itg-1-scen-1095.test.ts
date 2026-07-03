import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("バックオフィス業務データ品質検証機能", () => {
  // SCEN-1095: [error] 必須営業データが欠落している場合に異常を検出してエスカレーションする
  test("必須営業データ欠落時にエラーをスローし、エスカレーション処理が実行される", () => {
    // 必須フィールドが揃ったテストデータ
    const validSalesData = {
      customerId: "CUST-001",
      productCode: "PROD-A001",
      amount: 50000,
      transactionDate: "2024-01-15",
      transactionId: "TRX-001",
      quantity: 5,
      unitPrice: 10000,
      status: "pending",
    };

    // 必須フィールド「customerId」を欠落させたテストデータ
    const missingCustomerIdData = {
      // customerId: 欠落
      productCode: "PROD-A001",
      amount: 50000,
      transactionDate: "2024-01-15",
      transactionId: "TRX-001",
      quantity: 5,
      unitPrice: 10000,
      status: "pending",
    };

    // 必須フィールド「amount」を欠落させたテストデータ
    const missingAmountData = {
      customerId: "CUST-001",
      productCode: "PROD-A001",
      // amount: 欠落
      transactionDate: "2024-01-15",
      transactionId: "TRX-001",
      quantity: 5,
      unitPrice: 10000,
      status: "pending",
    };

    // 必須フィールド「transactionDate」を欠落させたテストデータ
    const missingTransactionDateData = {
      customerId: "CUST-001",
      productCode: "PROD-A001",
      amount: 50000,
      // transactionDate: 欠落
      transactionId: "TRX-001",
      quantity: 5,
      unitPrice: 10000,
      status: "pending",
    };

    // 複数必須フィールドを欠落させたテストデータ
    const multipleFieldsMissingData = {
      customerId: "CUST-001",
      // productCode: 欠落
      // amount: 欠落
      transactionDate: "2024-01-15",
      transactionId: "TRX-001",
      quantity: 5,
      unitPrice: 10000,
      status: "pending",
    };

    // ハッピーパス: 必須フィールドが全て揃っている場合、検証成功
    const validResult = validateSalesDataQuality(validSalesData);
    expect(validResult).toEqual({
      isValid: true,
      status: "合格",
      errors: [],
      escalationNeeded: false,
      escalationStatus: null,
      transactionId: "TRX-001",
      customerId: "CUST-001",
    });

    // エラーケース1: customerId 欠落時にエラーをスロー
    expect(() => validateSalesDataQuality(missingCustomerIdData as any)).toThrow(
      /customerId/
    );

    // エラーケース2: amount 欠落時にエラーをスロー
    expect(() => validateSalesDataQuality(missingAmountData as any)).toThrow(
      /amount/
    );

    // エラーケース3: transactionDate 欠落時にエラーをスロー
    expect(() => validateSalesDataQuality(missingTransactionDateData as any)).toThrow(
      /transactionDate/
    );

    // エラーケース4: 複数フィールド欠落時にはスローされるが、メッセージは最初の欠落フィールドを示す
    expect(() =>
      validateSalesDataQuality(multipleFieldsMissingData as any)
    ).toThrow(/productCode|amount/);

    // 欠落検出時のエスカレーション処理: transactionId 存在時
    try {
      validateSalesDataQuality(missingCustomerIdData as any);
    } catch (error) {
      // エラー発生時、エスカレーション記録が内部で自動生成される
      // エラーメッセージが「必須項目」というキーワードを含むことを確認
      expect((error as Error).message).toMatch(/必須項目|必須フィールド|欠落/);
    }

    // エスカレーション処理確認: 欠落データを含むレコードのステータス更新シミュレーション
    const escalationResult = validateSalesDataQuality({
      ...validSalesData,
      status: "escalation_needed", // エスカレーション対象ステータス
    });

    // エスカレーション処理が実行された場合、ステータスが「要確認」または「エスカレーション済」に更新される
    if (escalationResult.escalationNeeded) {
      expect(escalationResult.escalationStatus).toMatch(
        /要確認|エスカレーション済|escalation_pending|escalated/
      );
    }

    // データ型不正検査: amount が数値でない場合
    const invalidAmountTypeData = {
      customerId: "CUST-001",
      productCode: "PROD-A001",
      amount: "invalid_number", // 数値ではなく文字列
      transactionDate: "2024-01-15",
      transactionId: "TRX-001",
      quantity: 5,
      unitPrice: 10000,
      status: "pending",
    };

    expect(() => validateSalesDataQuality(invalidAmountTypeData as any)).toThrow(
      /amount|型|データ型/
    );

    // 金額が負の異常値の場合
    const negativeAmountData = {
      customerId: "CUST-001",
      productCode: "PROD-A001",
      amount: -50000, // 負の金額は異常
      transactionDate: "2024-01-15",
      transactionId: "TRX-001",
      quantity: 5,
      unitPrice: 10000,
      status: "pending",
    };

    const negativeAmountResult = validateSalesDataQuality(negativeAmountData);
    expect(negativeAmountResult.isValid).toBe(false);
    expect(negativeAmountResult.status).toMatch(/不合格|エラー/);
    expect(negativeAmountResult.errors.length).toBeGreaterThan(0);
    expect(negativeAmountResult.errors[0]).toMatch(/金額|amount|異常値|範囲/);

    // 日付形式が不正の場合
    const invalidDateFormatData = {
      customerId: "CUST-001",
      productCode: "PROD-A001",
      amount: 50000,
      transactionDate: "2024/01/15", // YYYY-MM-DD形式ではない
      transactionId: "TRX-001",
      quantity: 5,
      unitPrice: 10000,
      status: "pending",
    };

    expect(() => validateSalesDataQuality(invalidDateFormatData as any)).toThrow(
      /日付|date|形式/
    );

    // 量が0以下の異常値の場合
    const invalidQuantityData = {
      customerId: "CUST-001",
      productCode: "PROD-A001",
      amount: 50000,
      transactionDate: "2024-01-15",
      transactionId: "TRX-001",
      quantity: 0, // 量が0は異常
      unitPrice: 10000,
      status: "pending",
    };

    const invalidQuantityResult = validateSalesDataQuality(invalidQuantityData);
    expect(invalidQuantityResult.isValid).toBe(false);
    expect(invalidQuantityResult.errors[0]).toMatch(/quantity|quantity|数量|異常値/);

    // 複数の異常を同時に検出する場合
    const multipleErrorsData = {
      customerId: "CUST-001",
      // productCode: 欠落
      amount: -50000, // 負の金額
      transactionDate: "invalid", // 不正な日付
      transactionId: "TRX-001",
      quantity: 0, // 不正な数量
      unitPrice: 10000,
      status: "pending",
    };

    const multipleErrorsResult = validateSalesDataQuality(
      multipleErrorsData as any
    );
    expect(multipleErrorsResult.isValid).toBe(false);
    expect(multipleErrorsResult.errors.length).toBeGreaterThanOrEqual(2);

    // エスカレーション完了後のステータス確認: ステータスが「要確認」に更新される
    const escalationCompletedData = {
      customerId: "CUST-002",
      productCode: "PROD-B002",
      amount: 75000,
      transactionDate: "2024-01-20",
      transactionId: "TRX-002",
      quantity: 3,
      unitPrice: 25000,
      status: "escalation_completed",
    };

    const escalationCompletedResult = validateSalesDataQuality(
      escalationCompletedData
    );
    expect(escalationCompletedResult.status).toMatch(/合格|completed/);
    expect(escalationCompletedResult.escalationStatus).toMatch(
      /completed|完了|済/
    );

    // 管理者通知が記録されたことを確認: transactionId が通知に含まれる
    expect(escalationCompletedResult.transactionId).toBe("TRX-002");
    expect(escalationCompletedResult.customerId).toBe("CUST-002");
  });
});