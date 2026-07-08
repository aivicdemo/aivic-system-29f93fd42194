import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  executeModelRetraining,
  measureOCRAccuracy,
  measureAIJudgmentAccuracy,
} from "../../src/logic/it-6-2-1-1";

describe("Learning Data Update and Model Retraining Execution", () => {
  let fetchMock: any;

  beforeEach(() => {
    const fetchMockModule = require("jest-fetch-mock");
    fetchMock = fetchMockModule.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-1092
  test("should successfully retrain model with past project data and price book, then remeasure OCR and AI judgment accuracy", async () => {
    // Setup: 学習データセット情報
    const pastProjectDataset = {
      id: "dataset_past_2024_001",
      name: "Past Project Data 2024",
      recordCount: 1250,
      regions: ["Tokyo", "Osaka", "Nagoya"],
      workTypes: ["Building", "Civil", "Electrical"],
      createdAt: "2024-01-15T10:00:00Z",
    };

    const priceBookData = {
      id: "pricebook_v3_2024",
      version: "3.0",
      publicationDate: "2024-01-10T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
      itemCount: 8500,
    };

    const retrainingRequest = {
      datasetIds: [pastProjectDataset.id, priceBookData.id],
      modelVersion: "model_v2",
      retrainingType: "full_retrain",
      validationDataRatio: 0.2,
      testDataRatio: 0.1,
    };

    // Arrange: モデル再学習前の基準精度値
    const baselineOCRAccuracy = 0.887;
    const baselineAIJudgmentAccuracy = 0.834;

    // Mock: モデル再学習の実行結果
    fetchMock.mockResponseOnce(
      JSON.stringify({
        retrainingId: "retrain_exec_20240115_001",
        status: "completed",
        modelVersion: "model_v2_retrained",
        trainingStartedAt: "2024-01-15T11:30:00Z",
        trainingCompletedAt: "2024-01-15T13:45:30Z",
        trainingDurationSeconds: 8130,
        datasetCount: 2,
        totalRecordsUsed: 9750,
        trainingMetrics: {
          finalLoss: 0.1245,
          validationAccuracy: 0.9124,
        },
      }),
      { status: 200 }
    );

    // Step 1: モデル再学習を実行
    const retrainingResult = await executeModelRetraining(retrainingRequest);

    expect(retrainingResult).toBeDefined();
    expect(retrainingResult.status).toBe("completed");
    expect(retrainingResult.modelVersion).toBe("model_v2_retrained");
    expect(retrainingResult.trainingDurationSeconds).toBe(8130);
    expect(retrainingResult.totalRecordsUsed).toBe(9750);

    // Reset mock for OCR accuracy measurement
    fetchMock.resetMocks();

    // Mock: OCR精度測定の結果（再学習後の改善を反映）
    const testDatasetOCR = {
      sampleSize: 500,
      totalItems: 2350,
      correctReadings: 2155,
      partialMatches: 152,
      misreadings: 43,
    };

    const measurementDateOCR = "2024-01-15T14:00:00Z";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        measurementId: "ocr_measure_20240115_001",
        modelVersion: "model_v2_retrained",
        measurementDate: measurementDateOCR,
        sampleSize: testDatasetOCR.sampleSize,
        totalItems: testDatasetOCR.totalItems,
        correctReadings: testDatasetOCR.correctReadings,
        partialMatches: testDatasetOCR.partialMatches,
        misreadings: testDatasetOCR.misreadings,
        ocrAccuracy: 0.917,
        ocrAccuracyPercentage: 91.7,
        improvementRate: 3.0,
        improvementRatePercentage: "3.0%",
        previousOCRAccuracy: 0.887,
        status: "completed",
      }),
      { status: 200 }
    );

    // Step 2: OCR精度を測定
    const ocrMeasurementResult = await measureOCRAccuracy({
      modelVersion: "model_v2_retrained",
      testDatasetId: "dataset_test_ocr_001",
    });

    expect(ocrMeasurementResult).toBeDefined();
    expect(ocrMeasurementResult.ocrAccuracy).toBe(0.917);
    expect(ocrMeasurementResult.ocrAccuracyPercentage).toBe(91.7);
    expect(ocrMeasurementResult.improvementRate).toBe(3.0);
    expect(ocrMeasurementResult.improvementRatePercentage).toBe("3.0%");
    expect(ocrMeasurementResult.status).toBe("completed");
    expect(ocrMeasurementResult.measurementDate).toBe(measurementDateOCR);

    // Verify: OCR精度が基準値から改善されていることを検証
    expect(ocrMeasurementResult.ocrAccuracy).toBeGreaterThan(baselineOCRAccuracy);
    const expectedOCRImprovement = ocrMeasurementResult.ocrAccuracy - baselineOCRAccuracy;
    expect(expectedOCRImprovement).toBeCloseTo(0.03, 2);

    // Reset mock for AI judgment accuracy measurement
    fetchMock.resetMocks();

    // Mock: AI判定精度測定の結果（再学習後の改善を反映）
    const testDatasetAI = {
      sampleSize: 480,
      totalCases: 2100,
      correctJudgments: 1802,
      partialCorrects: 245,
      incorrectJudgments: 53,
    };

    const measurementDateAI = "2024-01-15T14:15:00Z";

    fetchMock.mockResponseOnce(
      JSON.stringify({
        measurementId: "ai_judge_measure_20240115_001",
        modelVersion: "model_v2_retrained",
        measurementDate: measurementDateAI,
        sampleSize: testDatasetAI.sampleSize,
        totalCases: testDatasetAI.totalCases,
        correctJudgments: testDatasetAI.correctJudgments,
        partialCorrects: testDatasetAI.partialCorrects,
        incorrectJudgments: testDatasetAI.incorrectJudgments,
        aiJudgmentAccuracy: 0.858,
        aiJudgmentAccuracyPercentage: 85.8,
        improvementRate: 2.4,
        improvementRatePercentage: "2.4%",
        previousAIJudgmentAccuracy: 0.834,
        status: "completed",
      }),
      { status: 200 }
    );

    // Step 3: AI判定精度を測定
    const aiJudgmentMeasurementResult = await measureAIJudgmentAccuracy({
      modelVersion: "model_v2_retrained",
      testDatasetId: "dataset_test_ai_judgment_001",
    });

    expect(aiJudgmentMeasurementResult).toBeDefined();
    expect(aiJudgmentMeasurementResult.aiJudgmentAccuracy).toBe(0.858);
    expect(aiJudgmentMeasurementResult.aiJudgmentAccuracyPercentage).toBe(85.8);
    expect(aiJudgmentMeasurementResult.improvementRate).toBe(2.4);
    expect(aiJudgmentMeasurementResult.improvementRatePercentage).toBe("2.4%");
    expect(aiJudgmentMeasurementResult.status).toBe("completed");
    expect(aiJudgmentMeasurementResult.measurementDate).toBe(measurementDateAI);

    // Verify: AI判定精度が基準値から改善されていることを検証
    expect(aiJudgmentMeasurementResult.aiJudgmentAccuracy).toBeGreaterThan(
      baselineAIJudgmentAccuracy
    );
    const expectedAIImprovement =
      aiJudgmentMeasurementResult.aiJudgmentAccuracy - baselineAIJudgmentAccuracy;
    expect(expectedAIImprovement).toBeCloseTo(0.024, 3);

    // Final Verification: 再計測後の精度が基準精度から改善されている
    expect(ocrMeasurementResult.ocrAccuracy).toBeGreaterThan(baselineOCRAccuracy);
    expect(aiJudgmentMeasurementResult.aiJudgmentAccuracy).toBeGreaterThan(
      baselineAIJudgmentAccuracy
    );

    // Verify: 再計測データが前回値から更新されていることを確認
    expect(ocrMeasurementResult.previousOCRAccuracy).toBe(baselineOCRAccuracy);
    expect(aiJudgmentMeasurementResult.previousAIJudgmentAccuracy).toBe(
      baselineAIJudgmentAccuracy
    );

    // Verify: 複数の精度指標が同時に正常に表示される（一元表示の検証）
    const displayedMetrics = {
      ocrAccuracy: ocrMeasurementResult.ocrAccuracy,
      ocrAccuracyPercentage: ocrMeasurementResult.ocrAccuracyPercentage,
      aiJudgmentAccuracy: aiJudgmentMeasurementResult.aiJudgmentAccuracy,
      aiJudgmentAccuracyPercentage:
        aiJudgmentMeasurementResult.aiJudgmentAccuracyPercentage,
      ocrImprovementPercentage: ocrMeasurementResult.improvementRatePercentage,
      aiJudgmentImprovementPercentage:
        aiJudgmentMeasurementResult.improvementRatePercentage,
    };

    expect(displayedMetrics.ocrAccuracy).toBe(0.917);
    expect(displayedMetrics.ocrAccuracyPercentage).toBe(91.7);
    expect(displayedMetrics.aiJudgmentAccuracy).toBe(0.858);
    expect(displayedMetrics.aiJudgmentAccuracyPercentage).toBe(85.8);
    expect(displayedMetrics.ocrImprovementPercentage).toBe("3.0%");
    expect(displayedMetrics.aiJudgmentImprovementPercentage).toBe("2.4%");
  });
});