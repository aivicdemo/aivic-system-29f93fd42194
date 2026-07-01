import { describe, test, expect } from "@jest/globals";
import { aggregateBillableItemsByCustomerAndService } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 顧客別・サービス別請求対象抽出集計", () => {
  test("SCEN-649: 対象期間にデータが存在しない場合に空の集計結果が返却される", () => {
    // Arrange: 対象期間にデータが存在しない状態を準備
    const targetStartDate = new Date("2024-02-01T00:00:00Z");
    const targetEndDate = new Date("2024-02-29T23:59:59Z");
    const salesDataList = []; // 空のデータセット
    const customerId = "CUST-001";
    const serviceType = "BASIC";

    // Act: 顧客別・サービス別請求対象抽出集計機能を呼び出す
    const result = aggregateBillableItemsByCustomerAndService(
      salesDataList,
      targetStartDate,
      targetEndDate,
      customerId,
      serviceType
    );

    // Assert: 戻り値が空の集計結果オブジェクトであることを検証
    expect(result).toEqual({
      customerId: customerId,
      serviceType: serviceType,
      targetPeriodStart: targetStartDate.toISOString(),
      targetPeriodEnd: targetEndDate.toISOString(),
      recordCount: 0,
      aggregatedItems: [],
      totalBillableAmount: 0,
      status: "empty",
    });

    // Assert: 空の集計結果に含まれるプロパティが初期値または空状態であることを確認
    expect(result.recordCount).toBe(0);
    expect(result.aggregatedItems).toHaveLength(0);
    expect(result.totalBillableAmount).toBe(0);
    expect(result.status).toBe("empty");
  });
});