import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesDataRange,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ値の範囲検証機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-692
  test("数値項目が最大値ちょうどの場合に検証が合格する", () => {
    // Arrange: 営業データ品質管理・請求自動化システムにログイン
    // → テスト対象の数値項目の最大値制限を確認する
    const validationRule = {
      field_name: "appointment_count",
      field_type: "number",
      is_required: true,
      min_value: 0,
      max_value: 100,
    };

    // 数値項目に最大値ちょうどの値を入力する
    const input_data = {
      appointment_count: 100,
      contract_id: "CONTRACT_001",
      customer_id: "CUST_A",
      reporting_date: "2024-01-15",
    };

    // Act: 検証処理を実行する
    const result = validateSalesDataRange(input_data, validationRule);

    // Assert: 検証結果を確認する
    // 期待結果: 数値項目が最大値ちょうどの場合、検証が合格状態となり、
    // エラーメッセージが表示されず、データが正常に受け入れられること
    expect(result.is_valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.error_message).toBe("");
    expect(result.field_name).toBe("appointment_count");
    expect(result.input_value).toBe(100);
  });
});