import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1103: [error] 営業データ品質検証 - 値が指定範囲外の場合（負の成約数など）にエラーを検出される
  test("負の成約数（-1）が指定範囲外のエラーとして検出され、適切なエラーメッセージが表示される", () => {
    const invalidSalesData = {
      customerId: "CUST001",
      serviceType: "consultation",
      appointmentCount: 5,
      closedDealCount: -1,
      customerFeedback: "positive",
      recordDate: "2024-01-15",
    };

    expect(() => validateSalesDataQuality(invalidSalesData)).toThrow(/成約数/);
  });
});