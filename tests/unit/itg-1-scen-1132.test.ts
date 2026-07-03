import { describe, test, expect } from "@jest/globals";
import { validateDeliveryList } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1132: [error] 配信リスト妥当性確認 - 配信停止フラグが設定されている顧客が配信リストから除外されない場合にエラーが検出される
  test("配信停止フラグが true の顧客がリストに含まれている場合、エラーが検出される", () => {
    const deliveryList = [
      {
        customerId: "CUST001",
        customerName: "顧客A",
        deliveryStopFlag: false,
      },
      {
        customerId: "CUST002",
        customerName: "顧客B",
        deliveryStopFlag: true,
      },
      {
        customerId: "CUST003",
        customerName: "顧客C",
        deliveryStopFlag: true,
      },
      {
        customerId: "CUST004",
        customerName: "顧客D",
        deliveryStopFlag: false,
      },
    ];

    const result = validateDeliveryList(deliveryList);

    expect(result.isValid).toBe(false);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails.length).toBe(2);
    expect(result.errorDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerId: "CUST002",
          customerName: "顧客B",
          deliveryStopFlag: true,
          reason: "配信停止フラグ",
        }),
        expect.objectContaining({
          customerId: "CUST003",
          customerName: "顧客C",
          deliveryStopFlag: true,
          reason: "配信停止フラグ",
        }),
      ])
    );
    expect(result.errorMessage).toMatch(/配信停止フラグ/);
  });
});