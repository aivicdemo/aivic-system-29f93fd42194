import { detectContractChangeDiscrepancy } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1268: [error] 契約変更内容と顧客合意状況の照合・例外検出
  test('契約変更内容と顧客の非合意返答が齟齬を起こす場合、例外ルートを判定し適切に検出される', () => {
    // テストデータセット: 契約変更内容
    const contractChangeData = {
      contract_id: 'CTR-2024-001',
      customer_id: 'CUST-A001',
      change_type: 'pricing_plan_change',
      change_content: {
        previous_plan: 'standard',
        new_plan: 'premium',
        effective_date: '2024-02-01',
        price_increase_rate: 1.3,
      },
      initiated_date: '2024-01-20T09:00:00Z',
      initiated_by: 'SALES-REP-001',
    };

    // テストデータセット: 顧客の非合意返答
    const customerResponseData = {
      contract_id: 'CTR-2024-001',
      customer_id: 'CUST-A001',
      response_status: 'rejected',
      response_reason: '価格上昇が経営判断に不適切',
      responded_date: '2024-01-25T14:30:00Z',
      responded_by: 'CUST-MANAGER-001',
    };

    // 照合・例外検出ロジックを実行
    const result = detectContractChangeDiscrepancy({
      contractChange: contractChangeData,
      customerResponse: customerResponseData,
    });

    // 齟齬が検出されることを確認
    expect(result.discrepancy_detected).toBe(true);

    // 検出された例外タイプが正確であることを確認
    expect(result.exception_type).toBe('approval_mismatch');

    // 適切な例外ルート（保留、エスカレーション、承認待ちなど）が判定されていることを確認
    expect(result.exception_route).toBe('escalation');

    // 例外レベルが正確に記録されていることを確認
    expect(result.severity_level).toBe('high');

    // 請求自動化処理スキップフラグが立っていることを確認（true = 処理をスキップ）
    expect(result.skip_billing_automation).toBe(true);

    // 例外ステータスが正確に記録されていることを確認
    expect(result.exception_status).toBe('pending_review');

    // エスカレーション対象フラグが立っていることを確認
    expect(result.requires_escalation).toBe(true);

    // 例外検出のタイムスタンプが記録されていることを確認
    expect(result.detected_timestamp).toBeDefined();
    expect(typeof result.detected_timestamp).toBe('string');

    // 詳細メッセージが適切に生成されていることを確認
    expect(result.detail_message).toMatch(/契約変更/);
    expect(result.detail_message).toMatch(/rejected/);
  });

  // 追加テスト: 保留（pending）返答による齟齬検出
  test('顧客の保留返答により契約変更処理が一時停止される', () => {
    const contractChangeData = {
      contract_id: 'CTR-2024-002',
      customer_id: 'CUST-B002',
      change_type: 'service_addition',
      change_content: {
        added_service: 'premium_support',
        effective_date: '2024-02-15',
        additional_cost: 50000,
      },
      initiated_date: '2024-01-22T10:00:00Z',
      initiated_by: 'SALES-REP-002',
    };

    const customerResponseData = {
      contract_id: 'CTR-2024-002',
      customer_id: 'CUST-B002',
      response_status: 'pending',
      response_reason: '経営層の承認待ち中',
      responded_date: '2024-01-26T16:45:00Z',
      responded_by: 'CUST-MANAGER-002',
    };

    const result = detectContractChangeDiscrepancy({
      contractChange: contractChangeData,
      customerResponse: customerResponseData,
    });

    expect(result.discrepancy_detected).toBe(true);
    expect(result.exception_type).toBe('approval_pending');
    expect(result.exception_route).toBe('hold');
    expect(result.severity_level).toBe('medium');
    expect(result.skip_billing_automation).toBe(true);
    expect(result.exception_status).toBe('on_hold');
    expect(result.requires_escalation).toBe(false);
  });

  // 追加テスト: 異議返答による齟齬検出
  test('顧客の異議返答によりシステムが手動確認フローに移行される', () => {
    const contractChangeData = {
      contract_id: 'CTR-2024-003',
      customer_id: 'CUST-C003',
      change_type: 'term_modification',
      change_content: {
        previous_term_months: 12,
        new_term_months: 24,
        renewal_date: '2025-01-31',
      },
      initiated_date: '2024-01-23T08:30:00Z',
      initiated_by: 'SALES-REP-003',
    };

    const customerResponseData = {
      contract_id: 'CTR-2024-003',
      customer_id: 'CUST-C003',
      response_status: 'objection',
      response_reason: '契約期間延長について異議あり。事前協議が必要',
      responded_date: '2024-01-27T11:20:00Z',
      responded_by: 'CUST-MANAGER-003',
    };

    const result = detectContractChangeDiscrepancy({
      contractChange: contractChangeData,
      customerResponse: customerResponseData,
    });

    expect(result.discrepancy_detected).toBe(true);
    expect(result.exception_type).toBe('objection_raised');
    expect(result.exception_route).toBe('negotiation');
    expect(result.severity_level).toBe('high');
    expect(result.skip_billing_automation).toBe(true);
    expect(result.exception_status).toBe('requires_negotiation');
    expect(result.requires_escalation).toBe(true);
  });

  // 追加テスト: 契約内容と返答の顧客IDが不一致の場合
  test('契約変更と顧客返答の顧客IDが不一致の場合、システムエラーが検出される', () => {
    const contractChangeData = {
      contract_id: 'CTR-2024-004',
      customer_id: 'CUST-D004',
      change_type: 'pricing_plan_change',
      change_content: {
        previous_plan: 'basic',
        new_plan: 'standard',
        effective_date: '2024-02-10',
        price_increase_rate: 1.15,
      },
      initiated_date: '2024-01-24T07:00:00Z',
      initiated_by: 'SALES-REP-004',
    };

    const customerResponseData = {
      contract_id: 'CTR-2024-004',
      customer_id: 'CUST-E005',  // 異なる顧客ID
      response_status: 'approved',
      response_reason: 'サービス品質向上に賛成',
      responded_date: '2024-01-28T09:15:00Z',
      responded_by: 'CUST-MANAGER-004',
    };

    const result = detectContractChangeDiscrepancy({
      contractChange: contractChangeData,
      customerResponse: customerResponseData,
    });

    expect(result.discrepancy_detected).toBe(true);
    expect(result.exception_type).toBe('data_mismatch');
    expect(result.exception_route).toBe('escalation');
    expect(result.severity_level).toBe('critical');
    expect(result.skip_billing_automation).toBe(true);
    expect(result.exception_status).toBe('critical_error');
  });

  // 追加テスト: 成功系 - 顧客が承認した場合
  test('顧客が契約変更を承認した場合、例外は検出されず請求処理が進行される', () => {
    const contractChangeData = {
      contract_id: 'CTR-2024-005',
      customer_id: 'CUST-F005',
      change_type: 'pricing_plan_change',
      change_content: {
        previous_plan: 'standard',
        new_plan: 'premium',
        effective_date: '2024-02-01',
        price_increase_rate: 1.3,
      },
      initiated_date: '2024-01-20T09:00:00Z',
      initiated_by: 'SALES-REP-005',
    };

    const customerResponseData = {
      contract_id: 'CTR-2024-005',
      customer_id: 'CUST-F005',
      response_status: 'approved',
      response_reason: 'プランのアップグレードに同意します',
      responded_date: '2024-01-25T13:00:00Z',
      responded_by: 'CUST-MANAGER-005',
    };

    const result = detectContractChangeDiscrepancy({
      contractChange: contractChangeData,
      customerResponse: customerResponseData,
    });

    expect(result.discrepancy_detected).toBe(false);
    expect(result.exception_type).toBeNull();
    expect(result.exception_route).toBeNull();
    expect(result.severity_level).toBeNull();
    expect(result.skip_billing_automation).toBe(false);
    expect(result.exception_status).toBe('approved');
    expect(result.requires_escalation).toBe(false);
  });
});