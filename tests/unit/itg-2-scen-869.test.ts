import { calculatePrecisionImprovementMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-869: モデル更新前後精度比較・可視化機能 - 精度が改善しなかった場合、改善度0%を正確に記録・表示する", () => {
    // 前提条件: モデル更新前のOCR精度とAI判定精度が85.5%で固定
    const beforeOcrPrecision = 85.5;
    const beforeJudgmentPrecision = 85.5;
    
    // モデル更新後の精度が同一値（改善なし）
    const afterOcrPrecision = 85.5;
    const afterJudgmentPrecision = 85.5;

    // 精度改善度指標を計算
    const result = calculatePrecisionImprovementMetrics({
      beforeOcrPrecision,
      beforeJudgmentPrecision,
      afterOcrPrecision,
      afterJudgmentPrecision,
      updateTimestamp: "2024-06-15T14:30:00Z",
      modelVersion: "v2.1",
    });

    // 数値表示: 改善度が0%として正確に記録される
    expect(result.ocrPrecisionImprovementRate).toBe(0);
    expect(result.judgmentPrecisionImprovementRate).toBe(0);

    // グラフ表示用データ: 改善度0%を正確に表現
    expect(result.visualizationData.ocrImprovementPercentage).toBe(0);
    expect(result.visualizationData.judgmentImprovementPercentage).toBe(0);

    // 改善度のグラフ表示ラベルが"改善なし"または"0%"で区別される
    expect(result.visualizationData.ocrGraphLabel).toBe("改善度: 0%");
    expect(result.visualizationData.judgmentGraphLabel).toBe("改善度: 0%");

    // 履歴記録: 改善度0%が一貫して記録される
    expect(result.historicalRecord.ocrPrecisionImprovementRate).toBe(0);
    expect(result.historicalRecord.judgmentPrecisionImprovementRate).toBe(0);
    expect(result.historicalRecord.timestamp).toBe("2024-06-15T14:30:00Z");

    // 改善度0%が他の改善率と区別されていることを検証
    // - 改善度0%は「横ばい」として認識される
    expect(result.improvementStatus).toBe("no-improvement");

    // - 計算誤差が発生していないことを検証（浮動小数点誤差排除）
    expect(Math.abs(result.ocrPrecisionImprovementRate - 0)).toBeLessThan(0.001);
    expect(Math.abs(result.judgmentPrecisionImprovementRate - 0)).toBeLessThan(0.001);

    // - 表示ゆらぎが発生していないことを検証
    expect(result.visualizationData.ocrImprovementPercentage).toStrictEqual(0);
    expect(result.visualizationData.judgmentImprovementPercentage).toStrictEqual(0);

    // - 前後の精度値が記録されている
    expect(result.beforeMetrics.ocrPrecision).toBe(85.5);
    expect(result.beforeMetrics.judgmentPrecision).toBe(85.5);
    expect(result.afterMetrics.ocrPrecision).toBe(85.5);
    expect(result.afterMetrics.judgmentPrecision).toBe(85.5);

    // - 改善度0%が複数データソース間で一貫している
    expect(result.ocrPrecisionImprovementRate).toEqual(
      result.visualizationData.ocrImprovementPercentage
    );
    expect(result.judgmentPrecisionImprovementRate).toEqual(
      result.visualizationData.judgmentImprovementPercentage
    );
    expect(result.ocrPrecisionImprovementRate).toEqual(
      result.historicalRecord.ocrPrecisionImprovementRate
    );
    expect(result.judgmentPrecisionImprovementRate).toEqual(
      result.historicalRecord.judgmentPrecisionImprovementRate
    );

    // - 改善度の区間判定が正確である（0%は「改善なし」に分類される）
    expect(result.improvementCategory).toBe("no-change");

    // - グラフ表示時の色分けが改善度0%に対応している
    expect(result.visualizationData.ocrGraphColor).toBe("gray");
    expect(result.visualizationData.judgmentGraphColor).toBe("gray");
  });
});