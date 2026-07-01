import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  selectDiscountBasisByPriority,
  type DiscountBasis,
  type DiscountApplicationResult,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理 - 複数割引基準の優先順位選択', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-894: 複数の割引基準が競合する場合、優先順位に基づいて正しい割引基準が選択される
  test('should select discount basis with highest priority when multiple criteria match', () => {
    // テストデータ: 複数の割引基準を優先順位付きで登録
    const discountBasisA: DiscountBasis = {
      id: 'db-a-001',
      name: '割引基準A',
      priority: 1,
      customerId: 'cust-001',
      serviceId: 'svc-001',
      discountRate: 0.1,
      minAmount: 10000,
      maxAmount: 99999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-12-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const discountBasisB: DiscountBasis = {
      id: 'db-b-001',
      name: '割引基準B',
      priority: 2,
      customerId: 'cust-001',
      serviceId: 'svc-001',
      discountRate: 0.15,
      minAmount: 10000,
      maxAmount: 99999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-12-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const discountBasisC: DiscountBasis = {
      id: 'db-c-001',
      name: '割引基準C',
      priority: 3,
      customerId: 'cust-001',
      serviceId: 'svc-001',
      discountRate: 0.2,
      minAmount: 10000,
      maxAmount: 99999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-12-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const matchingBases = [discountBasisA, discountBasisB, discountBasisC];

    const result: DiscountApplicationResult = selectDiscountBasisByPriority(
      matchingBases,
      {
        customerId: 'cust-001',
        serviceId: 'svc-001',
        amount: 50000,
        evaluationDate: new Date('2024-06-15T10:30:00Z'),
      }
    );

    // アサーション: 優先順位1の割引基準A が選択されること
    expect(result.selectedBasisId).toBe('db-a-001');
    expect(result.selectedBasisName).toBe('割引基準A');
    expect(result.appliedPriority).toBe(1);
    expect(result.appliedDiscountRate).toBe(0.1);

    // アサーション: 割引基準Bおよび割引基準Cが適用されていないこと
    expect(result.selectedBasisId).not.toBe('db-b-001');
    expect(result.selectedBasisId).not.toBe('db-c-001');

    // アサーション: ログに選択プロセスが記録されていること
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThanOrEqual(1);
    expect(result.auditLog[0]).toMatchObject({
      action: 'PRIORITY_EVALUATION',
      evaluatedBasisCount: 3,
      selectedBasisId: 'db-a-001',
      timestamp: expect.any(String),
    });

    // アサーション: 適用された金額が正確に計算されること
    const expectedAppliedAmount = 50000 * (1 - 0.1);
    expect(result.appliedAmount).toBe(expectedAppliedAmount);
  });

  test('should handle pattern with priority 2 basis when priority 1 is not applicable', () => {
    const discountBasisA: DiscountBasis = {
      id: 'db-a-002',
      name: '割引基準A_期間限定',
      priority: 1,
      customerId: 'cust-002',
      serviceId: 'svc-002',
      discountRate: 0.12,
      minAmount: 5000,
      maxAmount: 49999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-03-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const discountBasisB: DiscountBasis = {
      id: 'db-b-002',
      name: '割引基準B_通年',
      priority: 2,
      customerId: 'cust-002',
      serviceId: 'svc-002',
      discountRate: 0.08,
      minAmount: 5000,
      maxAmount: 49999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-12-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const matchingBases = [discountBasisA, discountBasisB];

    // 評価日が基準Aの適用期間外であるため、基準Bが選択されるべき
    const result: DiscountApplicationResult = selectDiscountBasisByPriority(
      matchingBases,
      {
        customerId: 'cust-002',
        serviceId: 'svc-002',
        amount: 25000,
        evaluationDate: new Date('2024-06-15T10:30:00Z'),
      }
    );

    expect(result.selectedBasisId).toBe('db-b-002');
    expect(result.selectedBasisName).toBe('割引基準B_通年');
    expect(result.appliedPriority).toBe(2);
    expect(result.appliedDiscountRate).toBe(0.08);

    const expectedAppliedAmount = 25000 * (1 - 0.08);
    expect(result.appliedAmount).toBe(expectedAppliedAmount);

    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.some((log) => log.action === 'PRIORITY_EVALUATION')).toBe(true);
  });

  test('should validate error when no matching basis is applicable', () => {
    const discountBasisA: DiscountBasis = {
      id: 'db-a-003',
      name: '割引基準A_高額',
      priority: 1,
      customerId: 'cust-003',
      serviceId: 'svc-003',
      discountRate: 0.2,
      minAmount: 100000,
      maxAmount: 999999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-12-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const matchingBases = [discountBasisA];

    // 金額が最小金額に満たないため、該当なし
    expect(() =>
      selectDiscountBasisByPriority(matchingBases, {
        customerId: 'cust-003',
        serviceId: 'svc-003',
        amount: 50000,
        evaluationDate: new Date('2024-06-15T10:30:00Z'),
      })
    ).toThrow(/割引基準/);
  });

  test('should preserve audit trail with multiple priority patterns', () => {
    const discountBasisD: DiscountBasis = {
      id: 'db-d-001',
      name: '割引基準D',
      priority: 1,
      customerId: 'cust-004',
      serviceId: 'svc-004',
      discountRate: 0.05,
      minAmount: 1000,
      maxAmount: 999999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-12-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const discountBasisE: DiscountBasis = {
      id: 'db-e-001',
      name: '割引基準E',
      priority: 2,
      customerId: 'cust-004',
      serviceId: 'svc-004',
      discountRate: 0.03,
      minAmount: 1000,
      maxAmount: 999999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-12-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const discountBasisF: DiscountBasis = {
      id: 'db-f-001',
      name: '割引基準F',
      priority: 3,
      customerId: 'cust-004',
      serviceId: 'svc-004',
      discountRate: 0.02,
      minAmount: 1000,
      maxAmount: 999999,
      applicableFrom: new Date('2024-01-01T00:00:00Z'),
      applicableTo: new Date('2024-12-31T23:59:59Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const matchingBases = [discountBasisD, discountBasisE, discountBasisF];

    const result: DiscountApplicationResult = selectDiscountBasisByPriority(
      matchingBases,
      {
        customerId: 'cust-004',
        serviceId: 'svc-004',
        amount: 75000,
        evaluationDate: new Date('2024-06-15T10:30:00Z'),
      }
    );

    expect(result.selectedBasisId).toBe('db-d-001');
    expect(result.appliedPriority).toBe(1);

    // ログには複数基準の評価情報が含まれること
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.length).toBeGreaterThanOrEqual(1);

    const priorityLog = result.auditLog.find((log) => log.action === 'PRIORITY_EVALUATION');
    expect(priorityLog).toBeDefined();
    expect(priorityLog?.evaluatedBasisCount).toBe(3);
    expect(priorityLog?.selectedBasisId).toBe('db-d-001');

    // トレーサビリティ: タイムスタンプが記録されていること
    expect(priorityLog?.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );
  });
});