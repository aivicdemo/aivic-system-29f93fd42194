import { aggregateAndVisualizeAccuracyByAssessorAndWorkType } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-989: [edge] 相場乖離根拠データの一覧表示 - 補正係数が計算不可の場合、該当項目がグレーアウトされ、理由が表示される
  test('補正係数が計算不可の項目はグレーアウトされ、理由が表示される', () => {
    // ========== 入力データ準備 ==========
    const assessment_results = [
      {
        assessment_id: 'A001',
        assessor_id: 'ASS001',
        work_type_code: 'WT001',
        amount_band_code: 'AB001',
        quote_amount: 1000000,
        market_reference_amount: 950000,
        deviation_rate_percent: 5.26,
        deviation_amount_yen: 50000,
        reference_data_count: 15,
        price_book_source: 'PB2024-Q1',
        correction_coefficient: 1.05,
        correction_applicable: true,
        correction_reason: '地域補正（東京都）',
        assessment_date: new Date('2024-01-15T10:00:00Z'),
      },
      {
        assessment_id: 'A002',
        assessor_id: 'ASS002',
        work_type_code: 'WT002',
        amount_band_code: 'AB002',
        quote_amount: 2500000,
        market_reference_amount: null,
        deviation_rate_percent: null,
        deviation_amount_yen: null,
        reference_data_count: 0,
        price_book_source: null,
        correction_coefficient: null,
        correction_applicable: false,
        correction_reason: '必須データ欠落',
        assessment_date: new Date('2024-01-15T11:30:00Z'),
      },
      {
        assessment_id: 'A003',
        assessor_id: 'ASS001',
        work_type_code: 'WT001',
        amount_band_code: 'AB003',
        quote_amount: 1500000,
        market_reference_amount: 1480000,
        deviation_rate_percent: 1.35,
        deviation_amount_yen: 20000,
        reference_data_count: 8,
        price_book_source: 'PB2024-Q1',
        correction_coefficient: 1.02,
        correction_applicable: true,
        correction_reason: '季節補正（冬季）',
        assessment_date: new Date('2024-01-15T14:00:00Z'),
      },
      {
        assessment_id: 'A004',
        assessor_id: 'ASS003',
        work_type_code: 'WT003',
        amount_band_code: 'AB001',
        quote_amount: 800000,
        market_reference_amount: 900000,
        deviation_rate_percent: -11.11,
        deviation_amount_yen: -100000,
        reference_data_count: 3,
        price_book_source: 'PB2024-Q1',
        correction_coefficient: undefined,
        correction_applicable: false,
        correction_reason: '参照データ不足（3件未満）',
        assessment_date: new Date('2024-01-15T15:45:00Z'),
      },
      {
        assessment_id: 'A005',
        assessor_id: 'ASS002',
        work_type_code: 'WT002',
        amount_band_code: 'AB002',
        quote_amount: 3000000,
        market_reference_amount: 2900000,
        deviation_rate_percent: 3.45,
        deviation_amount_yen: 100000,
        reference_data_count: 25,
        price_book_source: 'PB2024-Q1',
        correction_coefficient: 1.08,
        correction_applicable: true,
        correction_reason: '地域補正（関西）',
        assessment_date: new Date('2024-01-16T09:00:00Z'),
      },
    ];

    // ========== 関数実行 ==========
    const result = aggregateAndVisualizeAccuracyByAssessorAndWorkType(assessment_results);

    // ========== 検証 ==========
    
    // 1. 結果が返されていることを確認
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // 2. 集計結果の構造を確認
    expect(result).toHaveProperty('summary_by_assessor');
    expect(result).toHaveProperty('summary_by_work_type');
    expect(result).toHaveProperty('summary_by_amount_band');
    expect(result).toHaveProperty('detailed_items');

    // 3. 詳細アイテムが5件すべて含まれていることを確認
    expect(result.detailed_items).toHaveLength(5);

    // 4. 補正係数が計算可能な項目（A001, A003, A005）の検証
    const item_a001 = result.detailed_items.find((item) => item.assessment_id === 'A001');
    expect(item_a001).toBeDefined();
    expect(item_a001!.correction_coefficient).toBe(1.05);
    expect(item_a001!.correction_applicable).toBe(true);
    expect(item_a001!.is_disabled).toBe(false);
    expect(item_a001!.display_state).toBe('enabled');
    expect(item_a001!.unavailable_reason).toBeNull();

    const item_a003 = result.detailed_items.find((item) => item.assessment_id === 'A003');
    expect(item_a003).toBeDefined();
    expect(item_a003!.correction_coefficient).toBe(1.02);
    expect(item_a003!.correction_applicable).toBe(true);
    expect(item_a003!.is_disabled).toBe(false);
    expect(item_a003!.display_state).toBe('enabled');
    expect(item_a003!.unavailable_reason).toBeNull();

    const item_a005 = result.detailed_items.find((item) => item.assessment_id === 'A005');
    expect(item_a005).toBeDefined();
    expect(item_a005!.correction_coefficient).toBe(1.08);
    expect(item_a005!.correction_applicable).toBe(true);
    expect(item_a005!.is_disabled).toBe(false);
    expect(item_a005!.display_state).toBe('enabled');
    expect(item_a005!.unavailable_reason).toBeNull();

    // 5. 補正係数が計算不可の項目（A002: 必須データ欠落）の検証
    const item_a002 = result.detailed_items.find((item) => item.assessment_id === 'A002');
    expect(item_a002).toBeDefined();
    expect(item_a002!.correction_coefficient).toBeNull();
    expect(item_a002!.correction_applicable).toBe(false);
    expect(item_a002!.is_disabled).toBe(true);
    expect(item_a002!.display_state).toBe('disabled');
    expect(item_a002!.unavailable_reason).toBe('必須データ欠落');

    // 6. 補正係数が計算不可の項目（A004: 参照データ不足）の検証
    const item_a004 = result.detailed_items.find((item) => item.assessment_id === 'A004');
    expect(item_a004).toBeDefined();
    expect(item_a004!.correction_coefficient).toBeUndefined();
    expect(item_a004!.correction_applicable).toBe(false);
    expect(item_a004!.is_disabled).toBe(true);
    expect(item_a004!.display_state).toBe('disabled');
    expect(item_a004!.unavailable_reason).toBe('参照データ不足（3件未満）');

    // 7. 査定担当者別集計（ASS001）の検証：計算可能な項目のみカウント
    const summary_ass001 = result.summary_by_assessor.find(
      (summary) => summary.assessor_id === 'ASS001'
    );
    expect(summary_ass001).toBeDefined();
    expect(summary_ass001!.total_assessments).toBe(2);
    expect(summary_ass001!.assessable_count).toBe(2);
    expect(summary_ass001!.disabled_count).toBe(0);
    expect(summary_ass001!.average_deviation_rate_percent).toBe(3.305);
    expect(summary_ass001!.accuracy_score).toBeCloseTo(96.695, 2);

    // 8. 査定担当者別集計（ASS002）の検証：1件が計算不可
    const summary_ass002 = result.summary_by_assessor.find(
      (summary) => summary.assessor_id === 'ASS002'
    );
    expect(summary_ass002).toBeDefined();
    expect(summary_ass002!.total_assessments).toBe(2);
    expect(summary_ass002!.assessable_count).toBe(1);
    expect(summary_ass002!.disabled_count).toBe(1);
    expect(summary_ass002!.average_deviation_rate_percent).toBe(3.45);
    expect(summary_ass002!.accuracy_score).toBeCloseTo(96.55, 2);

    // 9. 査定担当者別集計（ASS003）の検証：参照データ不足により計算不可
    const summary_ass003 = result.summary_by_assessor.find(
      (summary) => summary.assessor_id === 'ASS003'
    );
    expect(summary_ass003).toBeDefined();
    expect(summary_ass003!.total_assessments).toBe(1);
    expect(summary_ass003!.assessable_count).toBe(0);
    expect(summary_ass003!.disabled_count).toBe(1);
    expect(summary_ass003!.average_deviation_rate_percent).toBeNull();
    expect(summary_ass003!.accuracy_score).toBeNull();

    // 10. 工種別集計（WT001）の検証：計算可能な項目のみ集計
    const summary_wt001 = result.summary_by_work_type.find(
      (summary) => summary.work_type_code === 'WT001'
    );
    expect(summary_wt001).toBeDefined();
    expect(summary_wt001!.total_assessments).toBe(2);
    expect(summary_wt001!.assessable_count).toBe(2);
    expect(summary_wt001!.disabled_count).toBe(0);
    expect(summary_wt001!.average_deviation_rate_percent).toBe(3.305);

    // 11. 工種別集計（WT002）の検証：1件が必須データ欠落
    const summary_wt002 = result.summary_by_work_type.find(
      (summary) => summary.work_type_code === 'WT002'
    );
    expect(summary_wt002).toBeDefined();
    expect(summary_wt002!.total_assessments).toBe(2);
    expect(summary_wt002!.assessable_count).toBe(1);
    expect(summary_wt002!.disabled_count).toBe(1);
    expect(summary_wt002!.average_deviation_rate_percent).toBe(3.45);

    // 12. 工種別集計（WT003）の検証：参照データ不足
    const summary_wt003 = result.summary_by_work_type.find(
      (summary) => summary.work_type_code === 'WT003'
    );
    expect(summary_wt003).toBeDefined();
    expect(summary_wt003!.total_assessments).toBe(1);
    expect(summary_wt003!.assessable_count).toBe(0);
    expect(summary_wt003!.disabled_count).toBe(1);

    // 13. 金額帯別集計（AB001）の検証：1件は計算可能、1件は参照データ不足
    const summary_ab001 = result.summary_by_amount_band.find(
      (summary) => summary.amount_band_code === 'AB001'
    );
    expect(summary_ab001).toBeDefined();
    expect(summary_ab001!.total_assessments).toBe(2);
    expect(summary_ab001!.assessable_count).toBe(1);
    expect(summary_ab001!.disabled_count).toBe(1);
    expect(summary_ab001!.average_deviation_rate_percent).toBe(5.26);

    // 14. 金額帯別集計（AB002）の検証：1件は計算可能、1件は必須データ欠落
    const summary_ab002 = result.summary_by_amount_band.find(
      (summary) => summary.amount_band_code === 'AB002'
    );
    expect(summary_ab002).toBeDefined();
    expect(summary_ab002!.total_assessments).toBe(2);
    expect(summary_ab002!.assessable_count).toBe(1);
    expect(summary_ab002!.disabled_count).toBe(1);
    expect(summary_ab002!.average_deviation_rate_percent).toBe(3.45);

    // 15. 金額帯別集計（AB003）の検証：計算可能
    const summary_ab003 = result.summary_by_amount_band.find(
      (summary) => summary.amount_band_code === 'AB003'
    );
    expect(summary_ab003).toBeDefined();
    expect(summary_ab003!.total_assessments).toBe(1);
    expect(summary_ab003!.assessable_count).toBe(1);
    expect(summary_ab003!.disabled_count).toBe(0);
    expect(summary_ab003!.average_deviation_rate_percent).toBe(1.35);

    // 16. グローバル集計統計の検証
    expect(result.global_statistics).toBeDefined();
    expect(result.global_statistics.total_items).toBe(5);
    expect(result.global_statistics.enabled_items_count).toBe(3);
    expect(result.global_statistics.disabled_items_count).toBe(2);
    expect(result.global_statistics.overall_accuracy_score).toBeCloseTo(96.52, 2);
    expect(result.global_statistics.average_deviation_rate_percent).toBeCloseTo(2.01, 2);

    // 17. 無効理由のカテゴリ集計の検証
    expect(result.disabled_reason_summary).toBeDefined();
    expect(result.disabled_reason_summary).toHaveLength(2);

    const reason_missing_data = result.disabled_reason_summary.find(
      (reason) => reason.reason === '必須データ欠落'
    );
    expect(reason_missing_data).toBeDefined();
    expect(reason_missing_data!.count).toBe(1);

    const reason_insufficient_ref = result.disabled_reason_summary.find(
      (reason) => reason.reason === '参照データ不足（3件未満）'
    );
    expect(reason_insufficient_ref).toBeDefined();
    expect(reason_insufficient_ref!.count).toBe(1);

    // 18. 表示状態フラグの一貫性検証
    result.detailed_items.forEach((item) => {
      if (item.is_disabled) {
        expect(item.display_state).toBe('disabled');
        expect(item.unavailable_reason).not.toBeNull();
        expect(item.correction_applicable).toBe(false);
      } else {
        expect(item.display_state).toBe('enabled');
        expect(item.unavailable_reason).toBeNull();
        expect(item.correction_coefficient).not.toBeNull();
      }
    });

    // 19. 計算可能な項目の補正係数が1.0以上であることを検証
    result.detailed_items
      .filter((item) => !item.is_disabled)
      .forEach((item) => {
        expect(item.correction_coefficient).toBeGreaterThanOrEqual(1.0);
      });

    // 20. 集計データの一貫性：小計 = 有効件数 + 無効件数
    expect(result.global_statistics.total_items).toBe(
      result.global_statistics.enabled_items_count + result.global_statistics.disabled_items_count
    );
  });
});