import { generateImprovementResultReport } from '../../src/logic/it-6-2-1-1';

describe('改善結果レポートの自動生成', () => {
  test('SCEN-1236: 改善内容・精度改善度・根拠データを含むレポートがCSV形式で生成される', () => {
    // Arrange
    const start_date = new Date('2024-01-01T00:00:00Z');
    const end_date = new Date('2024-01-31T23:59:59Z');
    const improvement_dataset = {
      assessment_id: 'ASS-20240115-001',
      assessor_id: 'ASR-002',
      work_type: '土木工事',
      amount_band: '1000万円以上1500万円未満',
      pre_improvement_ocr_accuracy: 0.82,
      post_improvement_ocr_accuracy: 0.91,
      pre_improvement_ai_judgment_accuracy: 0.75,
      post_improvement_ai_judgment_accuracy: 0.88,
      improvement_content: '過去案件データを地域別に拡充、物価本2024年版を反映',
      reference_data_count: 245,
      reference_period_start: '2023-01-01',
      reference_period_end: '2024-01-31',
      applicable_logic_version: 'v2.3.1',
    };

    // Act
    const result = generateImprovementResultReport(
      start_date,
      end_date,
      improvement_dataset
    );

    // Assert - ファイル形式の検証
    expect(result.file_format).toBe('CSV');
    expect(result.file_encoding).toBe('UTF-8');
    expect(result.file_name).toMatch(/improvement_result_report_\d{8}_\d{6}\.csv/);

    // Assert - CSVヘッダーの検証（必須列が全て存在）
    const expected_headers = [
      'assessment_id',
      'assessor_id',
      'work_type',
      'amount_band',
      'pre_improvement_ocr_accuracy',
      'post_improvement_ocr_accuracy',
      'ocr_accuracy_improvement_rate',
      'pre_improvement_ai_judgment_accuracy',
      'post_improvement_ai_judgment_accuracy',
      'ai_judgment_accuracy_improvement_rate',
      'improvement_content',
      'reference_data_count',
      'reference_period_start',
      'reference_period_end',
      'applicable_logic_version',
      'report_generation_timestamp',
    ];
    expect(result.csv_headers).toEqual(expected_headers);

    // Assert - OCR精度改善度の自動計算
    // 計算式: (post_improvement_ocr_accuracy - pre_improvement_ocr_accuracy) / pre_improvement_ocr_accuracy * 100
    // (0.91 - 0.82) / 0.82 * 100 = 0.09 / 0.82 * 100 ≈ 10.98%
    expect(result.ocr_accuracy_improvement_rate).toBeCloseTo(10.98, 1);

    // Assert - AI判定精度改善度の自動計算
    // 計算式: (post_improvement_ai_judgment_accuracy - pre_improvement_ai_judgment_accuracy) / pre_improvement_ai_judgment_accuracy * 100
    // (0.88 - 0.75) / 0.75 * 100 = 0.13 / 0.75 * 100 ≈ 17.33%
    expect(result.ai_judgment_accuracy_improvement_rate).toBeCloseTo(17.33, 1);

    // Assert - 改善内容データが正しく記入
    expect(result.csv_data[0].improvement_content).toBe(
      '過去案件データを地域別に拡充、物価本2024年版を反映'
    );

    // Assert - 根拠データが正しく記入
    expect(result.csv_data[0].reference_data_count).toBe(245);
    expect(result.csv_data[0].reference_period_start).toBe('2023-01-01');
    expect(result.csv_data[0].reference_period_end).toBe('2024-01-31');
    expect(result.csv_data[0].applicable_logic_version).toBe('v2.3.1');

    // Assert - 査定データが正しく記入
    expect(result.csv_data[0].assessment_id).toBe('ASS-20240115-001');
    expect(result.csv_data[0].assessor_id).toBe('ASR-002');
    expect(result.csv_data[0].work_type).toBe('土木工事');
    expect(result.csv_data[0].amount_band).toBe('1000万円以上1500万円未満');

    // Assert - 精度値が正しく記入
    expect(result.csv_data[0].pre_improvement_ocr_accuracy).toBe(0.82);
    expect(result.csv_data[0].post_improvement_ocr_accuracy).toBe(0.91);
    expect(result.csv_data[0].pre_improvement_ai_judgment_accuracy).toBe(0.75);
    expect(result.csv_data[0].post_improvement_ai_judgment_accuracy).toBe(0.88);

    // Assert - レポート生成タイムスタンプが指定期間内
    const report_timestamp = new Date(
      result.csv_data[0].report_generation_timestamp
    );
    expect(report_timestamp.getTime()).toBeGreaterThanOrEqual(start_date.getTime());
    expect(report_timestamp.getTime()).toBeLessThanOrEqual(end_date.getTime());

    // Assert - CSVデータ行数が1行以上
    expect(result.csv_data.length).toBeGreaterThanOrEqual(1);

    // Assert - CSVコンテンツの形式検証
    expect(result.csv_content).toContain('assessment_id');
    expect(result.csv_content).toContain('improvement_content');
    expect(result.csv_content).toContain('ocr_accuracy_improvement_rate');
    expect(result.csv_content).toContain('ai_judgment_accuracy_improvement_rate');

    // Assert - 全ての必須フィールドが存在
    result.csv_data.forEach((row) => {
      expected_headers.forEach((header) => {
        expect(row).toHaveProperty(header);
      });
    });

    // Assert - ダウンロード可能な状態の検証
    expect(result.is_downloadable).toBe(true);
    expect(result.file_size_bytes).toBeGreaterThan(0);
  });
});