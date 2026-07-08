import { analyzeTemporalCorrelationWithMissingData } from "../../src/logic/it-6-2-2-1";

describe("査定品質管理・標準化システム - 学習データ更新履歴との相関分析", () => {
  test("SCEN-1199: 時系列データの欠損がある場合に補間またはエラー通知が行われる", () => {
    // テストデータセット: 時系列データに欠損値を含む場合
    const temporalDataWithMissing = [
      {
        timestamp: "2024-01-01T09:00:00Z",
        ocrAccuracy: 92.5,
        aiJudgmentAccuracy: 88.3,
        learningDataUpdateCount: 150,
      },
      {
        timestamp: "2024-01-02T09:00:00Z",
        ocrAccuracy: null, // 欠損値
        aiJudgmentAccuracy: 87.9,
        learningDataUpdateCount: 150,
      },
      {
        timestamp: "2024-01-03T09:00:00Z",
        ocrAccuracy: 91.8,
        aiJudgmentAccuracy: null, // 欠損値
        learningDataUpdateCount: 155,
      },
      {
        timestamp: "2024-01-04T09:00:00Z",
        ocrAccuracy: 93.1,
        aiJudgmentAccuracy: 89.2,
        learningDataUpdateCount: 155,
      },
      {
        timestamp: "2024-01-05T09:00:00Z",
        ocrAccuracy: 92.9,
        aiJudgmentAccuracy: 88.7,
        learningDataUpdateCount: null, // 欠損値
      },
    ];

    // ケース1: 補間機能が有効な場合
    const resultWithInterpolation = analyzeTemporalCorrelationWithMissingData(
      temporalDataWithMissing,
      { enableInterpolation: true, interpolationMethod: "linear" }
    );

    // 補間が正常に行われたことを確認
    expect(resultWithInterpolation.status).toBe("success");
    expect(resultWithInterpolation.interpolated).toBe(true);
    expect(resultWithInterpolation.interpolationMethod).toBe("linear");

    // 補間後のデータ配列が欠損値なく満たされていることを確認
    expect(resultWithInterpolation.processedData).toHaveLength(5);
    expect(resultWithInterpolation.processedData[1].ocrAccuracy).toBe(92.15); // (92.5 + 91.8) / 2
    expect(resultWithInterpolation.processedData[2].aiJudgmentAccuracy).toBe(
      88.55
    ); // (87.9 + 89.2) / 2
    expect(resultWithInterpolation.processedData[4].learningDataUpdateCount).toBe(
      155
    ); // (155 + 155) / 2

    // 補間されたデータの位置情報が記録されていることを確認
    expect(resultWithInterpolation.interpolatedPositions).toEqual([
      {
        index: 1,
        field: "ocrAccuracy",
        originalValue: null,
        interpolatedValue: 92.15,
      },
      {
        index: 2,
        field: "aiJudgmentAccuracy",
        originalValue: null,
        interpolatedValue: 88.55,
      },
      {
        index: 4,
        field: "learningDataUpdateCount",
        originalValue: null,
        interpolatedValue: 155,
      },
    ]);

    // 補間方法と補間値の情報が表示用ニーザーメッセージに含まれていることを確認
    expect(resultWithInterpolation.userMessage).toContain("補間");
    expect(resultWithInterpolation.userMessage).toContain("linear");
    expect(resultWithInterpolation.userMessage).toContain("3");

    // ケース2: 補間機能が無効な場合（エラー通知）
    const resultWithoutInterpolation =
      analyzeTemporalCorrelationWithMissingData(temporalDataWithMissing, {
        enableInterpolation: false,
      });

    // エラーステータスが返されることを確認
    expect(resultWithoutInterpolation.status).toBe("error");
    expect(resultWithoutInterpolation.interpolated).toBe(false);

    // エラーダイアログの内容を確認
    expect(resultWithoutInterpolation.errorDialog.displayed).toBe(true);
    expect(resultWithoutInterpolation.errorDialog.title).toBe(
      "時系列データに欠損値が検出されました"
    );

    // 欠損データの位置・範囲・件数が正確に通知されていることを確認
    expect(resultWithoutInterpolation.errorDialog.missingDataDetails).toEqual({
      totalMissingCount: 3,
      missingPositions: [
        {
          index: 1,
          timestamp: "2024-01-02T09:00:00Z",
          missingFields: ["ocrAccuracy"],
        },
        {
          index: 2,
          timestamp: "2024-01-03T09:00:00Z",
          missingFields: ["aiJudgmentAccuracy"],
        },
        {
          index: 4,
          timestamp: "2024-01-05T09:00:00Z",
          missingFields: ["learningDataUpdateCount"],
        },
      ],
      affectedDateRange: {
        startDate: "2024-01-02T09:00:00Z",
        endDate: "2024-01-05T09:00:00Z",
      },
    });

    // エラーメッセージが業務的に理解可能であることを確認
    expect(resultWithoutInterpolation.errorDialog.message).toContain(
      "3件の欠損値"
    );
    expect(resultWithoutInterpolation.errorDialog.message).toContain("2024-01");

    // ユーザーが対応可能な状態であることを確認（推奨アクション含む）
    expect(resultWithoutInterpolation.errorDialog.recommendedActions).toContain(
      "データを修正して再度アップロード"
    );
    expect(
      resultWithoutInterpolation.errorDialog.recommendedActions
    ).toContain("補間機能を有効にして再実行");

    // ケース3: ログに処理結果が適切に記録されていることを確認
    const logRecordInterpolation = resultWithInterpolation.logRecord;
    expect(logRecordInterpolation).toBeDefined();
    expect(logRecordInterpolation.processType).toBe(
      "temporal_correlation_analysis"
    );
    expect(logRecordInterpolation.inputDataSize).toBe(5);
    expect(logRecordInterpolation.missingDataCount).toBe(3);
    expect(logRecordInterpolation.interpolationApplied).toBe(true);
    expect(logRecordInterpolation.interpolationMethod).toBe("linear");
    expect(logRecordInterpolation.processingStatus).toBe("completed");
    expect(logRecordInterpolation.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    const logRecordNoInterpolation = resultWithoutInterpolation.logRecord;
    expect(logRecordNoInterpolation.processType).toBe(
      "temporal_correlation_analysis"
    );
    expect(logRecordNoInterpolation.inputDataSize).toBe(5);
    expect(logRecordNoInterpolation.missingDataCount).toBe(3);
    expect(logRecordNoInterpolation.interpolationApplied).toBe(false);
    expect(logRecordNoInterpolation.processingStatus).toBe("error");
    expect(logRecordNoInterpolation.errorCode).toBe("MISSING_DATA_DETECTED");

    // ケース4: 相関分析の計算が補间後のデータで正常に進行することを確認
    expect(resultWithInterpolation.correlationAnalysis).toBeDefined();
    expect(resultWithInterpolation.correlationAnalysis.correlationCoefficient).toBeGreaterThanOrEqual(
      -1
    );
    expect(resultWithInterpolation.correlationAnalysis.correlationCoefficient).toBeLessThanOrEqual(
      1
    );
    expect(typeof resultWithInterpolation.correlationAnalysis.pValue).toBe(
      "number"
    );
  });
});