import { determineModelRetrainingTiming } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-784
  test("モデル再学習実行タイミング自動判定機能 - 新しい物価本が公開された場合にモデル再学習の実行タイミングが判定される", () => {
    // 初期状態: モデル再学習実行タイミング自動判定機能の初期状態を確認
    const lastRetrainingDate = new Date("2024-01-15T09:00:00Z");
    const currentDate = new Date("2024-03-20T14:30:00Z");
    
    // 新しい物価本の公開イベント通知
    const priceBookEvent = {
      eventType: "price_book_published",
      newVersionNumber: "2024-Q1-v2",
      publishedDate: new Date("2024-03-20T10:00:00Z"),
      previousVersionNumber: "2024-Q1-v1",
      affectedRegions: ["tokyo", "osaka", "nagoya"],
      affectedConstructionTypes: ["building", "civil"],
    };

    // システムが新しい物価本の公開を検出してモデル再学習実行タイミング判定
    const input = {
      currentDate,
      lastRetrainingDate,
      priceBookEvent,
      currentOcrAccuracy: 0.92,
      currentAiJudgmentAccuracy: 0.88,
      accuracyThreshold: 0.85,
      minDaysSinceLastRetraining: 30,
      dataAvailability: {
        pastCaseDataCount: 1250,
        minRequiredCaseCount: 500,
        priceBookCoverageRate: 0.95,
      },
      systemLog: [],
    };

    // モデル再学習実行タイミング判定ロジック実行
    const result = determineModelRetrainingTiming(input);

    // モデル再学習実行タイミングが『実行が必要』と判定されることを確認
    expect(result.shouldRetrain).toBe(true);
    expect(result.retrainingReason).toBe("price_book_published");
    expect(result.retrainingPriority).toBe("high");

    // 判定の詳細情報を検証
    expect(result.recommendedExecutionDate).toEqual(new Date("2024-03-21T00:00:00Z"));
    expect(result.estimatedRetrainingDurationMinutes).toBe(120);
    expect(result.impactedRegions).toEqual(["tokyo", "osaka", "nagoya"]);
    expect(result.impactedConstructionTypes).toEqual(["building", "civil"]);

    // 判定結果がシステムログに記録
    expect(result.systemLog).toBeDefined();
    expect(result.systemLog.length).toBeGreaterThan(0);
    
    const logEntry = result.systemLog[result.systemLog.length - 1];
    expect(logEntry.timestamp).toEqual(currentDate);
    expect(logEntry.eventType).toBe("model_retraining_timing_determined");
    expect(logEntry.status).toBe("success");
    expect(logEntry.decision).toBe("execute_required");

    // 判定根拠の詳細検証
    expect(result.judgmentBasis).toBeDefined();
    expect(result.judgmentBasis.priceBookVersionChangeDetected).toBe(true);
    expect(result.judgmentBasis.daysSinceLastRetraining).toBe(64);
    expect(result.judgmentBasis.ocrAccuracyMeetsThreshold).toBe(true);
    expect(result.judgmentBasis.aiJudgmentAccuracyMeetsThreshold).toBe(true);
    expect(result.judgmentBasis.dataAvailabilityAdequate).toBe(true);

    // 実行計画の確認
    expect(result.executionPlan).toBeDefined();
    expect(result.executionPlan.targetExecutionDate).toEqual(new Date("2024-03-21T00:00:00Z"));
    expect(result.executionPlan.resourceAllocationLevel).toBe("standard");
    expect(result.executionPlan.affectedModels).toContain("ocr_model");
    expect(result.executionPlan.affectedModels).toContain("ai_judgment_model");
    expect(result.executionPlan.rollbackPlanRequired).toBe(true);
  });
});