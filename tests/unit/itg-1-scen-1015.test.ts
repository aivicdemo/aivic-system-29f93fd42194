import { classifyAndJudgePriority } from "../../src/logic/it-1-2-1";

describe("顧客質問内容分類・優先度判定機能", () => {
  test("SCEN-1015: 顧客からの質問内容が正しく分類され、対応優先度が適切に判定される", () => {
    // Test case 1: 請求関連質問
    const billing_inquiry = "請求書の金額が異なっています";
    const billing_result = classifyAndJudgePriority(billing_inquiry);

    expect(billing_result.category).toBe("請求関連");
    expect(billing_result.priority).toBe("高");
    expect(typeof billing_result.timestamp).toBe("string");
    expect(billing_result.logged).toBe(true);

    // Test case 2: 製品サポート質問
    const product_inquiry = "製品の使い方について教えてください";
    const product_result = classifyAndJudgePriority(product_inquiry);

    expect(product_result.category).toBe("製品サポート");
    expect(product_result.priority).toBe("中");
    expect(typeof product_result.timestamp).toBe("string");
    expect(product_result.logged).toBe(true);

    // Test case 3: 情報提供質問
    const info_inquiry = "今後のキャンペーン情報を知りたい";
    const info_result = classifyAndJudgePriority(info_inquiry);

    expect(info_result.category).toBe("情報提供");
    expect(info_result.priority).toBe("低");
    expect(typeof info_result.timestamp).toBe("string");
    expect(info_result.logged).toBe(true);

    // Verify consistency across all results
    expect([billing_result, product_result, info_result].every(r => r.logged)).toBe(true);
    expect(
      new Set([billing_result.priority, product_result.priority, info_result.priority]).size
    ).toBe(3);
  });
});