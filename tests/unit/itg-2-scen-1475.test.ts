import { analyzeDeviationPatternRootCause } from '../../src/logic/it-6-2-2-2';

describe('乖離パターン根本原因分析ダッシュボード', () => {
  // SCEN-1475: [edge] 乖離パターン根本原因分析 - いずれの根本原因も検出されない場合、未分類原因として記録される
  test('根本原因が検出されない乖離事例は未分類として分類・記録される', () => {
    // テストデータ: 既知の根本原因パターンに該当しない乖離事例
    const unclassifiedDeviation = {
      deviationId: 'DEV-2024-001',
      estimateAmount: 1250000,
      marketPrice: 1000000,
      deviationRate: 25,
      deviationAmount: 250000,
      region: 'Tokyo',
      constructionType: 'CustomType_XYZ',
      season: 'Q2',
      referenceDataCount: 5,
      ocr_confidence: 0.92,
      estimateDate: '2024-01-15T10:30:00Z',
      metadata: {
        sourceFormat: 'proprietary_v3',
        dataBatch: 'BATCH-2024-015'
      }
    };

    // 既知の根本原因パターン定義（テスト内で仮定）
    // - データ品質低下: 参照データ件数 < 10 かつ OCR 信頼度 < 0.85
    // - モデルドリフト: 工事種別が標準分類に含まれない
    // - フォーマット変化: 見積日が過去 30 日以内で新フォーマット flag が立っている
    // この事例は参照データ件数が 5（基準未満）だが、OCR 信頼度が 0.92（高い）
    // 工事種別は非標準だが、単独では「モデルドリフト」判定に不十分
    // 見積日は 2024-01-15 だが、新フォーマット flag なし
    // → いずれのパターンにも完全には合致しない

    // 乖離パターン根本原因分析モジュールを実行
    const analysisResult = analyzeDeviationPatternRootCause(unclassifiedDeviation);

    // 検出結果: 未分類として分類される
    expect(analysisResult.rootCauseClassification).toBe('Unclassified');
    expect(analysisResult.rootCauseLabel).toBe('未分類');

    // 分析結果の記録データ構造を検証
    expect(analysisResult.analysisId).toBeDefined();
    expect(analysisResult.analysisId).toMatch(/^ANA-/);

    // タイムスタンプが ISO 形式で記録されていることを確認
    expect(analysisResult.analysisTimestamp).toBeDefined();
    expect(analysisResult.analysisTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 分析対象の乖離情報が記録に含まれていることを確認
    expect(analysisResult.targetDeviationId).toBe('DEV-2024-001');
    expect(analysisResult.targetDeviationRate).toBe(25);
    expect(analysisResult.targetDeviationAmount).toBe(250000);

    // メタデータの保持を確認
    expect(analysisResult.metadata).toBeDefined();
    expect(analysisResult.metadata.sourceFormat).toBe('proprietary_v3');
    expect(analysisResult.metadata.dataBatch).toBe('BATCH-2024-015');

    // 各根本原因の検出スコアが計算されていることを確認
    // （いずれも合致しないため、すべてのスコアが低い）
    expect(analysisResult.dataQualityScore).toBeLessThan(0.5);
    expect(analysisResult.modelDriftScore).toBeLessThan(0.5);
    expect(analysisResult.formatChangeScore).toBeLessThan(0.5);

    // 未分類と判定された理由が記録に含まれることを確認
    expect(analysisResult.reasonForUnclassified).toBeDefined();
    expect(analysisResult.reasonForUnclassified).toContain('複数パターン');

    // 監査証跡として、分析実行ユーザー情報の placeholder が含まれることを確認
    expect(analysisResult.auditTrail).toBeDefined();
    expect(analysisResult.auditTrail.executedAt).toBeDefined();
    expect(analysisResult.auditTrail.status).toBe('completed');

    // 分析結果全体の型安全性を検証
    expect(typeof analysisResult.rootCauseClassification).toBe('string');
    expect(typeof analysisResult.analysisId).toBe('string');
    expect(typeof analysisResult.targetDeviationRate).toBe('number');
    expect(typeof analysisResult.analysisTimestamp).toBe('string');
  });
});