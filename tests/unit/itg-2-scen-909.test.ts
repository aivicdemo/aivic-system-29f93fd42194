import { cleanLearningDataExcludeIrrecoverableMissing } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-909: 補完不可能な欠損値が存在する場合にレコードを除外する', () => {
    // テストデータセット準備
    const input_records = [
      {
        record_id: 'rec_001',
        estimate_date: '2024-01-15',
        work_type: '建築',
        amount: 5000000,
        quantity: 100,
        unit_price: 50000,
        region: '東京',
        past_case_count: 25,
        reference_price: 48000,
        price_deviation_rate: 4.17
      },
      {
        record_id: 'rec_002',
        estimate_date: '2024-01-16',
        work_type: null, // 補完不可能な欠損値：必須項目
        amount: 3000000,
        quantity: 60,
        unit_price: 50000,
        region: '大阪',
        past_case_count: 15,
        reference_price: 49000,
        price_deviation_rate: 2.04
      },
      {
        record_id: 'rec_003',
        estimate_date: '2024-01-17',
        work_type: '土木',
        amount: null, // 補完不可能な欠損値：必須項目
        quantity: 80,
        unit_price: 40000,
        region: '名古屋',
        past_case_count: null, // 補完可能な欠損値
        reference_price: 39500,
        price_deviation_rate: 1.27
      },
      {
        record_id: 'rec_004',
        estimate_date: null, // 補完不可能な欠損値：必須項目
        work_type: '電気工事',
        amount: 2000000,
        quantity: 50,
        unit_price: 40000,
        region: '福岡',
        past_case_count: 8,
        reference_price: 41000,
        price_deviation_rate: -2.44
      },
      {
        record_id: 'rec_005',
        estimate_date: '2024-01-19',
        work_type: '設備',
        amount: 4000000,
        quantity: 70,
        unit_price: null, // 補完可能な欠損値
        region: '札幌',
        past_case_count: 12,
        reference_price: 57000,
        price_deviation_rate: -29.82
      },
      {
        record_id: 'rec_006',
        estimate_date: '2024-01-20',
        work_type: '建築',
        amount: 6000000,
        quantity: null, // 補完不可能な欠損値：必須項目
        unit_price: 60000,
        region: '京都',
        past_case_count: 30,
        reference_price: 59500,
        price_deviation_rate: 0.84
      }
    ];

    const missing_value_thresholds = {
      irrecoverable_required_fields: ['record_id', 'estimate_date', 'work_type', 'amount', 'quantity', 'unit_price', 'region', 'reference_price', 'price_deviation_rate'],
      recoverable_fields: ['past_case_count', 'unit_price'],
      max_missing_rate_irrecoverable: 0.0
    };

    // データクリーニング機能実行
    const result = cleanLearningDataExcludeIrrecoverableMissing(
      input_records,
      missing_value_thresholds
    );

    // 補完不可能な欠損値を持つレコード特定：rec_002, rec_003, rec_004, rec_006
    // 補完可能な欠損値のみを持つレコード：rec_001（欠損なし）, rec_005（past_case_count と unit_price が欠損可能）

    // 期待結果：処理後レコード数（除外されたもの：4件、残存：2件）
    expect(result.cleaned_records.length).toBe(2);

    // 除外されたレコードが正確であることを確認
    expect(result.excluded_records.length).toBe(4);

    // 残存レコードの確認
    const remaining_record_ids = result.cleaned_records.map((r: any) => r.record_id).sort();
    expect(remaining_record_ids).toEqual(['rec_001', 'rec_005']);

    // 除外されたレコードのID確認
    const excluded_record_ids = result.excluded_records.map((r: any) => r.record_id).sort();
    expect(excluded_record_ids).toEqual(['rec_002', 'rec_003', 'rec_004', 'rec_006']);

    // 除外処理ログの検証
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.total_records_processed).toBe(6);
    expect(result.audit_log.records_excluded_count).toBe(4);
    expect(result.audit_log.records_retained_count).toBe(2);

    // 各除外レコードの理由確認
    const exclusion_reasons = result.excluded_records.map((r: any) => ({
      record_id: r.record_id,
      reason: r.exclusion_reason
    }));

    const rec_002_reason = exclusion_reasons.find((r: any) => r.record_id === 'rec_002');
    expect(rec_002_reason.reason).toMatch(/work_type/);

    const rec_003_reason = exclusion_reasons.find((r: any) => r.record_id === 'rec_003');
    expect(rec_003_reason.reason).toMatch(/amount/);

    const rec_004_reason = exclusion_reasons.find((r: any) => r.record_id === 'rec_004');
    expect(rec_004_reason.reason).toMatch(/estimate_date/);

    const rec_006_reason = exclusion_reasons.find((r: any) => r.record_id === 'rec_006');
    expect(rec_006_reason.reason).toMatch(/quantity/);

    // 監査証跡の詳細確認
    expect(result.audit_log.execution_timestamp).toBeDefined();
    expect(result.audit_log.execution_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(result.audit_log.missing_value_criteria).toBeDefined();
    expect(result.audit_log.missing_value_criteria.irrecoverable_required_fields_count).toBe(9);
    expect(result.audit_log.missing_value_criteria.recoverable_fields_count).toBe(2);

    // 補完可能な欠損値を持つレコードが残存していることを確認
    const rec_005 = result.cleaned_records.find((r: any) => r.record_id === 'rec_005');
    expect(rec_005).toBeDefined();
    expect(rec_005.past_case_count).toBeNull();
    expect(rec_005.unit_price).toBeNull();

    // 補完不可能な欠損値を持つレコードが除外されていることを確認
    const rec_002_excluded = result.excluded_records.find((r: any) => r.record_id === 'rec_002');
    expect(rec_002_excluded.work_type).toBeNull();

    // 処理精度指標：除外率の計算検証
    const exclusion_rate = (result.audit_log.records_excluded_count / result.audit_log.total_records_processed) * 100;
    expect(exclusion_rate).toBe(66.67);

    // クリーニング後データセットの完全性チェック
    result.cleaned_records.forEach((record: any) => {
      const required_fields = ['record_id', 'estimate_date', 'work_type', 'amount', 'quantity', 'region', 'reference_price', 'price_deviation_rate'];
      required_fields.forEach((field: string) => {
        expect(record[field]).not.toBeNull();
      });
    });

    // 処理状態フラグの確認
    expect(result.processing_status).toBe('completed');
    expect(result.success).toBe(true);
  });
});