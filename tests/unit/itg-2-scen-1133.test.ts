import { measureBaselineBeforeForecast } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1133: [edge] モデル更新前ベースライン測定機能 - 過去3ヶ月の境界日時（初日・最終日）のデータを正確に含める", () => {
    // 固定基準日時: 2024-06-15T12:00:00Z
    const referenceDate = new Date("2024-06-15T12:00:00Z");

    // 過去3ヶ月の期間計算
    const endDate = new Date(referenceDate);
    endDate.setDate(endDate.getDate() - 1); // 前日23:59:59を含めるため
    const endOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const startDate = new Date(referenceDate);
    startDate.setMonth(startDate.getMonth() - 3);
    startDate.setDate(1);
    const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 0, 0, 0, 0);

    // テストデータ作成
    const testRecords = [
      // 過去3ヶ月初日のレコード (2024-03-01 00:00:00)
      {
        id: "rec_001",
        timestamp: new Date("2024-03-01T00:00:00Z"),
        ocrAccuracy: 92.5,
        aiJudgmentAccuracy: 88.3,
        processedCount: 42,
      },
      {
        id: "rec_002",
        timestamp: new Date("2024-03-01T00:00:00Z"),
        ocrAccuracy: 91.8,
        aiJudgmentAccuracy: 87.9,
        processedCount: 38,
      },
      {
        id: "rec_003",
        timestamp: new Date("2024-03-01T00:15:30Z"),
        ocrAccuracy: 93.1,
        aiJudgmentAccuracy: 89.2,
        processedCount: 45,
      },
      // 過去3ヶ月最終日のレコード (2024-06-14 23:59:59)
      {
        id: "rec_004",
        timestamp: new Date("2024-06-14T23:59:59Z"),
        ocrAccuracy: 94.2,
        aiJudgmentAccuracy: 90.1,
        processedCount: 51,
      },
      {
        id: "rec_005",
        timestamp: new Date("2024-06-14T23:59:59Z"),
        ocrAccuracy: 93.7,
        aiJudgmentAccuracy: 89.5,
        processedCount: 49,
      },
      {
        id: "rec_006",
        timestamp: new Date("2024-06-14T23:30:00Z"),
        ocrAccuracy: 93.4,
        aiJudgmentAccuracy: 89.0,
        processedCount: 47,
      },
      // 範囲内の中間日時レコード
      {
        id: "rec_007",
        timestamp: new Date("2024-04-15T14:30:00Z"),
        ocrAccuracy: 92.0,
        aiJudgmentAccuracy: 88.5,
        processedCount: 44,
      },
      {
        id: "rec_008",
        timestamp: new Date("2024-05-20T10:00:00Z"),
        ocrAccuracy: 91.5,
        aiJudgmentAccuracy: 87.8,
        processedCount: 40,
      },
      // 範囲外：初日より前 (2024-02-29 23:59:59)
      {
        id: "rec_exclude_001",
        timestamp: new Date("2024-02-29T23:59:59Z"),
        ocrAccuracy: 90.0,
        aiJudgmentAccuracy: 86.0,
        processedCount: 35,
      },
      // 範囲外：最終日より後 (2024-06-15 00:00:00)
      {
        id: "rec_exclude_002",
        timestamp: new Date("2024-06-15T00:00:00Z"),
        ocrAccuracy: 95.0,
        aiJudgmentAccuracy: 91.0,
        processedCount: 55,
      },
    ];

    // ベースライン測定を実行
    const result = measureBaselineBeforeForecast({
      referenceDate: referenceDate,
      dataRecords: testRecords,
      lookbackMonths: 3,
    });

    // 検証1: 初日のレコードが全て含まれていることを確認
    const firstDayRecords = result.extractedRecords.filter(
      (rec: { timestamp: Date; id: string }) =>
        rec.timestamp.toISOString().startsWith("2024-03-01")
    );
    expect(firstDayRecords).toHaveLength(3);
    expect(firstDayRecords.map((r: { id: string }) => r.id)).toEqual(
      expect.arrayContaining(["rec_001", "rec_002", "rec_003"])
    );

    // 検証2: 最終日のレコードが全て含まれていることを確認
    const lastDayRecords = result.extractedRecords.filter(
      (rec: { timestamp: Date; id: string }) =>
        rec.timestamp.toISOString().startsWith("2024-06-14")
    );
    expect(lastDayRecords).toHaveLength(3);
    expect(lastDayRecords.map((r: { id: string }) => r.id)).toEqual(
      expect.arrayContaining(["rec_004", "rec_005", "rec_006"])
    );

    // 検証3: 初日より前のレコードが除外されていることを確認
    const excludedBeforeFirstDay = result.extractedRecords.filter(
      (rec: { id: string }) => rec.id === "rec_exclude_001"
    );
    expect(excludedBeforeFirstDay).toHaveLength(0);

    // 検証4: 最終日より後のレコードが除外されていることを確認
    const excludedAfterLastDay = result.extractedRecords.filter(
      (rec: { id: string }) => rec.id === "rec_exclude_002"
    );
    expect(excludedAfterLastDay).toHaveLength(0);

    // 検証5: 中間日時のレコードが含まれていることを確認
    const middleRecords = result.extractedRecords.filter(
      (rec: { id: string }) =>
        rec.id === "rec_007" || rec.id === "rec_008"
    );
    expect(middleRecords).toHaveLength(2);

    // 検証6: 抽出されたレコード総数が正確であることを確認 (初日3件 + 最終日3件 + 中間2件 = 8件)
    expect(result.extractedRecords).toHaveLength(8);

    // 検証7: OCR精度のベースラインが正確に計算されていることを確認
    // 平均値 = (92.5 + 91.8 + 93.1 + 94.2 + 93.7 + 93.4 + 92.0 + 91.5) / 8 = 745.2 / 8 = 93.15
    expect(result.baselineOcrAccuracy).toBe(93.15);

    // 検証8: AI判定精度のベースラインが正確に計算されていることを確認
    // 平均値 = (88.3 + 87.9 + 89.2 + 90.1 + 89.5 + 89.0 + 88.5 + 87.8) / 8 = 710.3 / 8 = 88.7875
    expect(result.baselineAiJudgmentAccuracy).toBe(88.7875);

    // 検証9: 処理件数の合計が正確であることを確認
    // 合計 = 42 + 38 + 45 + 51 + 49 + 47 + 44 + 40 = 356
    expect(result.totalProcessedCount).toBe(356);

    // 検証10: 期間情報が正確であることを確認
    expect(result.periodStart).toEqual(new Date("2024-03-01T00:00:00Z"));
    expect(result.periodEnd).toEqual(new Date("2024-06-14T23:59:59Z"));

    // 検証11: タイムゾーン変換考慮時のレコード抽出検証
    // UTC+9 (日本時間) の場合の境界値を検証
    const result_jst = measureBaselineBeforeForecast({
      referenceDate: referenceDate,
      dataRecords: testRecords,
      lookbackMonths: 3,
      timezoneOffset: 9, // JST = UTC+9
    });

    // タイムゾーン変換後も初日のレコードが含まれていることを確認
    const firstDayRecords_jst = result_jst.extractedRecords.filter(
      (rec: { timestamp: Date }) =>
        rec.timestamp.toISOString().startsWith("2024-03-01")
    );
    expect(firstDayRecords_jst.length).toBeGreaterThanOrEqual(3);

    // タイムゾーン変換後も最終日のレコードが含まれていることを確認
    const lastDayRecords_jst = result_jst.extractedRecords.filter(
      (rec: { timestamp: Date }) =>
        rec.timestamp.toISOString().startsWith("2024-06-14")
    );
    expect(lastDayRecords_jst.length).toBeGreaterThanOrEqual(3);

    // 検証12: 測定結果の統計情報が正確であることを確認
    expect(result.statistics).toMatchObject({
      ocrAccuracyMin: 91.5,
      ocrAccuracyMax: 94.2,
      aiJudgmentAccuracyMin: 87.8,
      aiJudgmentAccuracyMax: 90.1,
      recordCount: 8,
    });

    // 検証13: 結果メタデータの検証
    expect(result.measurementTimestamp).toBeDefined();
    expect(result.dataQualityScore).toBeGreaterThan(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});