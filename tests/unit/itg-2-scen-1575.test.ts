import { evaluateTestScore } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1575: [edge] 理解度テスト実施・評価機能 - 合格基準点が60点と80点の境界値で評価結果が正反対に判定される
  test("should correctly evaluate test scores at boundary values 60 and 80 points", () => {
    // 合格基準点60点での評価
    const result_60_59 = evaluateTestScore({
      score: 59,
      passingScore: 60,
    });
    expect(result_60_59.isPass).toBe(false);
    expect(result_60_59.evaluation).toBe("不合格");

    const result_60_60 = evaluateTestScore({
      score: 60,
      passingScore: 60,
    });
    expect(result_60_60.isPass).toBe(true);
    expect(result_60_60.evaluation).toBe("合格");

    const result_60_61 = evaluateTestScore({
      score: 61,
      passingScore: 60,
    });
    expect(result_60_61.isPass).toBe(true);
    expect(result_60_61.evaluation).toBe("合格");

    // 合格基準点80点での評価
    const result_80_79 = evaluateTestScore({
      score: 79,
      passingScore: 80,
    });
    expect(result_80_79.isPass).toBe(false);
    expect(result_80_79.evaluation).toBe("不合格");

    const result_80_80 = evaluateTestScore({
      score: 80,
      passingScore: 80,
    });
    expect(result_80_80.isPass).toBe(true);
    expect(result_80_80.evaluation).toBe("合格");

    const result_80_81 = evaluateTestScore({
      score: 81,
      passingScore: 80,
    });
    expect(result_80_81.isPass).toBe(true);
    expect(result_80_81.evaluation).toBe("合格");

    // 基準点60と基準点80での差分検証
    expect(result_60_59.isPass).not.toBe(result_60_60.isPass);
    expect(result_60_59.evaluation).not.toBe(result_60_60.evaluation);
    expect(result_80_79.isPass).not.toBe(result_80_80.isPass);
    expect(result_80_79.evaluation).not.toBe(result_80_80.evaluation);

    // 境界値における評価結果の一貫性を確認
    expect(result_60_60.isPass).toBe(true);
    expect(result_60_59.isPass).toBe(false);
    expect(result_80_80.isPass).toBe(true);
    expect(result_80_79.isPass).toBe(false);
  });
});