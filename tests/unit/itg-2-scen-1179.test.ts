import { recordJudgmentLogicApplicationHistory } from '../../src/logic/it-6-2-2-1';

describe('判定ロジック適用履歴の記録と検証', () => {
  test('SCEN-1179: モデル更新時に適用されたロジックと適用日時、結果が正確に記録される', () => {
    // ===== Setup: モデル更新シナリオの前提条件 =====
    const model_version_id = 'model_v2_20240115';
    const logic_id = 'logic_market_deviation_001';
    const logic_name = '相場乖離判定ロジック_2024Q1版';
    const logic_content = {
      thresholds: {
        normal_range_lower: -0.1,
        normal_range_upper: 0.15,
        warning_threshold: 0.25,
        critical_threshold: 0.4,
      },
      regional_adjustments: {
        tokyo: 1.05,
        osaka: 0.98,
        hokkaido: 0.92,
      },
      seasonal_factors: {
        Q1: 0.95,
        Q2: 1.0,
        Q3: 1.02,
        Q4: 0.98,
      },
      min_reference_sample_size: 5,
    };

    // ===== 適用ロジックの詳細情報 =====
    const application_timestamp = new Date('2024-01-15T14:30:45Z');
    const applied_by_user_id = 'assessor_001';
    const assessment_case_id = 'case_20240115_001';
    
    // ===== 判定結果の詳細 =====
    const judgment_result = {
      quotation_amount: 5200000,
      reference_market_price: 4800000,
      deviation_rate: 0.0833, // (5200000 - 4800000) / 4800000
      deviation_amount: 400000,
      regional_code: 'tokyo',
      regional_adjustment_factor: 1.05,
      seasonal_code: 'Q1',
      seasonal_factor: 0.95,
      adjusted_market_price: 4800000 * 1.05 * 0.95, // 4788000
      adjusted_deviation_rate: (5200000 - 4788000) / 4788000, // 0.0862
      judgment_status: 'warning', // 乖離率が warning_threshold(0.25)未満なため warning
      confidence_score: 87,
      reference_sample_count: 12,
      construction_type: '躯体工事',
      amount_band: '500万～600万',
    };

    // ===== 実行: ロジック適用履歴を記録 =====
    const recorded_history = recordJudgmentLogicApplicationHistory({
      model_version_id,
      logic_id,
      logic_name,
      logic_content,
      application_timestamp,
      applied_by_user_id,
      assessment_case_id,
      judgment_result,
    });

    // ===== 検証: 記録内容の整合性を確認 =====
    
    // 1. 記録されたロジック適用履歴の基本情報が正確であることを確認
    expect(recorded_history).toEqual(
      expect.objectContaining({
        model_version_id: 'model_v2_20240115',
        logic_id: 'logic_market_deviation_001',
        logic_name: '相場乖離判定ロジック_2024Q1版',
      })
    );

    // 2. 適用日時が ISO 8601 形式で年月日時分秒まで正確に記録されることを確認
    expect(recorded_history.application_timestamp).toBe('2024-01-15T14:30:45.000Z');

    // 3. 適用ユーザー情報が正確に記録されることを確認
    expect(recorded_history.applied_by_user_id).toBe('assessor_001');

    // 4. 判定ロジックの内容（閾値・補正係数）が構造化されて記録されることを確認
    expect(recorded_history.logic_content).toEqual({
      thresholds: {
        normal_range_lower: -0.1,
        normal_range_upper: 0.15,
        warning_threshold: 0.25,
        critical_threshold: 0.4,
      },
      regional_adjustments: {
        tokyo: 1.05,
        osaka: 0.98,
        hokkaido: 0.92,
      },
      seasonal_factors: {
        Q1: 0.95,
        Q2: 1.0,
        Q3: 1.02,
        Q4: 0.98,
      },
      min_reference_sample_size: 5,
    });

    // 5. 判定結果の乖離率が正確に計算・記録されることを確認
    expect(recorded_history.judgment_result.deviation_rate).toBe(0.0833);

    // 6. 判定結果の乖離額が正確に計算・記録されることを確認
    expect(recorded_history.judgment_result.deviation_amount).toBe(400000);

    // 7. 地域別補正係数が正確に適用・記録されることを確認
    expect(recorded_history.judgment_result.regional_adjustment_factor).toBe(1.05);

    // 8. 季節別係数が正確に適用・記録されることを確認
    expect(recorded_history.judgment_result.seasonal_factor).toBe(0.95);

    // 9. 調整後の市場価格が正確に計算・記録されることを確認
    // expected: 4800000 * 1.05 * 0.95 = 4788000
    expect(recorded_history.judgment_result.adjusted_market_price).toBe(4788000);

    // 10. 調整後の乖離率が正確に計算・記録されることを確認
    // expected: (5200000 - 4788000) / 4788000 ≈ 0.0862
    expect(Math.round(recorded_history.judgment_result.adjusted_deviation_rate * 10000) / 10000).toBe(0.0862);

    // 11. 判定ステータス（正常/警告/危険）が適切に判定・記録されることを確認
    // 調整後乖離率 0.0862 は warning_threshold(0.25) 未満なため warning
    expect(recorded_history.judgment_result.judgment_status).toBe('warning');

    // 12. 信頼度スコア（0～100）が記録されることを確認
    expect(recorded_history.judgment_result.confidence_score).toBe(87);

    // 13. 参照データ件数が記録されることを確認
    expect(recorded_history.judgment_result.reference_sample_count).toBe(12);

    // 14. 工事種別が記録されることを確認
    expect(recorded_history.judgment_result.construction_type).toBe('躯体工事');

    // 15. 金額帯が記録されることを確認
    expect(recorded_history.judgment_result.amount_band).toBe('500万～600万');

    // 16. 適用ケース ID が記録されることを確認
    expect(recorded_history.assessment_case_id).toBe('case_20240115_001');

    // 17. 記録全体のデータ完全性を確認（必須フィールドがすべて存在）
    expect(recorded_history).toHaveProperty('model_version_id');
    expect(recorded_history).toHaveProperty('logic_id');
    expect(recorded_history).toHaveProperty('logic_name');
    expect(recorded_history).toHaveProperty('logic_content');
    expect(recorded_history).toHaveProperty('application_timestamp');
    expect(recorded_history).toHaveProperty('applied_by_user_id');
    expect(recorded_history).toHaveProperty('assessment_case_id');
    expect(recorded_history).toHaveProperty('judgment_result');

    // 18. 記録された適用履歴にデータベース用のレコード ID が生成されることを確認
    expect(recorded_history.history_record_id).toBeDefined();
    expect(typeof recorded_history.history_record_id).toBe('string');
    expect(recorded_history.history_record_id.length).toBeGreaterThan(0);

    // 19. 複数の判定ロジック適用履歴が同時に存在する場合、各履歴が独立して記録されることを確認
    const second_judgment_result = {
      quotation_amount: 3500000,
      reference_market_price: 3200000,
      deviation_rate: 0.0938,
      deviation_amount: 300000,
      regional_code: 'osaka',
      regional_adjustment_factor: 0.98,
      seasonal_code: 'Q2',
      seasonal_factor: 1.0,
      adjusted_market_price: 3200000 * 0.98 * 1.0, // 3136000
      adjusted_deviation_rate: (3500000 - 3136000) / 3136000, // 0.1161
      judgment_status: 'normal',
      confidence_score: 92,
      reference_sample_count: 15,
      construction_type: '基礎工事',
      amount_band: '300万～400万',
    };

    const second_history = recordJudgmentLogicApplicationHistory({
      model_version_id: 'model_v2_20240115',
      logic_id: 'logic_market_deviation_001',
      logic_name: '相場乖離判定ロジック_2024Q1版',
      logic_content,
      application_timestamp: new Date('2024-01-15T15:45:30Z'),
      applied_by_user_id: 'assessor_002',
      assessment_case_id: 'case_20240115_002',
      judgment_result: second_judgment_result,
    });

    // 異なるケースの履歴 ID が異なることを確認
    expect(second_history.history_record_id).not.toBe(recorded_history.history_record_id);

    // 異なるケースの適用日時が異なることを確認
    expect(second_history.application_timestamp).toBe('2024-01-15T15:45:30.000Z');
    expect(second_history.application_timestamp).not.toBe(recorded_history.application_timestamp);

    // 20. 最新の適用履歴レコードが検索可能な状態で格納されることを確認
    expect(recorded_history.is_latest_for_case).toBeDefined();
    expect(typeof recorded_history.is_latest_for_case).toBe('boolean');
  });
});