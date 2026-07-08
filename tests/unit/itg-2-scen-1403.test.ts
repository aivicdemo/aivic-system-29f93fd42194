import { analyzeOcrReadErrorTendency } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別判定ばらつき率と相場乖離傾向の自動集計・分析', () => {
  // SCEN-1403: [error] 読取誤り傾向分析機能 - 入力データセットが破損または不正な場合、解析処理が中止され適切なエラーが通知される
  test('破損または不正な入力データセットがアップロードされた場合、エラーが通知され正常な状態に戻る', () => {
    // 破損したCSVファイル（ファイルヘッダが不正）のシミュレーション
    const corruptedCsvDataset = {
      fileId: 'corrupt_csv_001',
      fileName: 'broken_data.csv',
      uploadedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      dataRows: [
        // ヘッダが不正（カラム数がゼロまたは必須フィールドが欠落）
        '',
        'invalid_data_row_1',
        'invalid_data_row_2',
      ],
      fileSize: 512,
      format: 'csv',
    };

    // 破損したCSVファイルの解析を試みる → エラーが発生することを確認
    expect(() =>
      analyzeOcrReadErrorTendency(corruptedCsvDataset)
    ).toThrow(/ファイルヘッダ/);

    // バイナリデータが混在した不正なデータセットのシミュレーション
    const invalidBinaryDataset = {
      fileId: 'invalid_binary_001',
      fileName: 'mixed_binary_data.csv',
      uploadedAt: new Date('2024-01-15T10:15:00Z').toISOString(),
      dataRows: [
        'region,workType,errorCount,totalCount',
        '\x00\x01\x02invalid_binary_data',
        'Tokyo,TypeA,5,100',
      ],
      fileSize: 1024,
      format: 'csv',
    };

    // バイナリデータが混在したデータセットの解析を試みる → エラーが発生することを確認
    expect(() =>
      analyzeOcrReadErrorTendency(invalidBinaryDataset)
    ).toThrow(/ファイル形式/);

    // 不正なJSONフォーマットのデータセットのシミュレーション
    const invalidJsonDataset = {
      fileId: 'invalid_json_001',
      fileName: 'malformed.json',
      uploadedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
      dataRows: [
        '{"region": "Osaka", "workType": "TypeB"',
        // JSONが不完全（閉じ括弧がない、不正な形式）
      ],
      fileSize: 256,
      format: 'json',
    };

    // 不正なJSONフォーマットのデータセットの解析を試みる → エラーが発生することを確認
    expect(() =>
      analyzeOcrReadErrorTendency(invalidJsonDataset)
    ).toThrow(/JSON形式/);

    // 正常なデータセットで処理が復帰できることを確認
    // （エラー発生後もシステムが正常な状態を保つことを検証）
    const validDataset = {
      fileId: 'valid_001',
      fileName: 'valid_data.csv',
      uploadedAt: new Date('2024-01-15T10:45:00Z').toISOString(),
      dataRows: [
        'region,workType,errorCount,totalCount',
        'Tokyo,TypeA,5,100',
        'Osaka,TypeB,3,80',
        'Kyoto,TypeC,8,120',
      ],
      fileSize: 512,
      format: 'csv',
    };

    // 正常なデータセットを処理 → 成功することを確認
    const result = analyzeOcrReadErrorTendency(validDataset);

    // 期待値: 正常な分析結果が返される
    expect(result).toEqual(
      expect.objectContaining({
        analysisId: expect.any(String),
        status: 'success',
        datasetFileId: 'valid_001',
        analysisTimestamp: expect.any(String),
        trendSummary: expect.objectContaining({
          byRegion: expect.any(Array),
          byWorkType: expect.any(Array),
          concentrationAreas: expect.any(Array),
        }),
        errorDetails: expect.any(Array),
      })
    );

    // 分析結果が正確に計算されていることを確認
    expect(result.trendSummary.byRegion).toContainEqual(
      expect.objectContaining({
        region: 'Tokyo',
        errorRate: 5,
        severity: expect.any(String),
      })
    );

    expect(result.trendSummary.byWorkType).toContainEqual(
      expect.objectContaining({
        workType: 'TypeA',
        errorRate: 5,
      })
    );

    // 集中度の高い領域が特定されていることを確認
    const concentrationArea = result.trendSummary.concentrationAreas.find(
      (area) => area.priority === 'high'
    );
    expect(concentrationArea).toBeDefined();
    expect(concentrationArea?.impactScore).toBeGreaterThan(50);
  });
});