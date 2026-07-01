import { describe, test, expect, beforeEach } from '@jest/globals';
import { updateContractWithZeroBillingAmount } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1253
  test('[edge] 契約・請求データ更新機能 - 請求額が0円の契約変更でもデータが正しく更新される', () => {
    // テストデータ: 請求額が0円の契約情報
    const contract_id = 'CT_20240115_001';
    const customer_id = 'CUST_0001';
    const contract_name_before = '基本契約A';
    const contract_name_after = '基本契約A_更新版';
    const contract_start_date = '2024-01-01';
    const contract_end_date = '2024-12-31';
    const service_type = 'consultation';
    const billing_amount_before = 0;
    const billing_amount_after = 0;
    const changed_by = 'OP_representative_001';
    const change_timestamp = '2024-01-15T09:30:00Z';

    const input_contract = {
      contract_id,
      customer_id,
      contract_name: contract_name_before,
      contract_start_date,
      contract_end_date,
      service_type,
      billing_amount: billing_amount_before,
    };

    const update_data = {
      contract_name: contract_name_after,
      contract_start_date,
      contract_end_date,
      service_type,
      billing_amount: billing_amount_after,
      changed_by,
      change_timestamp,
    };

    // 実行: 契約情報を更新
    const result = updateContractWithZeroBillingAmount(input_contract, update_data);

    // 検証: 契約情報が正しく更新されている
    expect(result.contract_id).toBe(contract_id);
    expect(result.customer_id).toBe(customer_id);
    expect(result.contract_name).toBe(contract_name_after);
    expect(result.contract_start_date).toBe(contract_start_date);
    expect(result.contract_end_date).toBe(contract_end_date);
    expect(result.service_type).toBe(service_type);

    // 検証: 請求額が0円のまま維持されている
    expect(result.billing_amount).toBe(0);

    // 検証: 請求データが正常に生成されている
    expect(result.billing_record).toBeDefined();
    expect(result.billing_record.contract_id).toBe(contract_id);
    expect(result.billing_record.customer_id).toBe(customer_id);
    expect(result.billing_record.billing_amount).toBe(0);
    expect(result.billing_record.billing_status).toBe('confirmed');

    // 検証: 監査ログに変更履歴が記録されている
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.contract_id).toBe(contract_id);
    expect(result.audit_log.change_type).toBe('contract_update');
    expect(result.audit_log.changed_by).toBe(changed_by);
    expect(result.audit_log.change_timestamp).toBe(change_timestamp);
    expect(result.audit_log.before_state).toEqual({
      contract_name: contract_name_before,
      billing_amount: billing_amount_before,
    });
    expect(result.audit_log.after_state).toEqual({
      contract_name: contract_name_after,
      billing_amount: billing_amount_after,
    });

    // 検証: システムエラーや例外が発生していない
    expect(result.success).toBe(true);
    expect(result.error_message).toBeUndefined();

    // 検証: データベース内の関連データに矛盾が生じていない
    expect(result.data_integrity_check).toBe(true);
    expect(result.related_records_count).toBe(1);
    expect(result.billing_records_count).toBe(1);
  });
});