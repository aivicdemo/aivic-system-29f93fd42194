import { calculateBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-975: [normal] 請求額計算結果の手順書検証 - 単価×数量の基本計算ルールが手順書と合致して正常系と判定される
  test("単価1000円×数量5個=5000円として計算され、手順書の基本計算ルール『単価×数量』と合致し正常系と判定される", () => {
    const unitPrice = 1000;
    const quantity = 5;
    const expectedBillingAmount = 5000;

    const result = calculateBillingAmount({
      unitPrice,
      quantity,
    });

    expect(result.billingAmount).toBe(expectedBillingAmount);
    expect(result.calculationRule).toBe("unitPrice × quantity");
    expect(result.isNormalCase).toBe(true);
    expect(result.traceLog).toContain(`unitPrice: ${unitPrice}`);
    expect(result.traceLog).toContain(`quantity: ${quantity}`);
    expect(result.traceLog).toContain(`result: ${expectedBillingAmount}`);
  });
});