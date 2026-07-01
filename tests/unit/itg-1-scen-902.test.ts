import { describe, test, expect } from "@jest/globals";
import { applyDiscountAndCampaign } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-902: [error] 割引・キャンペーン適用判定機能 - 契約条件が存在しない場合、エラーが返される
  test("should return error when contract condition is not found", () => {
    const input = {
      contractId: "contract-123",
      customerId: "customer-456",
      serviceId: "service-789",
      salesAmount: 100000,
      contractCondition: null,
    };

    const result = applyDiscountAndCampaign(input);

    expect(result).toEqual({
      success: false,
      errorCode: "CONTRACT_CONDITION_NOT_FOUND",
      statusCode: 400,
      message: "契約条件が見つかりません",
    });
  });
});