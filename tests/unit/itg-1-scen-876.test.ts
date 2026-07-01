import { generateContractChangeValidationReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-876: [edge] 契約変更検証レポート自動生成機能 - 複数の契約変更がある場合にすべての変更内容が漏れなくレポートに含まれる
  test('複数の契約変更がすべてレポートに漏れなく含まれ、時系列で正確にソートされていること', () => {
    const contractId = 'CTR-001';
    const initialContractData = {
      contract_id: contractId,
      contract_amount: 1000000,
      contract_start_date: '2024-01-01T00:00:00Z',
      contract_end_date: '2024-12-31T23:59:59Z',
      billing_cycle: 'monthly',
    };

    const contractChanges = [
      {
        change_id: 'CHG-001',
        contract_id: contractId,
        change_type: 'amount',
        change_timestamp: '2024-02-15T10:30:00Z',
        changed_by_user_id: 'USR-100',
        change_reason: 'Customer negotiated discount',
        before_value: '1000000',
        after_value: '900000',
      },
      {
        change_id: 'CHG-002',
        contract_id: contractId,
        change_type: 'billing_cycle',
        change_timestamp: '2024-03-20T14:45:00Z',
        changed_by_user_id: 'USR-101',
        change_reason: 'Changed to quarterly billing',
        before_value: 'monthly',
        after_value: 'quarterly',
      },
      {
        change_id: 'CHG-003',
        contract_id: contractId,
        change_type: 'contract_period',
        change_timestamp: '2024-04-10T09:15:00Z',
        changed_by_user_id: 'USR-100',
        change_reason: 'Extended contract period',
        before_value: '2024-12-31T23:59:59Z',
        after_value: '2025-12-31T23:59:59Z',
      },
    ];

    const reportInput = {
      contract_id: contractId,
      initial_contract: initialContractData,
      contract_changes: contractChanges,
      report_generated_at: '2024-04-11T00:00:00Z',
    };

    const report = generateContractChangeValidationReport(reportInput);

    expect(report).toBeDefined();
    expect(report.contract_id).toBe(contractId);
    expect(report.total_changes_count).toBe(3);
    expect(report.changes).toHaveLength(3);

    expect(report.changes[0].change_id).toBe('CHG-001');
    expect(report.changes[0].change_type).toBe('amount');
    expect(report.changes[0].change_timestamp).toBe('2024-02-15T10:30:00Z');
    expect(report.changes[0].changed_by_user_id).toBe('USR-100');
    expect(report.changes[0].before_value).toBe('1000000');
    expect(report.changes[0].after_value).toBe('900000');
    expect(report.changes[0].change_reason).toBe('Customer negotiated discount');

    expect(report.changes[1].change_id).toBe('CHG-002');
    expect(report.changes[1].change_type).toBe('billing_cycle');
    expect(report.changes[1].change_timestamp).toBe('2024-03-20T14:45:00Z');
    expect(report.changes[1].changed_by_user_id).toBe('USR-101');
    expect(report.changes[1].before_value).toBe('monthly');
    expect(report.changes[1].after_value).toBe('quarterly');
    expect(report.changes[1].change_reason).toBe('Changed to quarterly billing');

    expect(report.changes[2].change_id).toBe('CHG-003');
    expect(report.changes[2].change_type).toBe('contract_period');
    expect(report.changes[2].change_timestamp).toBe('2024-04-10T09:15:00Z');
    expect(report.changes[2].changed_by_user_id).toBe('USR-100');
    expect(report.changes[2].before_value).toBe('2024-12-31T23:59:59Z');
    expect(report.changes[2].after_value).toBe('2025-12-31T23:59:59Z');
    expect(report.changes[2].change_reason).toBe('Extended contract period');

    const timestamps = report.changes.map((c) => new Date(c.change_timestamp).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));

    const changeIds = report.changes.map((c) => c.change_id);
    const uniqueChangeIds = new Set(changeIds);
    expect(uniqueChangeIds.size).toBe(3);

    const missingFields = report.changes.filter(
      (c) =>
        !c.change_id ||
        !c.change_type ||
        !c.change_timestamp ||
        c.before_value === undefined ||
        c.after_value === undefined
    );
    expect(missingFields).toHaveLength(0);

    expect(report.validation_status).toBe('all_changes_included');
    expect(report.report_generated_at).toBe('2024-04-11T00:00:00Z');
  });
});