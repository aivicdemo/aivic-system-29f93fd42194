import { describe, it, expect } from '@jest/globals';
import { validateContractBillingAlignment } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  it('SCEN-905: 契約書の納期が営業データの報告期間と異なる場合、納期ズレの内容と原因候補を構造化フォーマットで返す', () => {
    const contractData = {
      contract_id: 'CTR-001',
      customer_id: 'CUST-001',
      delivery_date: '2024-03-31',
      service_type: 'sales_support',
    };

    const salesData = {
      sales_id: 'SLS-001',
      customer_id: 'CUST-001',
      reporting_period_start: '2024-04-01',
      reporting_period_end: '2024-04-30',
      appointment_count: 10,
      contract_count: 5,
    };

    const result = validateContractBillingAlignment(contractData, salesData);

    expect(result.error_code).toBe('DELIVERY_DATE_MISMATCH');
    expect(result.message).toBe('契約納期と営業報告期間に不整合があります');
    expect(result.mismatch_details).toEqual({
      contract_delivery_date: '2024-03-31',
      sales_reporting_period_end: '2024-04-30',
      days_gap: 30,
    });
    expect(result.root_cause_candidates).toEqual([
      '営業報告の遅延',
      '契約条件の更新漏れ',
      '請求期間の誤設定',
    ]);
    expect(result.status).toBe('validation_failed');
  });
});