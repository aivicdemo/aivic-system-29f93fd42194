import { validateModelRetrainingAndRollback } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-1506: AI判定モデル再学習精度検証 - 再学習後のOCR読取精度が合格基準を下回った場合、不合格判定を記録し学習データロールバック実行", () => {
    // ===== 1. テストデータの準備 =====
    // 現在の学習モデルのバージョンを記録
    const previousModelVersion = "v2.3.1";
    const previousOcrAccuracy = 82.5;
    const previousJudgmentAccuracy = 85.3;

    // OCR読取精度が合格基準を下回るテストデータセット（精度70%未満）を準備
    const testDatasetWithLowAccuracy = {
      totalSamples: 100,
      correctReadings: 68, // 68% = 合格基準80%未満
      incorrectReadings: 32,
      ambiguousReadings: 0,
      ocrAccuracyRate: 68.0,
    };

    // 合格基準の設定
    const passingThresholdOcr = 80.0;
    const passingThresholdJudgment = 82.0;

    // 学習データの更新内容
    const trainingDataUpdate = {
      historicalCaseDataAdditions: 245,
      materialPriceBookVersionUpdate: "2024Q1",
      seasonalAdjustmentFactorUpdate: 1.08,
      regionalCoverageExpansion: ["Hokkaido", "Kyushu"],
    };

    // ===== 2. AI判定モデルの再学習処理を実行 =====
    const retrainingExecutionResult = validateModelRetrainingAndRollback({
      previousModelVersion,
      previousOcrAccuracy,
      previousJudgmentAccuracy,
      testDataset: testDatasetWithLowAccuracy,
      trainingDataUpdate,
      passingThresholdOcr,
      passingThresholdJudgment,
      newModelVersion: "v2.4.0",
    });

    // ===== 3. 再学習後のOCR読取精度を検証 =====
    // 再学習後の精度が合格基準を下回ることを確認
    expect(retrainingExecutionResult.postRetrainingOcrAccuracy).toBe(68.0);
    expect(retrainingExecutionResult.postRetrainingOcrAccuracy).toBeLessThan(
      passingThresholdOcr
    );

    // ===== 4. 検証結果が合格基準を下回ることを確認 =====
    expect(retrainingExecutionResult.validationResult).toBe("failed");

    // ===== 5. システムが不合格判定を記録するプロセスを監視 =====
    expect(retrainingExecutionResult.failureRecorded).toBe(true);
    expect(retrainingExecutionResult.failureTimestamp).toBeDefined();

    // ===== 6. 不合格判定のログ/レコードが正確に記録されたことを確認 =====
    expect(retrainingExecutionResult.failureLog).toEqual({
      modelVersion: "v2.4.0",
      failureReason: "OCR_ACCURACY_BELOW_THRESHOLD",
      ocrAccuracyRate: 68.0,
      requiredThreshold: 80.0,
      deficitPercentage: 12.0,
      timestamp: expect.any(String),
      recordedBySystem: true,
    });

    // ===== 7. 学習データロールバック実行の指示がシステムから発行されることを確認 =====
    expect(retrainingExecutionResult.rollbackInitiated).toBe(true);
    expect(retrainingExecutionResult.rollbackReason).toBe(
      "OCR_ACCURACY_THRESHOLD_VIOLATION"
    );

    // ===== 8. ロールバック処理が完了し、モデルが前回の正常なバージョンに戻されたことを検証 =====
    expect(retrainingExecutionResult.rollbackCompleted).toBe(true);
    expect(retrainingExecutionResult.activeModelVersion).toBe(
      previousModelVersion
    );

    // ===== 9. ロールバック後のモデルが合格基準を満たしていることを確認 =====
    expect(retrainingExecutionResult.postRollbackOcrAccuracy).toBe(
      previousOcrAccuracy
    );
    expect(retrainingExecutionResult.postRollbackOcrAccuracy).toBeGreaterThan(
      passingThresholdOcr
    );

    expect(retrainingExecutionResult.postRollbackJudgmentAccuracy).toBe(
      previousJudgmentAccuracy
    );
    expect(retrainingExecutionResult.postRollbackJudgmentAccuracy).toBeGreaterThan(
      passingThresholdJudgment
    );

    // ===== 10. ロールバック完了ログの内容を確認 =====
    expect(retrainingExecutionResult.rollbackLog).toEqual({
      rollbackSourceVersion: "v2.4.0",
      rollbackTargetVersion: previousModelVersion,
      rollbackReason: "FAILED_VALIDATION",
      restoreddOcrAccuracy: previousOcrAccuracy,
      restoredJudgmentAccuracy: previousJudgmentAccuracy,
      timestamp: expect.any(String),
      systemExecuted: true,
    });

    // ===== 11. 最終検証: 再学習失敗後のシステム状態が正常であることを確認 =====
    expect(retrainingExecutionResult.finalSystemState).toEqual({
      modelOperational: true,
      activeModelVersion: previousModelVersion,
      ocrAccuracyRate: previousOcrAccuracy,
      judgmentAccuracyRate: previousJudgmentAccuracy,
      failedModelVersionLocked: true,
      readyForNextRetrainingAttempt: true,
    });
  });
});