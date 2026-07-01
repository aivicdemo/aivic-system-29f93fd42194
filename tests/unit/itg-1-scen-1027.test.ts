import { validateSalesData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ検証ルール定義・実行機能", () => {
  test("SCEN-1027: 営業データの検証ルール確認と品質基準の明確化 - 必須項目・データ型・値の範囲・異常値判定基準が正確に確認される", () => {
    // 前提: 営業データ検証ルール定義ドキュメントと品質基準が存在する状態

    // テスト1: 必須項目リストの確認 - 正常系
    const validSalesDataWithRequiredFields = {
      customer_name: "顧客A株式会社",
      transaction_amount: 150000,
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultValid = validateSalesData(validSalesDataWithRequiredFields);
    expect(resultValid).toEqual({
      is_valid: true,
      error_count: 0,
      errors: [],
      quality_score: 100,
    });

    // テスト2: 必須項目の欠落検証
    const missingCustomerName = {
      customer_name: "",
      transaction_amount: 150000,
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultMissingField = validateSalesData(missingCustomerName);
    expect(resultMissingField.is_valid).toBe(false);
    expect(resultMissingField.error_count).toBeGreaterThan(0);
    expect(
      resultMissingField.errors.some((e) => e.includes("顧客名"))
    ).toBe(true);

    // テスト3: データ型チェック - 数値型の期待値
    const invalidAmountType = {
      customer_name: "顧客B株式会社",
      transaction_amount: "十五万円", // 文字列 - 数値期待
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultInvalidType = validateSalesData(invalidAmountType);
    expect(resultInvalidType.is_valid).toBe(false);
    expect(resultInvalidType.errors.some((e) => e.includes("金額"))).toBe(
      true
    );

    // テスト4: 値の範囲チェック - 負数の検出
    const negativeAmount = {
      customer_name: "顧客C株式会社",
      transaction_amount: -50000, // 負数は異常値
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultNegativeAmount = validateSalesData(negativeAmount);
    expect(resultNegativeAmount.is_valid).toBe(false);
    expect(resultNegativeAmount.errors.some((e) => e.includes("範囲"))).toBe(
      true
    );

    // テスト5: 値の範囲チェック - 上限値超過の検出
    const excessiveAmount = {
      customer_name: "顧客D株式会社",
      transaction_amount: 10000001, // 上限 10,000,000 を超過
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultExcessiveAmount = validateSalesData(excessiveAmount);
    expect(resultExcessiveAmount.is_valid).toBe(false);
    expect(resultExcessiveAmount.errors.some((e) => e.includes("上限"))).toBe(
      true
    );

    // テスト6: 日付形式のチェック - ISO 8601 形式要件
    const invalidDateFormat = {
      customer_name: "顧客E株式会社",
      transaction_amount: 200000,
      sales_date: "2024/01/15", // yyyy-MM-dd 形式ではない
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultInvalidDate = validateSalesData(invalidDateFormat);
    expect(resultInvalidDate.is_valid).toBe(false);
    expect(resultInvalidDate.errors.some((e) => e.includes("日付"))).toBe(
      true
    );

    // テスト7: ステータス値の集合チェック
    const invalidStatus = {
      customer_name: "顧客F株式会社",
      transaction_amount: 175000,
      sales_date: "2024-01-15",
      appointment_status: "invalid_status", // 許可値: confirmed, pending, cancelled
      service_type: "consultation",
    };

    const resultInvalidStatus = validateSalesData(invalidStatus);
    expect(resultInvalidStatus.is_valid).toBe(false);
    expect(resultInvalidStatus.errors.some((e) => e.includes("状態"))).toBe(
      true
    );

    // テスト8: 複数エラーの同時検出
    const multipleErrors = {
      customer_name: "", // 欠落
      transaction_amount: "百万円", // 型エラー
      sales_date: "15-01-2024", // 形式エラー
      appointment_status: "unknown", // 値エラー
      service_type: "consultation",
    };

    const resultMultipleErrors = validateSalesData(multipleErrors);
    expect(resultMultipleErrors.is_valid).toBe(false);
    expect(resultMultipleErrors.error_count).toBe(4);
    expect(resultMultipleErrors.quality_score).toBe(0);

    // テスト9: 顧客名の文字数上限チェック（例: 100文字以内）
    const customerNameTooLong = {
      customer_name: "a".repeat(101),
      transaction_amount: 150000,
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultLongName = validateSalesData(customerNameTooLong);
    expect(resultLongName.is_valid).toBe(false);
    expect(resultLongName.errors.some((e) => e.includes("文字数"))).toBe(true);

    // テスト10: NULL値の異常値判定
    const nullAmount = {
      customer_name: "顧客G株式会社",
      transaction_amount: null as any,
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultNullValue = validateSalesData(nullAmount);
    expect(resultNullValue.is_valid).toBe(false);
    expect(resultNullValue.errors.some((e) => e.includes("金額"))).toBe(true);

    // テスト11: 品質スコア計算 - エラーなし = 100点
    const perfectData = {
      customer_name: "優良顧客株式会社",
      transaction_amount: 500000,
      sales_date: "2024-01-20",
      appointment_status: "confirmed",
      service_type: "consulting_premium",
    };

    const resultPerfect = validateSalesData(perfectData);
    expect(resultPerfect.quality_score).toBe(100);
    expect(resultPerfect.error_count).toBe(0);

    // テスト12: 品質スコア計算 - エラー 1 件の場合の低下度
    const oneErrorData = {
      customer_name: "顧客H株式会社",
      transaction_amount: -1000, // 1 件のエラー
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultOneError = validateSalesData(oneErrorData);
    expect(resultOneError.error_count).toBe(1);
    expect(resultOneError.quality_score).toBe(80); // 100 - (1 * 20) = 80

    // テスト13: 許容エラー率の確認 - 品質基準が満たされている状態
    // 許容エラー率: 10% 未満 = 合格
    const marginallPassData = {
      customer_name: "合格ボーダー株式会社",
      transaction_amount: 300000,
      sales_date: "2024-01-15",
      appointment_status: "confirmed",
      service_type: "consultation",
    };

    const resultMarginalPass = validateSalesData(marginallPassData);
    expect(resultMarginalPass.is_valid).toBe(true);
    expect(resultMarginalPass.quality_score).toBeGreaterThanOrEqual(90); // 90点以上で合格
  });
});