import { standardizeAndUnifyLearningData } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-900: [normal] 学習データ標準化・形式統一 - 複数形式の過去案件データを統一基準スキーマに変換して確定する
  test('should standardize and unify multiple format past project data to unified schema and confirm', () => {
    // テストデータ: CSV形式の過去案件データ
    const csvFormatData = {
      sourceFormat: 'csv',
      rawData: '工事種別,施工地域,施工時期,見積金額,数量,単価\n' +
               '土木工事,東京都,2024-01,1500000,100,15000\n' +
               '建築工事,大阪府,2024-02,2000000,150,13333',
      fileName: 'past_projects_csv.csv',
      uploadedAt: '2024-01-15T10:30:00Z'
    };

    // テストデータ: Excel形式の過去案件データ
    const excelFormatData = {
      sourceFormat: 'xlsx',
      rawData: JSON.stringify([
        {
          '工事種別': '設備工事',
          '施工地域': '福岡県',
          '施工時期': '2024-01',
          '見積金額': 1200000,
          '数量': 80,
          '単価': 15000
        }
      ]),
      fileName: 'past_projects_excel.xlsx',
      uploadedAt: '2024-01-15T10:45:00Z'
    };

    // テストデータ: JSON形式の過去案件データ
    const jsonFormatData = {
      sourceFormat: 'json',
      rawData: JSON.stringify([
        {
          constructionType: '装修工事',
          region: '名古屋市',
          period: '2024-02',
          estimatedAmount: 1800000,
          quantity: 120,
          unitPrice: 15000
        }
      ]),
      fileName: 'past_projects_json.json',
      uploadedAt: '2024-01-15T11:00:00Z'
    };

    // 統一基準スキーマの期待値定義
    const expectedUnifiedSchema = {
      projectId: expect.any(String),
      constructionType: expect.any(String),
      region: expect.any(String),
      period: expect.any(String),
      estimatedAmount: expect.any(Number),
      quantity: expect.any(Number),
      unitPrice: expect.any(Number),
      dataSource: expect.any(String),
      originalFileName: expect.any(String),
      uploadedAtISO: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      standardizedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      validationStatus: 'passed',
      duplicateCheckResult: 'no_duplicate',
      schemaVersion: '1.0'
    };

    // システムに複数形式のデータをインポート
    const multiFormatInput = {
      dataBatches: [csvFormatData, excelFormatData, jsonFormatData],
      unifyingSchemaVersion: '1.0',
      validationRules: {
        requiredFields: ['constructionType', 'region', 'period', 'estimatedAmount', 'quantity', 'unitPrice'],
        dateFormat: 'YYYY-MM',
        amountMinimum: 100000,
        amountMaximum: 10000000,
        quantityMinimum: 1,
        quantityMaximum: 10000,
        unitPriceMinimum: 1000,
        unitPriceMaximum: 100000
      },
      duplicateCheckEnabled: true,
      confirmationRequired: true
    };

    // 関数呼び出し: 統一化・形式変換処理
    const result = standardizeAndUnifyLearningData(multiFormatInput);

    // === 検証1: 統一基準スキーマへのマッピング成功 ===
    expect(result).toHaveProperty('status');
    expect(result.status).toBe('standardized_and_unified');

    expect(result).toHaveProperty('unifiedRecords');
    expect(Array.isArray(result.unifiedRecords)).toBe(true);
    expect(result.unifiedRecords.length).toBe(3);

    // === 検証2: 各レコードが統一基準スキーマに合致 ===
    result.unifiedRecords.forEach((record) => {
      // データ型の統一確認
      expect(typeof record.projectId).toBe('string');
      expect(typeof record.constructionType).toBe('string');
      expect(typeof record.region).toBe('string');
      expect(typeof record.period).toBe('string');
      expect(typeof record.estimatedAmount).toBe('number');
      expect(typeof record.quantity).toBe('number');
      expect(typeof record.unitPrice).toBe('number');

      // 必須項目の確認
      expect(record.projectId).toBeTruthy();
      expect(record.constructionType).toBeTruthy();
      expect(record.region).toBeTruthy();
      expect(record.period).toBeTruthy();

      // 日付形式の確認 (YYYY-MM形式)
      expect(record.period).toMatch(/^\d{4}-\d{2}$/);

      // 金額フォーマットの確認 (最小値 100,000円 以上)
      expect(record.estimatedAmount).toBeGreaterThanOrEqual(100000);
      expect(record.estimatedAmount).toBeLessThanOrEqual(10000000);

      // 数量の確認
      expect(record.quantity).toBeGreaterThanOrEqual(1);
      expect(record.quantity).toBeLessThanOrEqual(10000);

      // 単価の確認
      expect(record.unitPrice).toBeGreaterThanOrEqual(1000);
      expect(record.unitPrice).toBeLessThanOrEqual(100000);

      // 計算整合性の確認: estimatedAmount = quantity × unitPrice (許容誤差 1%)
      const calculatedAmount = record.quantity * record.unitPrice;
      const tolerance = calculatedAmount * 0.01;
      expect(Math.abs(record.estimatedAmount - calculatedAmount)).toBeLessThanOrEqual(tolerance);
    });

    // === 検証3: ソース追跡情報の確認 ===
    expect(result.unifiedRecords[0].dataSource).toBe('csv');
    expect(result.unifiedRecords[0].originalFileName).toBe('past_projects_csv.csv');
    expect(result.unifiedRecords[0].uploadedAtISO).toBe('2024-01-15T10:30:00Z');

    expect(result.unifiedRecords[1].dataSource).toBe('xlsx');
    expect(result.unifiedRecords[1].originalFileName).toBe('past_projects_excel.xlsx');
    expect(result.unifiedRecords[1].uploadedAtISO).toBe('2024-01-15T10:45:00Z');

    expect(result.unifiedRecords[2].dataSource).toBe('json');
    expect(result.unifiedRecords[2].originalFileName).toBe('past_projects_json.json');
    expect(result.unifiedRecords[2].uploadedAtISO).toBe('2024-01-15T11:00:00Z');

    // === 検証4: バージョン管理・検証状態の確認 ===
    result.unifiedRecords.forEach((record) => {
      expect(record.schemaVersion).toBe('1.0');
      expect(record.validationStatus).toBe('passed');
      expect(record.duplicateCheckResult).toBe('no_duplicate');
      expect(record.standardizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    // === 検証5: 重複データチェック結果 ===
    expect(result).toHaveProperty('duplicateCheckResult');
    expect(result.duplicateCheckResult.hasDuplicates).toBe(false);
    expect(result.duplicateCheckResult.duplicateCount).toBe(0);
    expect(Array.isArray(result.duplicateCheckResult.duplicateGroups)).toBe(true);
    expect(result.duplicateCheckResult.duplicateGroups.length).toBe(0);

    // === 検証6: データ不整合チェック結果 ===
    expect(result).toHaveProperty('inconsistencyCheckResult');
    expect(result.inconsistencyCheckResult.hasInconsistencies).toBe(false);
    expect(result.inconsistencyCheckResult.inconsistencyCount).toBe(0);

    // === 検証7: 確定処理（コミット） ===
    expect(result).toHaveProperty('confirmationStatus');
    expect(result.confirmationStatus).toBe('confirmed');

    // === 検証8: データベース保存結果 ===
    expect(result).toHaveProperty('persistenceResult');
    expect(result.persistenceResult.status).toBe('success');
    expect(result.persistenceResult.totalRecordsPersisted).toBe(3);
    expect(result.persistenceResult.failedRecords.length).toBe(0);

    expect(result).toHaveProperty('storedRecordIds');
    expect(Array.isArray(result.storedRecordIds)).toBe(true);
    expect(result.storedRecordIds.length).toBe(3);

    // === 検証9: 統一基準スキーマの維持確認 ===
    expect(result).toHaveProperty('retrievalVerification');
    expect(result.retrievalVerification.status).toBe('verified');

    result.retrievalVerification.retrievedRecords.forEach((retrievedRecord) => {
      expect(retrievedRecord).toHaveProperty('projectId');
      expect(retrievedRecord).toHaveProperty('constructionType');
      expect(retrievedRecord).toHaveProperty('region');
      expect(retrievedRecord).toHaveProperty('period');
      expect(retrievedRecord).toHaveProperty('estimatedAmount');
      expect(retrievedRecord).toHaveProperty('quantity');
      expect(retrievedRecord).toHaveProperty('unitPrice');
      expect(retrievedRecord).toHaveProperty('schemaVersion');
      expect(retrievedRecord.schemaVersion).toBe('1.0');
    });

    // === 検証10: 処理完了・統計情報 ===
    expect(result).toHaveProperty('processingStats');
    expect(result.processingStats.totalInputRecords).toBe(3);
    expect(result.processingStats.successfullyStandardized).toBe(3);
    expect(result.processingStats.failedToStandardize).toBe(0);
    expect(result.processingStats.standardizationSuccessRate).toBe(100);
    expect(result.processingStats.processingDurationMs).toBeGreaterThanOrEqual(0);

    // === 検証11: 戻り値全体の構造確認 ===
    expect(result).toHaveProperty('completionTimestamp');
    expect(result.completionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});