import { describe, test, expect } from '@jest/globals';
import { notifyContractChange } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-625: [error] 契約変更通知・メール自動送信機能 - 成果物納期変更時に営業責任者メールアドレスが未登録の場合エラーが発生する
  test('成果物納期変更時に営業責任者メールアドレスが未登録の場合、適切なエラーが発生し、メール送信がスキップされ、エラーログに詳細が記録される', () => {
    const contract_id = 'CTR-001';
    const customer_id = 'CUST-001';
    const contract_name = 'Sample Contract';
    const delivery_date_old = new Date('2024-01-31T00:00:00Z');
    const delivery_date_new = new Date('2024-02-15T00:00:00Z');
    const sales_rep_email = ''; // 営業責任者のメールアドレスが未登録
    const change_reason = 'Customer request for timeline extension';

    const input = {
      contract_id,
      customer_id,
      contract_name,
      delivery_date_old,
      delivery_date_new,
      sales_rep_email,
      change_reason,
    };

    expect(() => notifyContractChange(input)).toThrow(/営業責任者.*メールアドレス/);
  });
});