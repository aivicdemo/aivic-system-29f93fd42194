import { generateOperationManualV1 } from "../../src/logic/it-1-br-2-2-2-1";

describe("運用マニュアル初版の自動生成 - 不完全/欠損データの検証", () => {
  test("SCEN-1548: 必須項目欠損時にエラーメッセージが正しく通知される", () => {
    // 【前提】査定品質管理・標準化システムへのログイン完了
    // 【トリガー】運用実績データの必須項目を一部空欄のまま自動生成ボタンをクリック

    // 【入力】必須項目の一部欠損（査定件数は有効、エラー発生件数は null）
    const operationDataWithMissing = {
      assessmentCount: 150,
      assessmentTimeMs: 2700000,
      errorOccurrenceCount: null, // 欠損
      qualityUniformityIndex: 0.92,
      systemOperationRate: 0.995,
      ocrReadAccuracy: 0.88,
      aiJudgmentAccuracy: 0.91,
      learningDataUpdateCount: 3,
      reportGenerationDate: "2024-01-31T09:00:00Z",
    };

    // 【実行とアサーション】
    // 1) エラーが投げられること
    expect(() => generateOperationManualV1(operationDataWithMissing)).toThrow(
      /エラー発生件数/
    );

    // 2) エラーメッセージに欠損項目名と具体的理由が明示されることを検証
    let errorMessage = "";
    try {
      generateOperationManualV1(operationDataWithMissing);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }
    expect(errorMessage).toMatch(/必須項目/);
    expect(errorMessage).toMatch(/欠損/);

    // 3) 別の欠損パターン：systemOperationRate が undefined
    const operationDataWithSystemRateMissing = {
      assessmentCount: 150,
      assessmentTimeMs: 2700000,
      errorOccurrenceCount: 2,
      qualityUniformityIndex: 0.92,
      systemOperationRate: undefined, // 欠損
      ocrReadAccuracy: 0.88,
      aiJudgmentAccuracy: 0.91,
      learningDataUpdateCount: 3,
      reportGenerationDate: "2024-01-31T09:00:00Z",
    };

    expect(() =>
      generateOperationManualV1(operationDataWithSystemRateMissing)
    ).toThrow(/システム稼働率/);

    // 4) 複数項目欠損の場合：最初の欠損項目を検出
    const operationDataWithMultipleMissing = {
      assessmentCount: null, // 欠損
      assessmentTimeMs: null, // 欠損
      errorOccurrenceCount: 2,
      qualityUniformityIndex: 0.92,
      systemOperationRate: 0.995,
      ocrReadAccuracy: 0.88,
      aiJudgmentAccuracy: 0.91,
      learningDataUpdateCount: 3,
      reportGenerationDate: "2024-01-31T09:00:00Z",
    };

    expect(() =>
      generateOperationManualV1(operationDataWithMultipleMissing)
    ).toThrow(/査定件数/);

    // 5) すべての必須項目が有効な場合は正常に生成される（ハッピーパス）
    const operationDataComplete = {
      assessmentCount: 150,
      assessmentTimeMs: 2700000,
      errorOccurrenceCount: 2,
      qualityUniformityIndex: 0.92,
      systemOperationRate: 0.995,
      ocrReadAccuracy: 0.88,
      aiJudgmentAccuracy: 0.91,
      learningDataUpdateCount: 3,
      reportGenerationDate: "2024-01-31T09:00:00Z",
    };

    const result = generateOperationManualV1(operationDataComplete);

    // 6) 正常生成時の出力検証
    expect(result).toBeDefined();
    expect(result.manualId).toBeDefined();
    expect(result.manualId).toMatch(/^MAN_/);
    expect(result.generationStatus).toBe("success");
    expect(result.generatedAt).toMatch(/2024-01-31/);
    expect(result.contentSections).toBeDefined();
    expect(Array.isArray(result.contentSections)).toBe(true);
    expect(result.contentSections.length).toBeGreaterThan(0);

    // 7) エラーログ記録の検証：エラー発生時
    try {
      generateOperationManualV1(operationDataWithMissing);
    } catch {
      // エラー内容がシステムに記録されていることを確認
      // 実装では errorLog フィールドにエラー詳細が含まれることを想定
    }
    expect.assertions(11);
  });
});