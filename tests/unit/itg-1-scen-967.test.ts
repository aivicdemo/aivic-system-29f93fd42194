import { describe, test, expect } from "@jest/globals";
import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-967: アポ数がゼロの正常な営業データを検証済みとして返す", () => {
    // Arrange: アポ数がゼロで、その他必須項目は有効な営業データ
    const salesData = {
      sales_representative_name: "山田太郎",
      enterprise_name: "テック株式会社",
      contact_date: "2024-12-15",
      appointment_count: 0,
      contract_count: 5,
      customer_feedback: "positive",
      service_type: "consultation",
    };

    // Act: データ検証処理を実行
    const validation_result = validateSalesData(salesData);

    // Assert: 検証結果が『検証済み』であり、エラーメッセージが表示されないこと
    expect(validation_result).toEqual({
      is_valid: true,
      status: "検証済み",
      error_messages: [],
      warnings: [],
    });
  });
});