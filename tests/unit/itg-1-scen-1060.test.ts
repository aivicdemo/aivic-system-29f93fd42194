import { determineActiveContractVersion } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約書バージョン自動判定', () => {
  // SCEN-1060: 複数の契約書種別が混在する場合、優先順位ルールに従って現在有効版が正しく判定される
  test('複数の契約書種別が混在する場合、優先順位ルール（変更契約 > 個別契約 > 基本契約）に従って現在有効版が正しく自動判定される', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-09-15T00:00:00Z');

    const contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: customer_id,
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
      {
        contract_id: 'INDIVIDUAL-001',
        customer_id: customer_id,
        contract_type: 'INDIVIDUAL',
        version_number: 1,
        valid_from: new Date('2024-06-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-05-25T14:00:00Z'),
      },
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
    ];

    const result = determineActiveContractVersion(
      customer_id,
      contracts,
      current_date
    );

    // 優先順位ルール（変更契約 > 個別契約 > 基本契約）に基づいて、変更契約が選択されることを検証
    expect(result.contract_id).toBe('AMENDMENT-001');
    expect(result.contract_type).toBe('AMENDMENT');
    expect(result.version_number).toBe(1);
    expect(result.valid_from).toEqual(new Date('2024-09-01T00:00:00Z'));
    expect(result.valid_to).toEqual(new Date('2024-12-31T23:59:59Z'));
    expect(result.created_at).toEqual(new Date('2024-08-28T09:30:00Z'));
    expect(result.is_active).toBe(true);
    expect(result.priority_rank).toBe(1);
  });

  test('同一優先度の場合、最新の作成日時またはバージョン番号が高い契約書が選択される', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-09-15T00:00:00Z');

    const contracts = [
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
      {
        contract_id: 'AMENDMENT-002',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 2,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-30T11:00:00Z'),
      },
    ];

    const result = determineActiveContractVersion(
      customer_id,
      contracts,
      current_date
    );

    // 同一優先度の場合、作成日時が新しいまたはバージョン番号が高い契約書が選択される
    expect(result.contract_id).toBe('AMENDMENT-002');
    expect(result.version_number).toBe(2);
    expect(result.created_at).toEqual(new Date('2024-08-30T11:00:00Z'));
    expect(result.is_active).toBe(true);
  });

  test('有効期間外の契約書は除外され、有効期間内の契約書のみが判定対象となる', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-09-15T00:00:00Z');

    const contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: customer_id,
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-09-10T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
    ];

    const result = determineActiveContractVersion(
      customer_id,
      contracts,
      current_date
    );

    // 基本契約は有効期間外なので除外され、変更契約のみが有効版として判定される
    expect(result.contract_id).toBe('AMENDMENT-001');
    expect(result.contract_type).toBe('AMENDMENT');
    expect(result.is_active).toBe(true);
  });

  test('有効期間が現在の日付と完全に一致する場合でも正しく判定される', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-09-01T00:00:00Z');

    const contracts = [
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
    ];

    const result = determineActiveContractVersion(
      customer_id,
      contracts,
      current_date
    );

    expect(result.contract_id).toBe('AMENDMENT-001');
    expect(result.is_active).toBe(true);
  });

  test('有効期間が現在の日付と終了時刻で一致する場合でも正しく判定される', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-12-31T23:59:59Z');

    const contracts = [
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
    ];

    const result = determineActiveContractVersion(
      customer_id,
      contracts,
      current_date
    );

    expect(result.contract_id).toBe('AMENDMENT-001');
    expect(result.is_active).toBe(true);
  });

  test('有効な契約書が存在しない場合はエラーが発生する', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-10-15T00:00:00Z');

    const contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: customer_id,
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-09-30T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
    ];

    expect(() =>
      determineActiveContractVersion(customer_id, contracts, current_date)
    ).toThrow(/有効な契約書/);
  });

  test('顧客IDが一致しない契約書は除外される', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-09-15T00:00:00Z');

    const contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: 'CUST-002',
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
    ];

    const result = determineActiveContractVersion(
      customer_id,
      contracts,
      current_date
    );

    expect(result.contract_id).toBe('AMENDMENT-001');
    expect(result.customer_id).toBe(customer_id);
  });

  test('判定結果に監査証跡（判定日時、判定根拠、優先度）が正確に記録される', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-09-15T00:00:00Z');

    const contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: customer_id,
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
      {
        contract_id: 'INDIVIDUAL-001',
        customer_id: customer_id,
        contract_type: 'INDIVIDUAL',
        version_number: 1,
        valid_from: new Date('2024-06-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-05-25T14:00:00Z'),
      },
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
    ];

    const result = determineActiveContractVersion(
      customer_id,
      contracts,
      current_date
    );

    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.determination_date).toEqual(current_date);
    expect(result.audit_log.determination_reason).toContain('優先度');
    expect(result.audit_log.eligible_contracts).toHaveLength(3);
    expect(result.priority_rank).toBe(1);
  });

  test('優先順位ルール（変更契約 > 個別契約 > 基本契約）が複数シナリオで正確に動作する', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-09-15T00:00:00Z');

    // シナリオ1: 全種別が有効な場合、変更契約が選択
    const scenario1_contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: customer_id,
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
      {
        contract_id: 'INDIVIDUAL-001',
        customer_id: customer_id,
        contract_type: 'INDIVIDUAL',
        version_number: 1,
        valid_from: new Date('2024-06-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-05-25T14:00:00Z'),
      },
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
    ];

    const result1 = determineActiveContractVersion(
      customer_id,
      scenario1_contracts,
      current_date
    );

    expect(result1.contract_type).toBe('AMENDMENT');
    expect(result1.priority_rank).toBe(1);

    // シナリオ2: 変更契約が無効な場合、個別契約が選択
    const scenario2_contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: customer_id,
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
      {
        contract_id: 'INDIVIDUAL-001',
        customer_id: customer_id,
        contract_type: 'INDIVIDUAL',
        version_number: 1,
        valid_from: new Date('2024-06-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-05-25T14:00:00Z'),
      },
    ];

    const result2 = determineActiveContractVersion(
      customer_id,
      scenario2_contracts,
      current_date
    );

    expect(result2.contract_type).toBe('INDIVIDUAL');
    expect(result2.priority_rank).toBe(2);

    // シナリオ3: 変更契約と個別契約が無効な場合、基本契約が選択
    const scenario3_contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: customer_id,
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
    ];

    const result3 = determineActiveContractVersion(
      customer_id,
      scenario3_contracts,
      current_date
    );

    expect(result3.contract_type).toBe('BASE');
    expect(result3.priority_rank).toBe(3);
  });

  test('複数の有効な契約書がある場合、全て判定対象として記録される', () => {
    const customer_id = 'CUST-001';
    const current_date = new Date('2024-09-15T00:00:00Z');

    const contracts = [
      {
        contract_id: 'BASE-001',
        customer_id: customer_id,
        contract_type: 'BASE',
        version_number: 1,
        valid_from: new Date('2024-01-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2023-12-20T10:00:00Z'),
      },
      {
        contract_id: 'INDIVIDUAL-001',
        customer_id: customer_id,
        contract_type: 'INDIVIDUAL',
        version_number: 1,
        valid_from: new Date('2024-06-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-05-25T14:00:00Z'),
      },
      {
        contract_id: 'AMENDMENT-001',
        customer_id: customer_id,
        contract_type: 'AMENDMENT',
        version_number: 1,
        valid_from: new Date('2024-09-01T00:00:00Z'),
        valid_to: new Date('2024-12-31T23:59:59Z'),
        created_at: new Date('2024-08-28T09:30:00Z'),
      },
    ];

    const result = determineActiveContractVersion(
      customer_id,
      contracts,
      current_date
    );

    expect(result.audit_log.eligible_contracts).toHaveLength(3);
    expect(result.audit_log.eligible_contracts).toContainEqual(
      expect.objectContaining({ contract_id: 'BASE-001' })
    );
    expect(result.audit_log.eligible_contracts).toContainEqual(
      expect.objectContaining({ contract_id: 'INDIVIDUAL-001' })
    );
    expect(result.audit_log.eligible_contracts).toContainEqual(
      expect.objectContaining({ contract_id: 'AMENDMENT-001' })
    );
  });
});