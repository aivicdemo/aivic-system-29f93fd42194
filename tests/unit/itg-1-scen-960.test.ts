import { addExceptionCaseToStandardList } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-960: 過去の請求例外ケースを基準リストに含めて文書化できる', () => {
    // Arrange: 過去の請求例外ケースデータ
    const exceptionCase = {
      caseId: 'EXC-2024-001',
      customerId: 'CUST-A001',
      serviceId: 'SVC-001',
      exceptionType: 'discount_apply',
      description: '売上30万円以上で5%割引を適用',
      applicableCondition: 'monthly_revenue >= 300000',
      discountRate: 0.05,
      appliedDate: '2024-01-15T09:00:00Z',
      createdBy: 'operator_001',
      createdAt: '2024-01-15T09:30:00Z'
    };

    const standardListBefore = {
      listId: 'STD-LIST-001',
      version: 1,
      exceptionCases: [],
      lastUpdated: '2024-01-14T17:00:00Z',
      updatedBy: 'system'
    };

    // Act: 例外ケースを基準リストに追加
    const result = addExceptionCaseToStandardList(exceptionCase, standardListBefore);

    // Assert: 基準リストへの追加完了を検証
    expect(result.exceptionCases).toHaveLength(1);
    expect(result.exceptionCases[0].caseId).toBe('EXC-2024-001');
    expect(result.exceptionCases[0].customerId).toBe('CUST-A001');
    expect(result.exceptionCases[0].serviceId).toBe('SVC-001');
    expect(result.exceptionCases[0].exceptionType).toBe('discount_apply');
    expect(result.exceptionCases[0].description).toBe('売上30万円以上で5%割引を適用');
    expect(result.exceptionCases[0].applicableCondition).toBe('monthly_revenue >= 300000');
    expect(result.exceptionCases[0].discountRate).toBe(0.05);
    expect(result.exceptionCases[0].appliedDate).toBe('2024-01-15T09:00:00Z');
    expect(result.exceptionCases[0].createdBy).toBe('operator_001');
    expect(result.exceptionCases[0].createdAt).toBe('2024-01-15T09:30:00Z');

    // Assert: リストのメタデータが更新されたことを確認
    expect(result.version).toBe(2);
    expect(result.lastUpdated).toBeTruthy();
    expect(result.updatedBy).toBe('system');

    // Assert: 複数の例外ケースを追加するテスト
    const secondExceptionCase = {
      caseId: 'EXC-2024-002',
      customerId: 'CUST-B002',
      serviceId: 'SVC-002',
      exceptionType: 'minimum_charge',
      description: '最小請求額5万円を適用',
      applicableCondition: 'service_type == premium',
      minimumCharge: 50000,
      appliedDate: '2024-01-16T10:00:00Z',
      createdBy: 'operator_002',
      createdAt: '2024-01-16T10:15:00Z'
    };

    const resultWithSecondCase = addExceptionCaseToStandardList(secondExceptionCase, result);

    expect(resultWithSecondCase.exceptionCases).toHaveLength(2);
    expect(resultWithSecondCase.exceptionCases[1].caseId).toBe('EXC-2024-002');
    expect(resultWithSecondCase.exceptionCases[1].exceptionType).toBe('minimum_charge');
    expect(resultWithSecondCase.exceptionCases[1].minimumCharge).toBe(50000);
    expect(resultWithSecondCase.version).toBe(3);

    // Assert: 例外ケースが正常に保存されていることを検証
    expect(resultWithSecondCase.exceptionCases.every(
      (ec: any) => ec.caseId && ec.customerId && ec.serviceId && ec.applicableCondition
    )).toBe(true);

    // Assert: エクスポート対応フォーマット検証
    expect(Array.isArray(resultWithSecondCase.exceptionCases)).toBe(true);
    expect(resultWithSecondCase.exceptionCases.length).toBeGreaterThan(0);

    // Assert: 各例外ケースが参照・適用可能な状態であることを確認
    const firstCase = resultWithSecondCase.exceptionCases[0];
    expect(firstCase.caseId).toBeTruthy();
    expect(firstCase.applicableCondition).toBeTruthy();
    expect(firstCase.exceptionType).toBeTruthy();

    // Assert: 例外ケース追加時のエラーハンドリング
    const invalidExceptionCase = {
      caseId: '',
      customerId: 'CUST-C003',
      serviceId: 'SVC-003',
      exceptionType: 'discount_apply',
      description: 'Invalid case without ID',
      applicableCondition: 'test',
      appliedDate: '2024-01-17T11:00:00Z',
      createdBy: 'operator_003',
      createdAt: '2024-01-17T11:15:00Z'
    };

    expect(() => {
      addExceptionCaseToStandardList(invalidExceptionCase, resultWithSecondCase);
    }).toThrow(/caseId/);

    // Assert: 必須項目チェック
    const incompleteExceptionCase = {
      caseId: 'EXC-2024-003',
      customerId: 'CUST-D004',
      serviceId: '',
      exceptionType: 'discount_apply',
      description: 'Incomplete case',
      applicableCondition: 'test',
      appliedDate: '2024-01-18T12:00:00Z',
      createdBy: 'operator_004',
      createdAt: '2024-01-18T12:15:00Z'
    };

    expect(() => {
      addExceptionCaseToStandardList(incompleteExceptionCase, resultWithSecondCase);
    }).toThrow(/serviceId/);
  });
});