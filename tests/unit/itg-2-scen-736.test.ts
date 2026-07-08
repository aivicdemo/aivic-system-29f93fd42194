import { evaluateReferenceDataReliability } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-736: [edge] 参照データ適切性判定・信頼度可視化機能 - 参照データの時期が査定対象から3年以上前のとき信頼度が中に判定される
  test("参照データの時期が査定対象から3年以上前の場合、信頼度が『中』と判定される", () => {
    const referenceDataDate = new Date("2021-01-15T00:00:00Z");
    const assessmentTargetDate = new Date("2024-01-15T00:00:00Z");

    const result = evaluateReferenceDataReliability({
      referenceDataDate,
      assessmentTargetDate,
    });

    expect(result.reliabilityLevel).toBe("中");
    expect(result.yearsDifference).toBe(3);
    expect(result.isApplicable).toBe(true);
  });
});