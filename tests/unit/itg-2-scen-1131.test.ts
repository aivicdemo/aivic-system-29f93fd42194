import { measureBaselineAccuracy } from "../../src/logic/it-6-2-2-1";

describe("モデル更新前ベースライン測定機能", () => {
  test("SCEN-1131: 過去3ヶ月の査定実績からOCR精度とAI判定精度を正常に計算・記録", () => {
    // 入力データ：過去3ヶ月の査定実績
    const assessmentRecords = [
      {
        assessmentId: "ASS-001",
        ocrInputText: "工事費 1500000円",
        ocrOutputText: "工事費 1500000円",
        ocrIsCorrect: true,
        aiJudgmentInputAmount: 1500000,
        aiJudgmentExpectedAmount: 1500000,
        aiJudgmentIsCorrect: true,
        assessmentDate: new Date("2024-10-15T09:00:00Z"),
      },
      {
        assessmentId: "ASS-002",
        ocrInputText: "施工人数 5名",
        ocrOutputText: "施工人数 5名",
        ocrIsCorrect: true,
        aiJudgmentInputAmount: 2000000,
        aiJudgmentExpectedAmount: 2100000,
        aiJudgmentIsCorrect: false,
        assessmentDate: new Date("2024-10-20T10:30:00Z"),
      },
      {
        assessmentId: "ASS-003",
        ocrInputText: "単価 8000円/㎡",
        ocrOutputText: "単価 8000円/㎡",
        ocrIsCorrect: true,
        aiJudgmentInputAmount: 3000000,
        aiJudgmentExpectedAmount: 3000000,
        aiJudgmentIsCorrect: true,
        assessmentDate: new Date("2024-11-10T14:00:00Z"),
      },
      {
        assessmentId: "ASS-004",
        ocrInputText: "数量 50個",
        ocrOutputText: "数量 5個",
        ocrIsCorrect: false,
        aiJudgmentInputAmount: 1200000,
        aiJudgmentExpectedAmount: 1200000,
        aiJudgmentIsCorrect: true,
        assessmentDate: new Date("2024-11-25T11:15:00Z"),
      },
      {
        assessmentId: "ASS-005",
        ocrInputText: "工期 60日",
        ocrOutputText: "工期 60日",
        ocrIsCorrect: true,
        aiJudgmentInputAmount: 2500000,
        aiJudgmentExpectedAmount: 2450000,
        aiJudgmentIsCorrect: false,
        assessmentDate: new Date("2024-12-05T15:45:00Z"),
      },
    ];

    const baselinePeriodStart = new Date("2024-10-01T00:00:00Z");
    const baselinePeriodEnd = new Date("2024-12-31T23:59:59Z");

    // 実行
    const result = measureBaselineAccuracy({
      assessmentRecords,
      baselinePeriodStart,
      baselinePeriodEnd,
    });

    // 期待値の計算
    // OCR精度：正解数 4 / 総数 5 = 80%
    // OCR誤認識率：1 / 5 = 20%
    const expectedOcrAccuracy = 0.8;
    const expectedOcrErrorRate = 0.2;

    // AI判定精度：正解数 3 / 総数 5 = 60%
    // AI判定誤判定率：2 / 5 = 40%
    const expectedAiAccuracy = 0.6;
    const expectedAiErrorRate = 0.4;

    // Assertion: OCR精度が正しく計算されたことを確認
    expect(result.ocrAccuracy).toBe(expectedOcrAccuracy);
    expect(result.ocrErrorRate).toBe(expectedOcrErrorRate);

    // Assertion: AI判定精度が正しく計算されたことを確認
    expect(result.aiJudgmentAccuracy).toBe(expectedAiAccuracy);
    expect(result.aiJudgmentErrorRate).toBe(expectedAiErrorRate);

    // Assertion: 計測対象期間が正しく記録されたことを確認
    expect(result.baselinePeriodStart).toEqual(baselinePeriodStart);
    expect(result.baselinePeriodEnd).toEqual(baselinePeriodEnd);

    // Assertion: 対象レコード数が正しく記録されたことを確認
    expect(result.totalAssessmentCount).toBe(5);

    // Assertion: OCR正解数と誤認識数が正しく計算されたことを確認
    expect(result.ocrCorrectCount).toBe(4);
    expect(result.ocrIncorrectCount).toBe(1);

    // Assertion: AI判定正解数と誤判定数が正しく計算されたことを確認
    expect(result.aiJudgmentCorrectCount).toBe(3);
    expect(result.aiJudgmentIncorrectCount).toBe(2);

    // Assertion: ベースライン測定結果がシステムに記録されたことを確認
    expect(result.recordedAt).toBeDefined();
    expect(typeof result.recordedAt).toBe("string");

    // Assertion: 計測完了ステータスが正常であることを確認
    expect(result.status).toBe("completed");

    // Assertion: 記録されたベースラインIDが生成されたことを確認
    expect(result.baselineId).toBeDefined();
    expect(typeof result.baselineId).toBe("string");

    // Assertion: エラーフラグがfalseであることを確認（正常完了）
    expect(result.hasError).toBe(false);
    expect(result.errorMessage).toBeUndefined();
  });
});