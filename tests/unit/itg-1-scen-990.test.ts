import { describe, test, expect } from '@jest/globals';
import { determineBillingRuleRetroactiveApplication } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-990: 請求ルール変更時の遡及非適用判定 - 遡及非適用期間の請求額が変更の影響を受けない', () => {
    // 前提: 請求ルール変更が決定され、変更内容と適用開始日が明確になっている状態
    // 発生条件: 請求ルール（割引基準、計算ロジック、対象項目）に変更が発生し、
    //           過去データへの遡及適用の要否を判定する必要が生じたとき
    // 期待結果: 変更前後の契約・営業データを照合し、遡及適用対象期間と非適用期間を明確にして、
    //           請求額の再計算対象を決定する

    // 現在の日付: 2024-01-15
    const current_date = new Date('2024-01-15T09:00:00Z');

    // 新しい請求ルール設定
    // - 基本料金: 10,000円 (変更前: 8,000円)
    // - 割引率: 15% (変更前: 10%)
    // - 適用開始日: 2024-02-14 (30日後)
    // - 遡及適用フラグ: false (非適用)
    const new_billing_rule = {
      rule_id: 'RULE_2024_FEB_001',
      basic_fee: 10000,
      discount_rate: 15,
      effective_date: new Date('2024-02-14T00:00:00Z'),
      retroactive_apply: false,
    };

    // 対象顧客の過去90日分の請求データ
    // 遡及非適用期間（2023-10-17 ～ 2024-02-13): 古い請求ルールを適用
    // 適用開始日以降（2024-02-14 ～ 2024-01-15): 新しい請求ルールを適用

    const billing_history = [
      {
        customer_id: 'CUST_001',
        billing_date: new Date('2023-11-15T00:00:00Z'),
        amount_before_discount: 8000,
        discount_rate: 10,
        final_amount: 7200, // 8000 * (1 - 0.10) = 7200
      },
      {
        customer_id: 'CUST_001',
        billing_date: new Date('2023-12-15T00:00:00Z'),
        amount_before_discount: 8000,
        discount_rate: 10,
        final_amount: 7200, // 8000 * (1 - 0.10) = 7200
      },
      {
        customer_id: 'CUST_001',
        billing_date: new Date('2024-01-15T00:00:00Z'),
        amount_before_discount: 8000,
        discount_rate: 10,
        final_amount: 7200, // 8000 * (1 - 0.10) = 7200
      },
      {
        customer_id: 'CUST_001',
        billing_date: new Date('2024-02-14T00:00:00Z'),
        amount_before_discount: 10000,
        discount_rate: 15,
        final_amount: 8500, // 10000 * (1 - 0.15) = 8500
      },
      {
        customer_id: 'CUST_002',
        billing_date: new Date('2023-11-20T00:00:00Z'),
        amount_before_discount: 8000,
        discount_rate: 10,
        final_amount: 7200,
      },
      {
        customer_id: 'CUST_002',
        billing_date: new Date('2024-02-14T00:00:00Z'),
        amount_before_discount: 10000,
        discount_rate: 15,
        final_amount: 8500,
      },
    ];

    // 遡及非適用期間の請求データを取得（適用開始日より前）
    const retroactive_non_apply_period_data = billing_history.filter(
      (record) => record.billing_date < new_billing_rule.effective_date
    );

    // 適用開始日以降の請求データを取得
    const retroactive_apply_period_data = billing_history.filter(
      (record) => record.billing_date >= new_billing_rule.effective_date
    );

    // テスト対象関数を呼び出す
    const result = determineBillingRuleRetroactiveApplication({
      current_date,
      new_billing_rule,
      billing_history,
      retroactive_apply: new_billing_rule.retroactive_apply,
    });

    // 検証 1: 遡及非適用期間のデータが変更されていないことを確認
    // CUST_001 の 2023-11-15, 2023-12-15, 2024-01-15 の請求額は変わらない
    expect(result.non_retroactive_period_records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: 'CUST_001',
          billing_date: new Date('2023-11-15T00:00:00Z'),
          original_final_amount: 7200,
          recalculated_final_amount: 7200, // 変更されない
        }),
        expect.objectContaining({
          customer_id: 'CUST_001',
          billing_date: new Date('2023-12-15T00:00:00Z'),
          original_final_amount: 7200,
          recalculated_final_amount: 7200, // 変更されない
        }),
        expect.objectContaining({
          customer_id: 'CUST_001',
          billing_date: new Date('2024-01-15T00:00:00Z'),
          original_final_amount: 7200,
          recalculated_final_amount: 7200, // 変更されない
        }),
      ])
    );

    // 検証 2: 適用開始日以降のデータが新ルールで計算されていることを確認
    // CUST_001 の 2024-02-14 の請求額は新ルール適用: 10000 * (1 - 0.15) = 8500
    expect(result.retroactive_apply_period_records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: 'CUST_001',
          billing_date: new Date('2024-02-14T00:00:00Z'),
          original_final_amount: 8500,
          recalculated_final_amount: 8500, // 新ルール適用後も同値（変更なし）
        }),
      ])
    );

    // 検証 3: 複数顧客について同じ検証
    // CUST_002 の遡及非適用期間 (2023-11-20) は変경되지 않음
    const cust002_non_retroactive = result.non_retroactive_period_records.filter(
      (r) => r.customer_id === 'CUST_002'
    );
    expect(cust002_non_retroactive.length).toBeGreaterThan(0);
    expect(cust002_non_retroactive[0].original_final_amount).toBe(7200);
    expect(cust002_non_retroactive[0].recalculated_final_amount).toBe(7200);

    // 検証 4: 遡及非適用フラグが false に設定されていることを確認
    expect(result.retroactive_apply_flag).toBe(false);

    // 検証 5: 適用開始日が正しく設定されていることを確認
    expect(result.effective_date).toEqual(new Date('2024-02-14T00:00:00Z'));

    // 検証 6: 再計算対象期間が正しく分離されていることを確認
    expect(result.split_period_info).toEqual({
      non_retroactive_period_start: new Date('2023-10-17T00:00:00Z'),
      non_retroactive_period_end: new Date('2024-02-13T23:59:59Z'),
      retroactive_apply_period_start: new Date('2024-02-14T00:00:00Z'),
      retroactive_apply_period_end: new Date('2024-01-15T09:00:00Z'),
    });

    // 検証 7: 全体的な処理結果ステータスが 'success' であることを確認
    expect(result.status).toBe('success');

    // 検証 8: 変更の影響を受けた期間と受けない期間の統計
    expect(result.statistics).toEqual({
      total_billing_records: 6,
      non_retroactive_records_count: 4,
      retroactive_records_count: 2,
      non_retroactive_amount_unchanged: true,
      retroactive_amount_updated: true,
    });
  });
});