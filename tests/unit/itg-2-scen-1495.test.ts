import { validateLearningDataQuality } from '../../src/logic/it-1-br-6-2-1';

describe('AI判定モデル再学習実行機能 - 学習データ品質検証', () => {
  test('SCEN-1495: 品質基準を満たさない学習データで再学習が拒否される', () => {
    // ========== ハッピーパス: 品質基準を満たさないデータセット ==========
    
    // 前提: 品質基準を満たさない学習データが準備されている
    const insufficient_dataset = {
      total_count: 800,
      min_required_count: 1000,
      label_mismatch_ratio: 0.08,
      max_label_mismatch_threshold: 0.05,
      missing_value_ratio: 0.12,
      max_missing_value_threshold: 0.10,
      dataset_id: 'ds-2024-001',
      timestamp_prepared: new Date('2024-06-15T10:30:00Z').toISOString()
    };

    // 期待: データ件数不足エラーが返される
    const result_insufficient = validateLearningDataQuality(insufficient_dataset);
    expect(result_insufficient).toEqual({
      is_valid: false,
      error_code: 'LEARN_DATA_INSUFFICIENT_COUNT',
      error_message: 'データ件数が最小要件の1000件に満たしません。現在の件数: 800件',
      failure_reasons: ['データ件数不足'],
      model_update_status: 'UNEXECUTED'
    });

    // ========== ラベル不一致率が閾値超過 ==========
    const label_mismatch_dataset = {
      total_count: 1200,
      min_required_count: 1000,
      label_mismatch_ratio: 0.08,
      max_label_mismatch_threshold: 0.05,
      missing_value_ratio: 0.03,
      max_missing_value_threshold: 0.10,
      dataset_id: 'ds-2024-002',
      timestamp_prepared: new Date('2024-06-15T11:00:00Z').toISOString()
    };

    const result_label_mismatch = validateLearningDataQuality(label_mismatch_dataset);
    expect(result_label_mismatch).toEqual({
      is_valid: false,
      error_code: 'LEARN_DATA_LABEL_MISMATCH',
      error_message: 'ラベル不一致が5%を超えています。現在の不一致率: 8%',
      failure_reasons: ['ラベル不一致'],
      model_update_status: 'UNEXECUTED'
    });

    // ========== 欠損値が閾値超過 ==========
    const missing_value_dataset = {
      total_count: 1500,
      min_required_count: 1000,
      label_mismatch_ratio: 0.03,
      max_label_mismatch_threshold: 0.05,
      missing_value_ratio: 0.15,
      max_missing_value_threshold: 0.10,
      dataset_id: 'ds-2024-003',
      timestamp_prepared: new Date('2024-06-15T11:30:00Z').toISOString()
    };

    const result_missing_value = validateLearningDataQuality(missing_value_dataset);
    expect(result_missing_value).toEqual({
      is_valid: false,
      error_code: 'LEARN_DATA_EXCESSIVE_MISSING',
      error_message: '欠損値が10%を超えています。現在の欠損値率: 15%',
      failure_reasons: ['欠損値超過'],
      model_update_status: 'UNEXECUTED'
    });

    // ========== 複数の品質基準違反 ==========
    const multiple_violations_dataset = {
      total_count: 900,
      min_required_count: 1000,
      label_mismatch_ratio: 0.07,
      max_label_mismatch_threshold: 0.05,
      missing_value_ratio: 0.14,
      max_missing_value_threshold: 0.10,
      dataset_id: 'ds-2024-004',
      timestamp_prepared: new Date('2024-06-15T12:00:00Z').toISOString()
    };

    const result_multiple = validateLearningDataQuality(multiple_violations_dataset);
    expect(result_multiple).toEqual({
      is_valid: false,
      error_code: 'LEARN_DATA_MULTIPLE_VIOLATIONS',
      error_message: '複数の品質基準違反が検出されました。データ件数不足、ラベル不一致、欠損値超過',
      failure_reasons: ['データ件数不足', 'ラベル不一致', '欠損値超過'],
      model_update_status: 'UNEXECUTED'
    });

    // ========== 品質基準を満たすデータセット（正常系） ==========
    const valid_dataset = {
      total_count: 1500,
      min_required_count: 1000,
      label_mismatch_ratio: 0.02,
      max_label_mismatch_threshold: 0.05,
      missing_value_ratio: 0.05,
      max_missing_value_threshold: 0.10,
      dataset_id: 'ds-2024-005',
      timestamp_prepared: new Date('2024-06-15T13:00:00Z').toISOString()
    };

    const result_valid = validateLearningDataQuality(valid_dataset);
    expect(result_valid).toEqual({
      is_valid: true,
      error_code: null,
      error_message: null,
      failure_reasons: [],
      model_update_status: 'READY_FOR_RETRAINING'
    });

    // ========== 確認: 品質不合格時はモデルが更新されない ==========
    expect(result_insufficient.model_update_status).toBe('UNEXECUTED');
    expect(result_label_mismatch.model_update_status).toBe('UNEXECUTED');
    expect(result_missing_value.model_update_status).toBe('UNEXECUTED');
    expect(result_multiple.model_update_status).toBe('UNEXECUTED');

    // ========== 確認: エラーコードと理由が明確に返される ==========
    expect(result_insufficient.error_code).toBe('LEARN_DATA_INSUFFICIENT_COUNT');
    expect(result_label_mismatch.error_code).toBe('LEARN_DATA_LABEL_MISMATCH');
    expect(result_missing_value.error_code).toBe('LEARN_DATA_EXCESSIVE_MISSING');
    expect(result_multiple.error_code).toBe('LEARN_DATA_MULTIPLE_VIOLATIONS');

    // ========== 確認: 不合格理由が具体的に記録される ==========
    expect(result_insufficient.failure_reasons).toContain('データ件数不足');
    expect(result_label_mismatch.failure_reasons).toContain('ラベル不一致');
    expect(result_missing_value.failure_reasons).toContain('欠損値超過');
    expect(result_multiple.failure_reasons).toHaveLength(3);
  });
});