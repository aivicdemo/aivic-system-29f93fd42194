import { detectAnomaliesAndMissingData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ異常値・漏れデータ自動検出機能', () => {
  // SCEN-653
  test('すべての必須項目が正常に入力された営業データセットを処理した場合、検出結果が空で返される', () => {
    const validSalesData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      amount: 150000,
      transactionDate: '2024-01-15',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'Premium',
      description: '正常な営業活動データ',
      status: 'completed',
    };

    const result = detectAnomaliesAndMissingData(validSalesData);

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('複数の必須項目が欠落しているデータセットを処理した場合、欠落項目が検出される', () => {
    const incompleteSalesData = {
      customerId: 'CUST-001',
      amount: 150000,
      transactionDate: '2024-01-15',
    };

    const result = detectAnomaliesAndMissingData(incompleteSalesData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((error: any) => error.field === 'customerName')).toBe(true);
    expect(result.some((error: any) => error.field === 'managerId')).toBe(true);
  });

  test('金額が負の数値の場合、異常値として検出される', () => {
    const invalidAmountData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      amount: -50000,
      transactionDate: '2024-01-15',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'Premium',
      description: '金額が不正なデータ',
      status: 'completed',
    };

    const result = detectAnomaliesAndMissingData(invalidAmountData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((error: any) => error.field === 'amount')).toBe(true);
  });

  test('日付形式が無効な場合、異常値として検出される', () => {
    const invalidDateData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      amount: 150000,
      transactionDate: '2024-13-45',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'Premium',
      description: '日付が不正なデータ',
      status: 'completed',
    };

    const result = detectAnomaliesAndMissingData(invalidDateData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((error: any) => error.field === 'transactionDate')).toBe(true);
  });

  test('契約数がアポイント数を超えている場合、矛盾として検出される', () => {
    const contradictoryData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      amount: 150000,
      transactionDate: '2024-01-15',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 2,
      contractCount: 5,
      serviceType: 'Premium',
      description: '契約数がアポ数を超えるデータ',
      status: 'completed',
    };

    const result = detectAnomaliesAndMissingData(contradictoryData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((error: any) => error.type === 'inconsistency')).toBe(true);
  });

  test('顧客名が空文字列の場合、欠落として検出される', () => {
    const emptyCustomerNameData = {
      customerId: 'CUST-001',
      customerName: '',
      amount: 150000,
      transactionDate: '2024-01-15',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'Premium',
      description: '顧客名が空のデータ',
      status: 'completed',
    };

    const result = detectAnomaliesAndMissingData(emptyCustomerNameData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.some((error: any) => error.field === 'customerName')).toBe(true);
  });

  test('金額が0の場合、許容範囲内として検出されない', () => {
    const zeroAmountData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      amount: 0,
      transactionDate: '2024-01-15',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 0,
      contractCount: 0,
      serviceType: 'Premium',
      description: '金額がゼロのデータ',
      status: 'completed',
    };

    const result = detectAnomaliesAndMissingData(zeroAmountData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.some((error: any) => error.field === 'amount' && error.type === 'outOfRange')).toBe(false);
  });

  test('アポイント数と契約数が両方0の場合、矛盾なく検出されない', () => {
    const zeroCountsData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      amount: 0,
      transactionDate: '2024-01-15',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 0,
      contractCount: 0,
      serviceType: 'Premium',
      description: 'カウントが両方ゼロのデータ',
      status: 'completed',
    };

    const result = detectAnomaliesAndMissingData(zeroCountsData);

    expect(result.some((error: any) => error.type === 'inconsistency')).toBe(false);
  });

  test('ステータスが無効な値の場合、異常値として検出される', () => {
    const invalidStatusData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      amount: 150000,
      transactionDate: '2024-01-15',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'Premium',
      description: 'ステータスが不正なデータ',
      status: 'invalid_status',
    };

    const result = detectAnomaliesAndMissingData(invalidStatusData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.some((error: any) => error.field === 'status')).toBe(true);
  });

  test('金額が指定範囲の上限を超えている場合、異常値として検出される', () => {
    const excessiveAmountData = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      amount: 100000000,
      transactionDate: '2024-01-15',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'Premium',
      description: '金額が異常に大きいデータ',
      status: 'completed',
    };

    const result = detectAnomaliesAndMissingData(excessiveAmountData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.some((error: any) => error.field === 'amount' && error.type === 'outOfRange')).toBe(true);
  });

  test('複数の異常値が存在する場合、すべて検出される', () => {
    const multipleAnomaliesData = {
      customerId: 'CUST-001',
      customerName: '',
      amount: -50000,
      transactionDate: '2024-13-45',
      managerId: 'MGR-001',
      managerName: '営業太郎',
      appointmentCount: 2,
      contractCount: 5,
      serviceType: 'Premium',
      description: '複数の異常を含むデータ',
      status: 'invalid_status',
    };

    const result = detectAnomaliesAndMissingData(multipleAnomaliesData);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.some((error: any) => error.field === 'customerName')).toBe(true);
    expect(result.some((error: any) => error.field === 'amount')).toBe(true);
    expect(result.some((error: any) => error.field === 'transactionDate')).toBe(true);
    expect(result.some((error: any) => error.field === 'status')).toBe(true);
  });
});