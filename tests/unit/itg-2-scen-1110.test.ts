import { analyzeAssessorAccuracy } from "../../src/logic/it-6-2-2-2";

describe("査定員別判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1110
  test("判定精度が0%のときも集計ロジックが破綻しないこと", () => {
    // テストデータセットアップ: 査定員Aの10件すべて不正確
    const assessmentResults = [
      { assessorId: "A", estimatedValue: 1000000, actualValue: 2000000, isAccurate: false },
      { assessorId: "A", estimatedValue: 500000, actualValue: 1000000, isAccurate: false },
      { assessorId: "A", estimatedValue: 800000, actualValue: 1500000, isAccurate: false },
      { assessorId: "A", estimatedValue: 1200000, actualValue: 2500000, isAccurate: false },
      { assessorId: "A", estimatedValue: 600000, actualValue: 1100000, isAccurate: false },
      { assessorId: "A", estimatedValue: 900000, actualValue: 1800000, isAccurate: false },
      { assessorId: "A", estimatedValue: 1100000, actualValue: 2200000, isAccurate: false },
      { assessorId: "A", estimatedValue: 700000, actualValue: 1300000, isAccurate: false },
      { assessorId: "A", estimatedValue: 1300000, actualValue: 2600000, isAccurate: false },
      { assessorId: "A", estimatedValue: 750000, actualValue: 1400000, isAccurate: false },
    ];

    // 月次査定結果分析機能を実行
    const result = analyzeAssessorAccuracy(assessmentResults);

    // 集計結果に査定員Aが含まれていることを確認
    expect(result.assessors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ assessorId: "A" }),
      ])
    );

    // 査定員Aの記録を取得
    const assessorA = result.assessors.find((a) => a.assessorId === "A");

    // 判定精度が0%と正確に表示されていることを確認（分子0/分母10）
    expect(assessorA?.accuracyRate).toBe(0);

    // 処理件数が正しく10件と記録されていることを確認
    expect(assessorA?.totalCount).toBe(10);

    // 正確な判定件数が0件と記録されていることを確認
    expect(assessorA?.accurateCount).toBe(0);

    // 全体集計統計が計算されていることを確認
    expect(result.statistics).toBeDefined();
    expect(result.statistics.averageAccuracy).toBeDefined();
    expect(result.statistics.medianAccuracy).toBeDefined();

    // 平均値を確認（査定員Aのみの場合、平均は0%）
    expect(result.statistics.averageAccuracy).toBe(0);

    // 中央値を確認（査定員Aのみの場合、中央値は0%）
    expect(result.statistics.medianAccuracy).toBe(0);

    // システムエラーフラグがfalseであることを確認
    expect(result.hasError).toBe(false);

    // エラーメッセージが空であることを確認
    expect(result.errorMessage).toBe("");

    // 処理が正常に完了していることを確認
    expect(result.status).toBe("completed");
  });
});