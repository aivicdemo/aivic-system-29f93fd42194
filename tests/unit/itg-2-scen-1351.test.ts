import { calculateCustomizationPriority } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-1351: [error] カスタマイズ優先度決定 - スコア入力値が0～100の範囲外のとき入力値エラーが発生する
  test("should throw error when impact_score or implementation_difficulty_score is outside 0-100 range", () => {
    // 負の値を入力した場合
    expect(() =>
      calculateCustomizationPriority({
        impact_score: -1,
        implementation_difficulty_score: 50,
      })
    ).toThrow(/入力値は0～100の範囲/);

    // 100を超える値を入力した場合
    expect(() =>
      calculateCustomizationPriority({
        impact_score: 101,
        implementation_difficulty_score: 50,
      })
    ).toThrow(/入力値は0～100の範囲/);

    // 非常に大きな値を入力した場合
    expect(() =>
      calculateCustomizationPriority({
        impact_score: 999999,
        implementation_difficulty_score: 50,
      })
    ).toThrow(/入力値は0～100の範囲/);

    // implementation_difficulty_scoreが負の値の場合
    expect(() =>
      calculateCustomizationPriority({
        impact_score: 50,
        implementation_difficulty_score: -1,
      })
    ).toThrow(/入力値は0～100の範囲/);

    // implementation_difficulty_scoreが100を超える場合
    expect(() =>
      calculateCustomizationPriority({
        impact_score: 50,
        implementation_difficulty_score: 101,
      })
    ).toThrow(/入力値は0～100の範囲/);

    // implementation_difficulty_scoreが非常に大きな値の場合
    expect(() =>
      calculateCustomizationPriority({
        impact_score: 50,
        implementation_difficulty_score: 999999,
      })
    ).toThrow(/入力値は0～100の範囲/);

    // 両方のスコアが範囲外の場合
    expect(() =>
      calculateCustomizationPriority({
        impact_score: -10,
        implementation_difficulty_score: 150,
      })
    ).toThrow(/入力値は0～100の範囲/);
  });

  // 正常系：スコアが0～100の範囲内の場合、優先度が正常に計算される
  test("should calculate priority_score correctly when both scores are within 0-100 range", () => {
    // 両スコアが中程度の場合
    const result1 = calculateCustomizationPriority({
      impact_score: 50,
      implementation_difficulty_score: 50,
    });
    expect(result1).toEqual({
      priority_score: 50,
      priority_rank: "中",
      can_submit: true,
    });

    // 影響度が高く実装難度が低い場合（優先度高）
    const result2 = calculateCustomizationPriority({
      impact_score: 80,
      implementation_difficulty_score: 20,
    });
    expect(result2).toEqual({
      priority_score: 80,
      priority_rank: "高",
      can_submit: true,
    });

    // 影響度が低く実装難度が高い場合（優先度低）
    const result3 = calculateCustomizationPriority({
      impact_score: 20,
      implementation_difficulty_score: 80,
    });
    expect(result3).toEqual({
      priority_score: 20,
      priority_rank: "低",
      can_submit: true,
    });

    // 境界値：0
    const result4 = calculateCustomizationPriority({
      impact_score: 0,
      implementation_difficulty_score: 0,
    });
    expect(result4).toEqual({
      priority_score: 0,
      priority_rank: "低",
      can_submit: true,
    });

    // 境界値：100
    const result5 = calculateCustomizationPriority({
      impact_score: 100,
      implementation_difficulty_score: 100,
    });
    expect(result5).toEqual({
      priority_score: 100,
      priority_rank: "高",
      can_submit: true,
    });
  });
});