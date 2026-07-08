import { aggregateAssessmentAccuracyMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1450
  test("モデル更新回帰テスト精度判定機能 - 更新後のOCR精度が更新前より低下した場合に本番適用が却下される", () => {
    // 既存モデル（v1.0）の精度メトリクス
    const previousModelVersion = "v1.0";
    const previousOcrAccuracy = 95.5;

    // 新しいモデル（v1.1）の精度メトリクス
    const newModelVersion = "v1.1";
    const newOcrAccuracy = 94.2;

    // 精度低下判定基準（許容範囲）
    const allowableAccuracyDeclineTreshold = -2.0;

    // 精度差分を計算
    const accuracyDifference = newOcrAccuracy - previousOcrAccuracy;

    // 回帰テスト入力データ
    const regressionTestInput = {
      previousModel: {
        version: previousModelVersion,
        ocrAccuracy: previousOcrAccuracy,
      },
      newModel: {
        version: newModelVersion,
        ocrAccuracy: newOcrAccuracy,
      },
      allowableDeclineTreshold: allowableAccuracyDeclineTreshold,
    };

    // 本番適用判定ロジックを実行
    const result = aggregateAssessmentAccuracyMetrics(regressionTestInput);

    // 精度低下が基準値内（-1.3% は -2.0% より大きい）であるため、本番適用が却下される
    expect(result.productionDeploymentApproved).toBe(false);
    expect(result.accuracyDifference).toBe(-1.3);
    expect(result.rejectionReason).toMatch(/精度低下/);
    expect(result.administratorNotificationSent).toBe(true);
    expect(result.autoDeploymentExecuted).toBe(false);
  });
});