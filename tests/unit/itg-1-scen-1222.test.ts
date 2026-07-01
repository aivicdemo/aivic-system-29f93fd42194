import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  detectSalesDataChange,
  registerContractChange,
  verifySalesDataUpdate,
} from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1222: [normal] 営業データ変更の自動検知・通知機能 - 営業成果データ（アポ数、成約数）の入力変更が検知され、契約変更管理システムに自動登録される
  test('営業成果データの変更が自動検知され契約変更管理システムに登録される', () => {
    // 既存の営業成果データ
    const existing_appointment_count = 10;
    const existing_contract_count = 5;
    const contract_id = 'CONTRACT-2024-001';
    const user_id = 'USER-REP-001';
    const change_timestamp = new Date('2024-01-15T11:00:00Z');

    // 変更後の営業成果データ
    const updated_appointment_count = 15;
    const updated_contract_count = 8;

    // ステップ1: データ変更を自動検知
    const detection_result = detectSalesDataChange({
      contract_id,
      user_id,
      previous_data: {
        appointment_count: existing_appointment_count,
        contract_count: existing_contract_count,
      },
      current_data: {
        appointment_count: updated_appointment_count,
        contract_count: updated_contract_count,
      },
      change_timestamp,
    });

    // 変更が検知されたことを確認
    expect(detection_result.is_changed).toBe(true);
    expect(detection_result.change_type).toBe('sales_data_update');

    // 変更内容の詳細を確認
    expect(detection_result.changes).toEqual([
      {
        field: 'appointment_count',
        previous_value: 10,
        current_value: 15,
        difference: 5,
      },
      {
        field: 'contract_count',
        previous_value: 5,
        current_value: 8,
        difference: 3,
      },
    ]);

    // ステップ2: 変更内容を契約変更管理システムに登録
    const registration_result = registerContractChange({
      contract_id,
      change_type: 'sales_data_update',
      changed_fields: detection_result.changes,
      detected_by: user_id,
      detected_at: change_timestamp,
      notification_status: 'pending',
    });

    // 登録成功を確認
    expect(registration_result.success).toBe(true);
    expect(registration_result.record_id).toBeDefined();
    expect(registration_result.registration_timestamp).toEqual(change_timestamp);

    // 登録されたレコードの詳細情報を確認
    const registered_record = {
      record_id: registration_result.record_id,
      contract_id,
      change_type: 'sales_data_update',
      previous_values: {
        appointment_count: 10,
        contract_count: 5,
      },
      current_values: {
        appointment_count: 15,
        contract_count: 8,
      },
      changed_by_user: user_id,
      registered_at: change_timestamp,
      notification_sent_at: null,
      status: 'pending_notification',
    };

    const verification_result = verifySalesDataUpdate({
      record_id: registered_record.record_id,
      contract_id,
      expected_previous_appointment_count: 10,
      expected_current_appointment_count: 15,
      expected_previous_contract_count: 5,
      expected_current_contract_count: 8,
      expected_changed_by: user_id,
      expected_registration_timestamp: change_timestamp,
    });

    // 登録データの正確性を確認
    expect(verification_result.is_accurate).toBe(true);
    expect(verification_result.previous_appointment_count).toBe(10);
    expect(verification_result.current_appointment_count).toBe(15);
    expect(verification_result.appointment_count_delta).toBe(5);
    expect(verification_result.previous_contract_count).toBe(5);
    expect(verification_result.current_contract_count).toBe(8);
    expect(verification_result.contract_count_delta).toBe(3);
    expect(verification_result.changed_by_user).toBe('USER-REP-001');
    expect(verification_result.record_status).toBe('pending_notification');
    expect(verification_result.all_required_fields_present).toBe(true);
  });
});