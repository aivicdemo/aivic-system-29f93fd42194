import { describe, test, expect, beforeEach } from '@jest/globals';
import { recordDocumentVersionHistory } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 契約書・提案資料バージョン履歴自動記録', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-765: [normal] 契約書・提案資料バージョン履歴自動記録機能 - 更新者・日時・変更内容・有効期限がすべて正しい値でシステムに記録される
  test('SCEN-765: バージョン履歴に更新者・日時・変更内容・有効期限がすべて正確に記録される', () => {
    const login_user_id = 'USR001';
    const login_user_name = '営業オペレーター太郎';
    const document_id = 'DOC20240115001';
    const document_type = 'contract';
    const document_name = '基本契約書_顧客A';
    const previous_content = {
      contract_term_months: 12,
      monthly_fee: 100000,
      discount_rate: 0,
      service_type: 'basic',
    };
    const updated_content = {
      contract_term_months: 24,
      monthly_fee: 95000,
      discount_rate: 5,
      service_type: 'premium',
    };
    const update_timestamp = new Date('2024-01-15T11:30:45Z');
    const effective_start_date = new Date('2024-02-01T00:00:00Z');
    const effective_end_date = new Date('2025-01-31T23:59:59Z');

    const change_summary = {
      modified_fields: [
        { field_name: 'contract_term_months', old_value: 12, new_value: 24 },
        { field_name: 'monthly_fee', old_value: 100000, new_value: 95000 },
        { field_name: 'discount_rate', old_value: 0, new_value: 5 },
        { field_name: 'service_type', old_value: 'basic', new_value: 'premium' },
      ],
      change_description: '契約期間を12ヶ月から24ヶ月に延長、月額料金を10万から9.5万に改定、割引率を5%適用、サービス種別をプレミアムに変更',
    };

    const version_history_input = {
      document_id: document_id,
      document_type: document_type,
      document_name: document_name,
      updated_by_user_id: login_user_id,
      updated_by_user_name: login_user_name,
      update_timestamp: update_timestamp,
      previous_content: previous_content,
      updated_content: updated_content,
      change_details: change_summary,
      effective_start_date: effective_start_date,
      effective_end_date: effective_end_date,
    };

    const recorded_history = recordDocumentVersionHistory(version_history_input);

    expect(recorded_history).toBeDefined();
    expect(recorded_history.version_history_id).toMatch(/^VH\d{14}$/);
    
    expect(recorded_history.updated_by_user_id).toBe(login_user_id);
    expect(recorded_history.updated_by_user_name).toBe(login_user_name);
    
    expect(recorded_history.update_timestamp).toEqual(update_timestamp);
    expect(recorded_history.update_timestamp.toISOString()).toBe('2024-01-15T11:30:45.000Z');
    
    expect(recorded_history.document_id).toBe(document_id);
    expect(recorded_history.document_type).toBe(document_type);
    expect(recorded_history.document_name).toBe(document_name);
    
    expect(recorded_history.change_details.modified_fields).toHaveLength(4);
    expect(recorded_history.change_details.modified_fields[0]).toEqual({
      field_name: 'contract_term_months',
      old_value: 12,
      new_value: 24,
    });
    expect(recorded_history.change_details.modified_fields[1]).toEqual({
      field_name: 'monthly_fee',
      old_value: 100000,
      new_value: 95000,
    });
    expect(recorded_history.change_details.modified_fields[2]).toEqual({
      field_name: 'discount_rate',
      old_value: 0,
      new_value: 5,
    });
    expect(recorded_history.change_details.modified_fields[3]).toEqual({
      field_name: 'service_type',
      old_value: 'basic',
      new_value: 'premium',
    });
    
    expect(recorded_history.change_details.change_description).toBe(
      '契約期間を12ヶ月から24ヶ月に延長、月額料金を10万から9.5万に改定、割引率を5%適用、サービス種別をプレミアムに変更'
    );
    
    expect(recorded_history.effective_start_date).toEqual(effective_start_date);
    expect(recorded_history.effective_end_date).toEqual(effective_end_date);
    expect(recorded_history.effective_start_date.toISOString()).toBe('2024-02-01T00:00:00.000Z');
    expect(recorded_history.effective_end_date.toISOString()).toBe('2025-01-31T23:59:59.000Z');
    
    expect(recorded_history.is_active).toBe(true);
    expect(recorded_history.created_at).toBeInstanceOf(Date);
    
    const second_update_timestamp = new Date('2024-01-15T14:45:20Z');
    const second_update_content = {
      contract_term_months: 24,
      monthly_fee: 95000,
      discount_rate: 5,
      service_type: 'premium',
      auto_renewal: true,
    };
    const second_change_summary = {
      modified_fields: [
        { field_name: 'auto_renewal', old_value: undefined, new_value: true },
      ],
      change_description: '自動更新フラグを追加',
    };

    const second_version_history_input = {
      document_id: document_id,
      document_type: document_type,
      document_name: document_name,
      updated_by_user_id: 'USR002',
      updated_by_user_name: '営業マネージャー花子',
      update_timestamp: second_update_timestamp,
      previous_content: updated_content,
      updated_content: second_update_content,
      change_details: second_change_summary,
      effective_start_date: effective_start_date,
      effective_end_date: effective_end_date,
    };

    const second_recorded_history = recordDocumentVersionHistory(second_version_history_input);

    expect(second_recorded_history).toBeDefined();
    expect(second_recorded_history.updated_by_user_id).toBe('USR002');
    expect(second_recorded_history.updated_by_user_name).toBe('営業マネージャー花子');
    expect(second_recorded_history.update_timestamp).toEqual(second_update_timestamp);
    expect(second_recorded_history.update_timestamp.getTime()).toBeGreaterThan(
      recorded_history.update_timestamp.getTime()
    );
    expect(second_recorded_history.change_details.modified_fields).toHaveLength(1);
    expect(second_recorded_history.change_details.modified_fields[0]).toEqual({
      field_name: 'auto_renewal',
      old_value: undefined,
      new_value: true,
    });
  });
});