import { detectAnomalousIndicators } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析機能", () => {
  // SCEN-1190
  test("すべての指標が正常値の場合は異常検出が発生しない", () => {
    // 入力: すべての指標が正常値範囲内のテストデータ
    const testData = {
      ocrAccuracy: 92.5,
      aiJudgmentAccuracy: 88.3,
      learningModelUpdateFrequency: 2,
      userFeedbackCount: 3,
      ocrAccuracyThreshold: 85,
      aiJudgmentAccuracyThreshold: 80,
      learningModelUpdateFrequencyThreshold: 1,
      userFeedbackCountThreshold: 50,
      detectionTimestamp: new Date("2024-12-15T09:00:00Z"),
      systemLogBuffer: [] as Array<{
        timestamp: Date;
        eventType: string;
        message: string;
      }>,
    };

    // 実行: 異常指標検出ロジックに入力
    const result = detectAnomalousIndicators(testData);

    // 期待結果の検証
    // 1. 異常フラグが false である
    expect(result.anomalyDetected).toBe(false);

    // 2. 優先度付けキューが空である
    expect(result.priorityQueue).toEqual([]);
    expect(result.priorityQueue.length).toBe(0);

    // 3. 異常フラグは null でなく false
    expect(result.anomalyDetected).not.toBeNull();

    // 4. システムログに異常検出イベント記録がないことを確認
    const anomalyEvents = testData.systemLogBuffer.filter(
      (log) => log.eventType === "ANOMALY_DETECTED"
    );
    expect(anomalyEvents.length).toBe(0);

    // 5. 検出された異常指標の詳細リストが空である
    expect(result.detectedAnomalies).toEqual([]);

    // 6. 最後の検出時刻がレスポンスに含まれている
    expect(result.lastDetectionTime).toBeDefined();
    expect(result.lastDetectionTime).toEqual(new Date("2024-12-15T09:00:00Z"));

    // 7. すべてのスコアが正常値として評価されている
    expect(result.ocrAccuracyStatus).toBe("normal");
    expect(result.aiJudgmentAccuracyStatus).toBe("normal");
    expect(result.learningModelUpdateFrequencyStatus).toBe("normal");
    expect(result.userFeedbackCountStatus).toBe("normal");

    // 8. 総合リスクスコアが低い状態である
    expect(result.overallRiskScore).toBeLessThan(20);
  });
});