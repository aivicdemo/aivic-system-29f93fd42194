import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  defineValidationRule,
  retrieveValidationRuleDetail,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ品質基準・検証ルール定義", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1326
  test("営業データ項目について許容範囲・データ型・必須フラグ・計算ロジックが定義される", () => {
    // ルール定義入力値
    const ruleInput = {
      dataItemId: "item_001",
      dataItemName: "売上金額",
      dataType: "numeric",
      minValue: 0,
      maxValue: 1000000,
      isRequired: true,
      calculationLogic: "taxIncludedAmount = baseAmount * 1.1",
      description: "税込売上金額の計算",
    };

    // ルール定義を保存
    const savedRuleId = defineValidationRule(ruleInput);
    expect(typeof savedRuleId).toBe("string");
    expect(savedRuleId.length).toBeGreaterThan(0);

    // ルール詳細を取得
    const retrievedRule = retrieveValidationRuleDetail(savedRuleId);

    // 許容範囲の検証
    expect(retrievedRule.minValue).toBe(0);
    expect(retrievedRule.maxValue).toBe(1000000);

    // データ型の検証
    expect(retrievedRule.dataType).toBe("numeric");

    // 必須フラグの検証
    expect(retrievedRule.isRequired).toBe(true);

    // 計算ロジックの検証
    expect(retrievedRule.calculationLogic).toBe(
      "taxIncludedAmount = baseAmount * 1.1"
    );

    // データ項目名の検証
    expect(retrievedRule.dataItemName).toBe("売上金額");

    // 説明の検証
    expect(retrievedRule.description).toBe("税込売上金額の計算");
  });

  test("複数のデータ項目に対して異なる定義が正確に保存される", () => {
    // 顧客名ルール定義
    const customerNameRuleInput = {
      dataItemId: "item_002",
      dataItemName: "顧客名",
      dataType: "string",
      minValue: null,
      maxValue: null,
      isRequired: true,
      calculationLogic: null,
      description: "顧客企業の名前",
    };

    const customerNameRuleId = defineValidationRule(customerNameRuleInput);
    const customerNameRule = retrieveValidationRuleDetail(customerNameRuleId);

    expect(customerNameRule.dataType).toBe("string");
    expect(customerNameRule.isRequired).toBe(true);
    expect(customerNameRule.calculationLogic).toBeNull();

    // 受注日ルール定義
    const orderDateRuleInput = {
      dataItemId: "item_003",
      dataItemName: "受注日",
      dataType: "date",
      minValue: null,
      maxValue: null,
      isRequired: true,
      calculationLogic: null,
      description: "商品受注日",
    };

    const orderDateRuleId = defineValidationRule(orderDateRuleInput);
    const orderDateRule = retrieveValidationRuleDetail(orderDateRuleId);

    expect(orderDateRule.dataType).toBe("date");
    expect(orderDateRule.isRequired).toBe(true);

    // アポイント数ルール定義（オプション項目、計算ロジックあり）
    const appointmentCountRuleInput = {
      dataItemId: "item_004",
      dataItemName: "アポイント数",
      dataType: "numeric",
      minValue: 0,
      maxValue: 999,
      isRequired: false,
      calculationLogic: "totalAppointments = confirmCount + tentativeCount",
      description: "確定・暫定アポイント数の合計",
    };

    const appointmentCountRuleId = defineValidationRule(
      appointmentCountRuleInput
    );
    const appointmentCountRule = retrieveValidationRuleDetail(
      appointmentCountRuleId
    );

    expect(appointmentCountRule.isRequired).toBe(false);
    expect(appointmentCountRule.minValue).toBe(0);
    expect(appointmentCountRule.maxValue).toBe(999);
    expect(appointmentCountRule.calculationLogic).toBe(
      "totalAppointments = confirmCount + tentativeCount"
    );
  });

  test("必須フラグがOFFの場合、データは任意入力として扱われる", () => {
    const optionalRuleInput = {
      dataItemId: "item_005",
      dataItemName: "顧客反応メモ",
      dataType: "string",
      minValue: null,
      maxValue: null,
      isRequired: false,
      calculationLogic: null,
      description: "顧客からのコメント",
    };

    const optionalRuleId = defineValidationRule(optionalRuleInput);
    const optionalRule = retrieveValidationRuleDetail(optionalRuleId);

    expect(optionalRule.isRequired).toBe(false);
    expect(optionalRule.dataItemName).toBe("顧客反応メモ");
  });

  test("計算ロジックが複雑な場合でも正確に保存される", () => {
    const complexCalcRuleInput = {
      dataItemId: "item_006",
      dataItemName: "月間請求額",
      dataType: "numeric",
      minValue: 0,
      maxValue: 10000000,
      isRequired: true,
      calculationLogic:
        "monthlyBilling = (basePrice * quantity) - discount + tax; tax = basePrice * quantity * 0.1",
      description: "基本料金×数量-割引+税金",
    };

    const complexCalcRuleId = defineValidationRule(complexCalcRuleInput);
    const complexCalcRule = retrieveValidationRuleDetail(complexCalcRuleId);

    expect(complexCalcRule.calculationLogic).toBe(
      "monthlyBilling = (basePrice * quantity) - discount + tax; tax = basePrice * quantity * 0.1"
    );
    expect(complexCalcRule.minValue).toBe(0);
    expect(complexCalcRule.maxValue).toBe(10000000);
  });
});