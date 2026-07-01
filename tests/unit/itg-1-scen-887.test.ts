import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-887: [normal] 営業データ異常値の自動検出 - 営業データの型・範囲・形式がすべて正常な場合、チェック結果『正常』が返される
  test("営業データの型・範囲・形式がすべて正常な場合、チェック結果として『正常』が返される", () => {
    const salesData = {
      customerId: "CUST-001",
      contactDate: "2024-01-15",
      contactTime: "10:30",
      appointmentCount: 3,
      contractCount: 1,
      customerReaction: "positive",
      serviceType: "standard",
      revenue: 150000,
      status: "completed",
    };

    const result = validateSalesDataQuality(salesData);

    expect(result.checkResult).toBe("正常");
    expect(result.hasErrors).toBe(false);
    expect(result.errorDetails).toEqual([]);
    expect(result.validationTimestamp).toBeDefined();
  });
});