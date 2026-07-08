import { calculateImprovementDegreeMetrics } from "../../src/logic/it-6-2-1-1";

describe("ダッシュボード表示データ検証機能 - 改善度が100%の境界値", () => {
  test("SCEN-1100: 改善度が100%の境界値で、データが有効として正常に反映される", () => {
    // 入力: 改善度が100%のダッシュボード表示データ
    const input = {
      assessorId: "ASS-001",
      workType: "型枠工事",
      amountBand: "100万～500万円",
      baselineOcrAccuracy: 85.0,
      currentOcrAccuracy: 85.0,
      baselineAiJudgmentAccuracy: 78.0,
      currentAiJudgmentAccuracy: 78.0,
      improvementDegree: 100.0,
      processingTimeReductionRate: 100.0,
      qualityUniformityIndex: 100.0,
      dataCollectionPeriodDays: 30,
      sampleCount: 250,
      isValid: true,
    };

    // 実行: ダッシュボード表示データ検証機能を実行
    const result = calculateImprovementDegreeMetrics(input);

    // 検証1: 戻り値が有効なオブジェクトであること
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");

    // 検証2: 改善度が100%で正常に受け入れられること
    expect(result.improvementDegree).toBe(100.0);
    expect(result.isValidData).toBe(true);

    // 検証3: 改善度100%に対応するメトリクスが正確に計算されていること
    // 改善度 = (現在の精度 - 基準精度) / 基準精度 * 100
    // OCR精度改善度 = (85.0 - 85.0) / 85.0 * 100 = 0%
    // AI判定精度改善度 = (78.0 - 78.0) / 78.0 * 100 = 0%
    // 総合改善度 = 100%（正規化済み）
    expect(result.ocrAccuracyImprovementDegree).toBe(0.0);
    expect(result.aiJudgmentAccuracyImprovementDegree).toBe(0.0);
    expect(result.compositeImprovementDegree).toBe(100.0);

    // 検証4: 処理時間短縮率が100%で反映されていること
    expect(result.processingTimeReductionRate).toBe(100.0);

    // 検証5: 品質均一化指標が100%で反映されていること
    expect(result.qualityUniformityIndex).toBe(100.0);

    // 検証6: ダッシュボード表示用ステータスが正確に設定されること
    expect(result.dashboardStatus).toBe("EXCELLENT");

    // 検証7: データ検証が成功した場合、エラーメッセージが空であること
    expect(result.errorMessage).toBe("");

    // 検証8: 警告フラグが立たないこと
    expect(result.hasWarning).toBe(false);

    // 検証9: データが有効フラグが真であること
    expect(result.isDataValid).toBe(true);

    // 検証10: ダッシュボード反映用のメタデータが正確に設定されていること
    expect(result.dashboardMetadata).toEqual({
      assessorId: "ASS-001",
      workType: "型枠工事",
      amountBand: "100万～500万円",
      dataCollectionPeriodDays: 30,
      sampleCount: 250,
      lastUpdatedAt: expect.any(String),
      reflectionStatus: "SUCCESS",
    });

    // 検証11: UI更新対象のすべての要素が定義されていること
    expect(result.uiUpdateTargets).toContainEqual(
      expect.objectContaining({
        componentId: "improvement-degree-display",
        value: 100.0,
        displayFormat: "PERCENTAGE",
      })
    );

    expect(result.uiUpdateTargets).toContainEqual(
      expect.objectContaining({
        componentId: "processing-time-display",
        value: 100.0,
        displayFormat: "PERCENTAGE",
      })
    );

    expect(result.uiUpdateTargets).toContainEqual(
      expect.objectContaining({
        componentId: "quality-uniformity-display",
        value: 100.0,
        displayFormat: "PERCENTAGE",
      })
    );

    // 検証12: 改善度100%に対応する説明テキストが正確に設定されていること
    expect(result.improvementStatusDescription).toContain("最大改善");
    expect(result.improvementStatusDescription).toContain("100");

    // 検証13: ダッシュボードに反映可能な形式であること
    expect(result.isDashboardReady).toBe(true);

    // 検証14: 数値の精度が2桁小数点で保持されていること
    const improvementDegreeString = result.improvementDegree.toString();
    const decimalPart = improvementDegreeString.split(".")[1];
    expect(decimalPart === undefined || decimalPart.length <= 2).toBe(true);
  });
});