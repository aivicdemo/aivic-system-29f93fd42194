import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  validateSalesDataQuality,
} from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証 - 範囲外異常値検出', () => {
  // SCEN-595
  test('定義された範囲外の異常値が検出され不合格判定される', () => {
    const invalidTestData = {
      sales_data_id: 'SD-20240115-001',
      customer_id: 'CUST-12345',
      service_type: 'SERVICE-A',
      contact_date: '2024-01-15',
      appointment_count: 5,
      contract_count: 3,
      sales_amount: 5000000, // 許容上限値を超える（仮定: 上限100万円）
      negotiation_period_days: -5, // 負の値（不正）
      customer_sentiment_score: 150, // 許容範囲外（仮定: 0-100）
      status: 'COMPLETED',
    };

    const qualityRules = {
      sales_amount: {
        min: 0,
        max: 1000000,
        field_name: '売上金額',
      },
      negotiation_period_days: {
        min: 0,
        max: 365,
        field_name: '商談期間日数',
      },
      customer_sentiment_score: {
        min: 0,
        max: 100,
        field_name: '顧客評価スコア',
      },
    };

    const result = validateSalesDataQuality(invalidTestData, qualityRules);

    // 判定ステータスが不合格であることを確認
    expect(result.validation_status).toBe('FAILED');

    // 検出された異常値の個数を確認（3件の範囲外エラー）
    expect(result.detected_errors).toHaveLength(3);

    // 売上金額の異常値が検出されていることを確認
    const sales_amount_error = result.detected_errors.find(
      (err) => err.field_name === '売上金額'
    );
    expect(sales_amount_error).toBeDefined();
    expect(sales_amount_error?.detected_value).toBe(5000000);
    expect(sales_amount_error?.allowed_min).toBe(0);
    expect(sales_amount_error?.allowed_max).toBe(1000000);
    expect(sales_amount_error?.error_type).toBe('OUT_OF_RANGE');

    // 商談期間日数の異常値が検出されていることを確認
    const period_error = result.detected_errors.find(
      (err) => err.field_name === '商談期間日数'
    );
    expect(period_error).toBeDefined();
    expect(period_error?.detected_value).toBe(-5);
    expect(period_error?.allowed_min).toBe(0);
    expect(period_error?.allowed_max).toBe(365);
    expect(period_error?.error_type).toBe('OUT_OF_RANGE');

    // 顧客評価スコアの異常値が検出されていることを確認
    const sentiment_error = result.detected_errors.find(
      (err) => err.field_name === '顧客評価スコア'
    );
    expect(sentiment_error).toBeDefined();
    expect(sentiment_error?.detected_value).toBe(150);
    expect(sentiment_error?.allowed_min).toBe(0);
    expect(sentiment_error?.allowed_max).toBe(100);
    expect(sentiment_error?.error_type).toBe('OUT_OF_RANGE');

    // エラーメッセージが適切に生成されていることを確認
    expect(result.error_message).toContain('売上金額');
    expect(result.error_message).toContain('商談期間日数');
    expect(result.error_message).toContain('顧客評価スコア');

    // 請求自動化処理が実行されないことを確認
    expect(result.can_proceed_to_billing).toBe(false);

    // 検証スタンプが記録されていることを確認
    expect(result.validation_timestamp).toBeDefined();
    expect(typeof result.validation_timestamp).toBe('string');

    // 検証ルール適用日時が記録されていることを確認
    expect(result.rule_version).toBeDefined();
  });
});