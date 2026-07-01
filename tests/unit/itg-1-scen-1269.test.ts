import { matchContractChangeAgreement } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1269: [edge] 契約変更内容と顧客合意状況の照合・例外検出 - 複数の契約変更が並行して登録された場合、各々の合意状況を正確に照合できる
  test('複数の契約変更が並行登録されたとき、各変更の内容と合意状況が正確に個別照合される', () => {
    const contractChange001 = {
      changeId: 'CHANGE-001',
      customerId: 'CUST-A',
      changeType: 'pricing',
      changeContent: 'Basic fee increased to 150000',
      registeredAt: new Date('2024-01-15T10:00:00Z'),
      registeredBy: 'OP-001',
    };

    const contractChange002 = {
      changeId: 'CHANGE-002',
      customerId: 'CUST-A',
      changeType: 'serviceScope',
      changeContent: 'Added premium support service',
      registeredAt: new Date('2024-01-15T10:15:00Z'),
      registeredBy: 'OP-001',
    };

    const contractChange003 = {
      changeId: 'CHANGE-003',
      customerId: 'CUST-A',
      changeType: 'deliveryDate',
      changeContent: 'Delivery date shifted to 2024-03-31',
      registeredAt: new Date('2024-01-15T10:30:00Z'),
      registeredBy: 'OP-001',
    };

    const agreementStatus001 = {
      changeId: 'CHANGE-001',
      status: 'pending',
      statusLabel: '合意待ち',
      respondedAt: null,
      respondedBy: null,
    };

    const agreementStatus002 = {
      changeId: 'CHANGE-002',
      status: 'agreed',
      statusLabel: '合意済み',
      respondedAt: new Date('2024-01-15T11:00:00Z'),
      respondedBy: 'CUST-A-MGR-001',
    };

    const agreementStatus003 = {
      changeId: 'CHANGE-003',
      status: 'rejected',
      statusLabel: '却下',
      respondedAt: new Date('2024-01-15T11:30:00Z'),
      respondedBy: 'CUST-A-MGR-001',
    };

    const changeList = [contractChange001, contractChange002, contractChange003];
    const statusList = [agreementStatus001, agreementStatus002, agreementStatus003];

    const result = matchContractChangeAgreement({
      changes: changeList,
      agreementStatuses: statusList,
      customerId: 'CUST-A',
    });

    expect(result.matchedRecords).toHaveLength(3);

    const matched001 = result.matchedRecords.find((r) => r.changeId === 'CHANGE-001');
    expect(matched001).toBeDefined();
    expect(matched001?.changeContent).toBe('Basic fee increased to 150000');
    expect(matched001?.agreementStatus).toBe('pending');
    expect(matched001?.agreementStatusLabel).toBe('合意待ち');
    expect(matched001?.respondedAt).toBeNull();

    const matched002 = result.matchedRecords.find((r) => r.changeId === 'CHANGE-002');
    expect(matched002).toBeDefined();
    expect(matched002?.changeContent).toBe('Added premium support service');
    expect(matched002?.agreementStatus).toBe('agreed');
    expect(matched002?.agreementStatusLabel).toBe('合意済み');
    expect(matched002?.respondedAt).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(matched002?.respondedBy).toBe('CUST-A-MGR-001');

    const matched003 = result.matchedRecords.find((r) => r.changeId === 'CHANGE-003');
    expect(matched003).toBeDefined();
    expect(matched003?.changeContent).toBe('Delivery date shifted to 2024-03-31');
    expect(matched003?.agreementStatus).toBe('rejected');
    expect(matched003?.agreementStatusLabel).toBe('却下');
    expect(matched003?.respondedAt).toEqual(new Date('2024-01-15T11:30:00Z'));
    expect(matched003?.respondedBy).toBe('CUST-A-MGR-001');

    expect(result.hasDataInconsistency).toBe(false);
    expect(result.mixedAgreementError).toBeNull();
    expect(result.unmatchedChanges).toHaveLength(0);
    expect(result.unmatchedAgreements).toHaveLength(0);

    expect(result.exceptionDetected).toBe(false);
    expect(result.exceptionLog).toHaveLength(0);
  });
});