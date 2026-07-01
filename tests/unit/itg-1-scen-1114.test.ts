import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateSalesDataQualityWithUrgency } from '../../src/logic/it-1781935279444-2-2-1';

const fetchMock = require('jest-fetch-mock');

describe('営業データ品質検証ルール定義・実行機能 - 緊急度最高値の即座ドキュメント反映', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // SCEN-1114
  test('緊急度が最高値に設定された項目は検証実行後、遅延なくドキュメント反映対象として最優先度で抽出・表示される', () => {
    // ===== Setup: 検証ルール定義 =====
    const urgencyLevel5Rule = {
      rule_id: 'rule-urgent-001',
      rule_name: '必須項目_顧客名_緊急度5',
      target_field: 'customer_name',
      rule_type: 'required_field',
      urgency_level: 5, // 最高値
      error_message: '顧客名が入力されていません',
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'user-admin-001'
    };

    const normalRule = {
      rule_id: 'rule-normal-001',
      rule_name: 'データ型_売上金額_緊急度2',
      target_field: 'sales_amount',
      rule_type: 'data_type_numeric',
      urgency_level: 2,
      error_message: '売上金額は数値である必要があります',
      created_at: '2024-01-15T09:05:00Z',
      created_by: 'user-admin-001'
    };

    // ===== Input: 検証対象データセット =====
    const validationDataset = [
      {
        record_id: 'sales-rec-001',
        customer_name: '', // 必須項目 空値 → rule-urgent-001 違反
        sales_amount: '150000',
        contact_date: '2024-01-10',
        appointment_status: 'confirmed'
      },
      {
        record_id: 'sales-rec-002',
        customer_name: 'CompanyA',
        sales_amount: 'invalid_number', // データ型エラー → rule-normal-001 違反
        contact_date: '2024-01-11',
        appointment_status: 'pending'
      },
      {
        record_id: 'sales-rec-003',
        customer_name: 'CompanyB',
        sales_amount: '200000',
        contact_date: '2024-01-12',
        appointment_status: 'confirmed'
      }
    ];

    const validationRules = [urgencyLevel5Rule, normalRule];

    // ===== Mocked API: 検証実行エンドポイント =====
    const mockValidationResponse = {
      validation_id: 'val-exec-2024-001',
      execution_timestamp: '2024-01-15T11:00:00Z',
      dataset_records_count: 3,
      violations_count: 2,
      violations: [
        {
          violation_id: 'vio-001',
          record_id: 'sales-rec-001',
          rule_id: 'rule-urgent-001',
          urgency_level: 5,
          field_name: 'customer_name',
          field_value: '',
          error_message: '顧客名が入力されていません',
          severity: 'critical',
          detection_timestamp: '2024-01-15T11:00:00Z',
          status: 'detected'
        },
        {
          violation_id: 'vio-002',
          record_id: 'sales-rec-002',
          rule_id: 'rule-normal-001',
          urgency_level: 2,
          field_name: 'sales_amount',
          field_value: 'invalid_number',
          error_message: '売上金額は数値である必要があります',
          severity: 'warning',
          detection_timestamp: '2024-01-15T11:00:00Z',
          status: 'detected'
        }
      ],
      document_reflection_queue: [
        {
          queue_priority: 1,
          violation_id: 'vio-001',
          urgency_level: 5,
          record_id: 'sales-rec-001',
          rule_id: 'rule-urgent-001',
          field_name: 'customer_name',
          error_content: '顧客名が入力されていません',
          data_value: '',
          timestamp: '2024-01-15T11:00:00Z',
          queued_for_document_reflection_at: '2024-01-15T11:00:00Z',
          reflection_status: 'queued'
        },
        {
          queue_priority: 2,
          violation_id: 'vio-002',
          urgency_level: 2,
          record_id: 'sales-rec-002',
          rule_id: 'rule-normal-001',
          field_name: 'sales_amount',
          error_content: '売上金額は数値である必要があります',
          data_value: 'invalid_number',
          timestamp: '2024-01-15T11:00:00Z',
          queued_for_document_reflection_at: '2024-01-15T11:00:01Z',
          reflection_status: 'queued'
        }
      ],
      billing_system_integration_log: {
        integration_timestamp: '2024-01-15T11:00:00Z',
        status: 'success',
        enqueued_violations_count: 1,
        enqueued_records: [
          {
            violation_id: 'vio-001',
            urgency_level: 5,
            queue_entry_id: 'queue-entry-urgent-001',
            processing_priority: 'highest',
            enqueued_at: '2024-01-15T11:00:00Z'
          }
        ]
      }
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockValidationResponse), {
      status: 200
    });

    // ===== Execute: 検証実行 =====
    const result = validateSalesDataQualityWithUrgency(
      validationDataset,
      validationRules
    );

    // ===== Assertions =====
    // 1. 検証実行ID が返却される
    expect(result.validation_id).toBe('val-exec-2024-001');

    // 2. 違反件数が正確に計算される
    expect(result.violations_count).toBe(2);
    expect(result.violations.length).toBe(2);

    // 3. ドキュメント反映対象キューが存在し、最優先度が緊急度5の項目である
    expect(result.document_reflection_queue).toBeDefined();
    expect(result.document_reflection_queue.length).toBe(2);

    const topPriorityItem = result.document_reflection_queue[0];
    expect(topPriorityItem.queue_priority).toBe(1);
    expect(topPriorityItem.urgency_level).toBe(5);
    expect(topPriorityItem.violation_id).toBe('vio-001');
    expect(topPriorityItem.field_name).toBe('customer_name');

    // 4. 緊急度5の項目の詳細情報が正確に反映されている
    expect(topPriorityItem.record_id).toBe('sales-rec-001');
    expect(topPriorityItem.rule_id).toBe('rule-urgent-001');
    expect(topPriorityItem.error_content).toBe('顧客名が入力されていません');
    expect(topPriorityItem.data_value).toBe('');
    expect(topPriorityItem.timestamp).toBe('2024-01-15T11:00:00Z');
    expect(topPriorityItem.queued_for_document_reflection_at).toBe(
      '2024-01-15T11:00:00Z'
    );
    expect(topPriorityItem.reflection_status).toBe('queued');

    // 5. 二番目の項目は緊急度2（通常優先度）である
    const secondPriorityItem = result.document_reflection_queue[1];
    expect(secondPriorityItem.queue_priority).toBe(2);
    expect(secondPriorityItem.urgency_level).toBe(2);
    expect(secondPriorityItem.violation_id).toBe('vio-002');

    // 6. 請求自動化システムへの連携ログが存在
    expect(result.billing_system_integration_log).toBeDefined();
    expect(result.billing_system_integration_log.status).toBe('success');

    // 7. 請求システムのキューに緊急度5の項目が即座に登録されている
    expect(
      result.billing_system_integration_log.enqueued_violations_count
    ).toBe(1);
    expect(result.billing_system_integration_log.enqueued_records.length).toBe(
      1
    );

    const enqueuedUrgentRecord =
      result.billing_system_integration_log.enqueued_records[0];
    expect(enqueuedUrgentRecord.violation_id).toBe('vio-001');
    expect(enqueuedUrgentRecord.urgency_level).toBe(5);
    expect(enqueuedUrgentRecord.processing_priority).toBe('highest');
    expect(enqueuedUrgentRecord.enqueued_at).toBe('2024-01-15T11:00:00Z');

    // 8. 請求システム連携タイムスタンプが検証完了タイムスタンプと同じ（遅延なし）
    expect(result.billing_system_integration_log.integration_timestamp).toBe(
      result.execution_timestamp
    );

    // 9. ドキュメント反映ステータスが 'queued' である
    expect(topPriorityItem.reflection_status).toBe('queued');

    // 10. 全体の検証メタデータが正確である
    expect(result.dataset_records_count).toBe(3);
    expect(result.execution_timestamp).toBe('2024-01-15T11:00:00Z');
  });
});