import { describe, test, expect } from "@jest/globals";
import { selectOptimalDiscount } from "../../src/logic/it-1-2-1";

describe("割引判定・照合機能 - 複数割引条件の最適選択", () => {
  test("SCEN-1260: 複数の割引条件が存在する場合、最適割引が自動選択され請求額に反映される", () => {
    // 【テストデータ準備】
    // 基本請求額: 100,000円
    // 割引条件1: 割引率 10% → 割引額 10,000円
    // 割引条件2: 割引率 15% → 割引額 15,000円
    // 割引条件3: 割引額 5,000円 (固定)
    // 期待: 割引条件2（15%）が最適（割引額15,000円が最大）として選択される
    // 最終請求額: 100,000 - 15,000 = 85,000円

    const baseAmount = 100000;
    const discountConditions = [
      { type: "percentage", value: 10, label: "割引率10%" },
      { type: "percentage", value: 15, label: "割引率15%" },
      { type: "fixed", value: 5000, label: "割引額5000円" },
    ];

    const result = selectOptimalDiscount({
      baseAmount,
      discountConditions,
      customerId: "CUST001",
      serviceId: "SVC001",
    });

    // 【検証1】選択された割引が割引条件2（15%）であること
    expect(result.selectedDiscount).toEqual({
      type: "percentage",
      value: 15,
      label: "割引率15%",
    });

    // 【検証2】割引額の計算が正確であること
    // 15% of 100,000 = 15,000
    expect(result.discountAmount).toBe(15000);

    // 【検証3】最終請求額が正確に計算されていること
    // 100,000 - 15,000 = 85,000
    expect(result.finalAmount).toBe(85000);

    // 【検証4】全ての割引条件の評価結果が含まれていること
    expect(result.evaluatedDiscounts).toHaveLength(3);
    expect(result.evaluatedDiscounts[0]).toEqual({
      discount: { type: "percentage", value: 10, label: "割引率10%" },
      calculatedAmount: 10000,
    });
    expect(result.evaluatedDiscounts[1]).toEqual({
      discount: { type: "percentage", value: 15, label: "割引率15%" },
      calculatedAmount: 15000,
    });
    expect(result.evaluatedDiscounts[2]).toEqual({
      discount: { type: "fixed", value: 5000, label: "割引額5000円" },
      calculatedAmount: 5000,
    });

    // 【検証5】選択理由が「最適割引（最大割引額）」であること
    expect(result.selectionReason).toBe("最大割引額");
  });
});