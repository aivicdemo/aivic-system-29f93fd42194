import { determineCustomizationPriority } from "../../src/logic/it-1-br-6-2-1";

describe("カスタマイズ優先度決定機能", () => {
  // SCEN-1349
  test("影響度100・実装難度0のとき優先度ランクが『高』と判定される", () => {
    const input = {
      impact_score: 100,
      implementation_difficulty_score: 0,
    };

    const result = determineCustomizationPriority(input);

    expect(result.priority_rank).toBe("高");
  });
});