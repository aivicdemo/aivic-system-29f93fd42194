import { diagnoseAccuracyDeclineRootCause } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1151: [error] 精度低下根本原因特定機能 - 精度測定データが不完全または矛盾している場合、エラーハンドリングして無効なデータを除外する
  test("不完全または矛盾している精度測定データを検出・除外し、有効データのみで根本原因特定を実行", () => {
    // 欠落項目を含むレコード（ocrAccuracyが null）
    const recordWithNullOcr = {
      measurementId: "meas_001",
      measurementDate: "2024-01-15T10:00:00Z",
      ocrAccuracy: null,
      aiJudgmentAccuracy: 85.5,
      feedbackCount: 5,
      dataUpdateCount: 2,
    };

    // 欠落項目を含むレコード（aiJudgmentAccuracy が undefined）
    const recordWithUndefinedAiJudgment = {
      measurementId: "meas_002",
      measurementDate: "2024-01-16T10:00:00Z",
      ocrAccuracy: 82.0,
      aiJudgmentAccuracy: undefined,
      feedbackCount: 8,
      dataUpdateCount: 1,
    };

    // 矛盾するレコード（測定日が入力日より後）
    const recordWithFutureDate = {
      measurementId: "meas_003",
      measurementDate: "2025-12-31T23:59:59Z",
      inputDate: "2024-01-17T10:00:00Z",
      ocrAccuracy: 88.0,
      aiJudgmentAccuracy: 86.5,
      feedbackCount: 3,
      dataUpdateCount: 0,
    };

    // 矛盾するレコード（スコアが範囲外：ocrAccuracy > 100）
    const recordWithOutOfRangeScore = {
      measurementId: "meas_004",
      measurementDate: "2024-01-18T10:00:00Z",
      ocrAccuracy: 105.5,
      aiJudgmentAccuracy: 84.0,
      feedbackCount: 2,
      dataUpdateCount: 1,
    };

    // 矛盾するレコード（スコアが範囲外：aiJudgmentAccuracy < 0）
    const recordWithNegativeScore = {
      measurementId: "meas_005",
      measurementDate: "2024-01-19T10:00:00Z",
      ocrAccuracy: 79.0,
      aiJudgmentAccuracy: -5.0,
      feedbackCount: 1,
      dataUpdateCount: 0,
    };

    // 有効なレコード（良好なデータ）
    const validRecord1 = {
      measurementId: "meas_006",
      measurementDate: "2024-01-20T10:00:00Z",
      inputDate: "2024-01-19T18:00:00Z",
      ocrAccuracy: 92.0,
      aiJudgmentAccuracy: 90.5,
      feedbackCount: 0,
      dataUpdateCount: 1,
      assessorId: "assessor_001",
      constructionType: "建築工事",
      amountBand: "1000万～5000万",
    };

    // 有効なレコード（良好なデータ）
    const validRecord2 = {
      measurementId: "meas_007",
      measurementDate: "2024-01-21T10:00:00Z",
      inputDate: "2024-01-20T18:00:00Z",
      ocrAccuracy: 87.5,
      aiJudgmentAccuracy: 88.0,
      feedbackCount: 2,
      dataUpdateCount: 1,
      assessorId: "assessor_002",
      constructionType: "土木工事",
      amountBand: "5000万～1億",
    };

    const incompleteDataset = [
      recordWithNullOcr,
      recordWithUndefinedAiJudgment,
      recordWithFutureDate,
      recordWithOutOfRangeScore,
      recordWithNegativeScore,
      validRecord1,
      validRecord2,
    ];

    // 根本原因特定機能を実行
    const result = diagnoseAccuracyDeclineRootCause(incompleteDataset);

    // 無効なデータが正確に除外されたことを検証
    expect(result.validRecordsCount).toBe(2);
    expect(result.invalidRecordsCount).toBe(5);

    // 除外されたデータのうち、欠落項目によるもの
    const excludedForMissingFields = result.excludedRecords.filter(
      (record: any) =>
        record.exclusionReason === "MISSING_REQUIRED_FIELD" ||
        record.exclusionReason === "INCOMPLETE_DATA"
    );
    expect(excludedForMissingFields.length).toBe(2);

    // 除外されたデータのうち、矛盾により除外されたもの
    const excludedForContradiction = result.excludedRecords.filter(
      (record: any) =>
        record.exclusionReason === "MEASUREMENT_DATE_AFTER_INPUT_DATE" ||
        record.exclusionReason === "OUT_OF_RANGE_SCORE"
    );
    expect(excludedForContradiction.length).toBe(3);

    // エラーメッセージが記録されていることを検証
    expect(result.warningMessages.length).toBeGreaterThan(0);

    // 警告メッセージに含まれるべきキーワードを検証
    const allWarnings = result.warningMessages.join(" ");
    expect(allWarnings).toMatch(/欠落/);
    expect(allWarnings).toMatch(/矛盾/);
    expect(allWarnings).toMatch(/範囲外/);

    // 有効データのみを使用して根本原因特定が実行されたことを検証
    expect(result.rootCauseDiagnosis).toBeDefined();
    expect(result.rootCauseDiagnosis.analyzedRecordsCount).toBe(2);

    // 根本原因特定の結果が含まれていることを検証
    expect(result.rootCauseDiagnosis.primaryRootCause).toBeDefined();
    expect(result.rootCauseDiagnosis.rootCauseCandidates).toBeInstanceOf(Array);
    expect(result.rootCauseDiagnosis.rootCauseCandidates.length).toBeGreaterThan(
      0
    );

    // 各根本原因候補が適切に分類されていることを検証
    result.rootCauseDiagnosis.rootCauseCandidates.forEach((candidate: any) => {
      expect(
        [
          "DATA_QUALITY_DEGRADATION",
          "MODEL_DRIFT",
          "FORMAT_CHANGE",
          "INSUFFICIENT_TRAINING_DATA",
          "PRICE_BOOK_NOT_UPDATED",
          "SEASONAL_VARIATION_NOT_REFLECTED",
        ].includes(candidate.category)
      ).toBe(true);
      expect(typeof candidate.impactScore).toBe("number");
      expect(candidate.impactScore).toBeGreaterThanOrEqual(0);
      expect(candidate.impactScore).toBeLessThanOrEqual(100);
    });

    // 有効なデータから計算された精度改善前の基準値が正確であることを検証
    // validRecord1: OCR 92.0%, AI 90.5%
    // validRecord2: OCR 87.5%, AI 88.0%
    // 平均: OCR (92.0 + 87.5) / 2 = 89.75%、AI (90.5 + 88.0) / 2 = 89.25%
    expect(result.rootCauseDiagnosis.baselineOcrAccuracy).toBe(89.75);
    expect(result.rootCauseDiagnosis.baselineAiJudgmentAccuracy).toBe(89.25);

    // エラー例外がスローされずに結果が正常に返されたことを検証
    expect(result.status).toBe("SUCCESS");
    expect(result.error).toBeUndefined();
  });
});