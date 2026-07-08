import { determinePrioritizationOrder } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-1161: [edge] 改善優先度判定機能 - 改善効果検証フィードバックが0件の場合、空の優先順位リストを返す
  test("改善効果検証フィードバックが0件の場合、空の配列を返す", () => {
    const feedbackList: any[] = [];

    const result = determinePrioritizationOrder(feedbackList);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    expect(result).toEqual([]);
  });
});