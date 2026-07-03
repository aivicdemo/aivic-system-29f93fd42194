import { describe, test, expect } from "@jest/globals";
import { validateAggregationRule } from "../../src/logic/it-1-2-1";

describe("顧客・サービス別集計ルール検証機能", () => {
  test("SCEN-662: 不正な集計ルール定義が与えられた場合、エラーが適切に発生する", () => {
    // ===== ハッピーパス: 正常な集計ルール定義 =====
    const validRule = {
      customerId: "CUST001",
      serviceId: "SVC001",
      aggregationMethod: "SUM",
      targetFields: ["appointmentCount", "contractCount"],
      aggregationPeriod: "MONTHLY",
      aggregationUnit: "SERVICE",
    };

    const validResult = validateAggregationRule(validRule);
    expect(validResult).toEqual({
      isValid: true,
      errors: [],
      errorCode: null,
    });

    // ===== エラーケース 1: 必須フィールド欠落 (customerId がない) =====
    const missingCustomerId = {
      serviceId: "SVC001",
      aggregationMethod: "SUM",
      targetFields: ["appointmentCount"],
      aggregationPeriod: "MONTHLY",
      aggregationUnit: "SERVICE",
    };

    expect(() => validateAggregationRule(missingCustomerId)).toThrow(
      /顧客ID/
    );

    // ===== エラーケース 2: 必須フィールド欠落 (aggregationMethod がない) =====
    const missingAggregationMethod = {
      customerId: "CUST001",
      serviceId: "SVC001",
      targetFields: ["appointmentCount"],
      aggregationPeriod: "MONTHLY",
      aggregationUnit: "SERVICE",
    };

    expect(() => validateAggregationRule(missingAggregationMethod)).toThrow(
      /集計方法/
    );

    // ===== エラーケース 3: データ型不正 (aggregationMethod が無効な値) =====
    const invalidAggregationMethod = {
      customerId: "CUST001",
      serviceId: "SVC001",
      aggregationMethod: "INVALID_METHOD",
      targetFields: ["appointmentCount"],
      aggregationPeriod: "MONTHLY",
      aggregationUnit: "SERVICE",
    };

    expect(() => validateAggregationRule(invalidAggregationMethod)).toThrow(
      /集計方法/
    );

    // ===== エラーケース 4: 値の範囲外 (aggregationPeriod が無効な値) =====
    const invalidPeriod = {
      customerId: "CUST001",
      serviceId: "SVC001",
      aggregationMethod: "SUM",
      targetFields: ["appointmentCount"],
      aggregationPeriod: "INVALID_PERIOD",
      aggregationUnit: "SERVICE",
    };

    expect(() => validateAggregationRule(invalidPeriod)).toThrow(/集計期間/);

    // ===== エラーケース 5: targetFields が空配列 =====
    const emptyTargetFields = {
      customerId: "CUST001",
      serviceId: "SVC001",
      aggregationMethod: "SUM",
      targetFields: [],
      aggregationPeriod: "MONTHLY",
      aggregationUnit: "SERVICE",
    };

    expect(() => validateAggregationRule(emptyTargetFields)).toThrow(
      /対象項目/
    );

    // ===== エラーケース 6: serviceId が空文字列 =====
    const emptyServiceId = {
      customerId: "CUST001",
      serviceId: "",
      aggregationMethod: "SUM",
      targetFields: ["appointmentCount"],
      aggregationPeriod: "MONTHLY",
      aggregationUnit: "SERVICE",
    };

    expect(() => validateAggregationRule(emptyServiceId)).toThrow(/サービスID/);

    // ===== エラーケース 7: aggregationUnit が無効な値 =====
    const invalidUnit = {
      customerId: "CUST001",
      serviceId: "SVC001",
      aggregationMethod: "SUM",
      targetFields: ["appointmentCount"],
      aggregationPeriod: "MONTHLY",
      aggregationUnit: "INVALID_UNIT",
    };

    expect(() => validateAggregationRule(invalidUnit)).toThrow(/集計単位/);

    // ===== リカバリーテスト: エラー発生後に正常なルールで復帰できる =====
    const recoveryRule = {
      customerId: "CUST002",
      serviceId: "SVC002",
      aggregationMethod: "AVG",
      targetFields: ["conversionCount"],
      aggregationPeriod: "MONTHLY",
      aggregationUnit: "CUSTOMER",
    };

    const recoveryResult = validateAggregationRule(recoveryRule);
    expect(recoveryResult).toEqual({
      isValid: true,
      errors: [],
      errorCode: null,
    });
  });
});