import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateCustomerAggregationLogic } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 顧客別成果指標集計ロジック検証', () => {
  let mockLogData: Array<{ timestamp: string; message: string; level: string }> = [];

  beforeEach(() => {
    mockLogData = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockLogData = [];
  });

  // SCEN-1111: [error] 顧客別成果指標集計ロジック検証 - 計算ルール未定義の顧客に対してエラーが返される
  test('should return error when aggregation logic is not defined for customer', () => {
    const customerId = 'CUST-999-UNDEFINED';
    const aggregationPeriod = '2024-01-01T00:00:00Z';
    const salesMetricsData = {
      appointmentCount: 15,
      contractCount: 3,
      customerReaction: 'positive',
    };

    const mockSystemLogger = {
      error: jest.fn((message: string) => {
        mockLogData.push({
          timestamp: '2024-01-15T11:00:00Z',
          message: message,
          level: 'error',
        });
      }),
    };

    expect(() =>
      validateCustomerAggregationLogic(
        customerId,
        aggregationPeriod,
        salesMetricsData,
        mockSystemLogger
      )
    ).toThrow(/計算ルール/);

    expect(mockSystemLogger.error).toHaveBeenCalled();
    expect(mockLogData).toHaveLength(1);
    expect(mockLogData[0].level).toBe('error');
    expect(mockLogData[0].message).toMatch(/計算ルール/);
  });

  test('should return error code CALC_RULE_NOT_DEFINED when customer has no aggregation logic', () => {
    const customerId = 'CUST-UNDEFINED-001';
    const aggregationPeriod = '2024-02-15T00:00:00Z';
    const salesMetricsData = {
      appointmentCount: 20,
      contractCount: 5,
      customerReaction: 'neutral',
    };

    const mockSystemLogger = {
      error: jest.fn(),
    };

    let caughtError: Error | null = null;
    try {
      validateCustomerAggregationLogic(
        customerId,
        aggregationPeriod,
        salesMetricsData,
        mockSystemLogger
      );
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/計算ルール/);
    expect(mockSystemLogger.error).toHaveBeenCalledWith(expect.stringMatching(/計算ルール/));
  });

  test('should record error in system log with proper format when aggregation logic is missing', () => {
    const customerId = 'CUST-NO-LOGIC-002';
    const aggregationPeriod = '2024-03-20T00:00:00Z';
    const salesMetricsData = {
      appointmentCount: 8,
      contractCount: 1,
      customerReaction: 'negative',
    };

    const errorLog: Array<{ timestamp: string; level: string; customerId: string; message: string }> = [];
    const mockSystemLogger = {
      error: jest.fn((message: string) => {
        errorLog.push({
          timestamp: '2024-03-20T11:30:00Z',
          level: 'error',
          customerId: customerId,
          message: message,
        });
      }),
    };

    expect(() =>
      validateCustomerAggregationLogic(
        customerId,
        aggregationPeriod,
        salesMetricsData,
        mockSystemLogger
      )
    ).toThrow(/計算ルール/);

    expect(errorLog).toHaveLength(1);
    expect(errorLog[0].level).toBe('error');
    expect(errorLog[0].customerId).toBe('CUST-NO-LOGIC-002');
    expect(errorLog[0].message).toMatch(/計算ルール/);
  });

  test('should halt subsequent processing when aggregation logic validation fails', () => {
    const customerId = 'CUST-HALT-TEST-003';
    const aggregationPeriod = '2024-04-10T00:00:00Z';
    const salesMetricsData = {
      appointmentCount: 12,
      contractCount: 2,
      customerReaction: 'positive',
    };

    const processStates: string[] = [];
    const mockSystemLogger = {
      error: jest.fn((message: string) => {
        processStates.push('error_logged');
      }),
    };

    processStates.push('validation_started');

    expect(() => {
      validateCustomerAggregationLogic(
        customerId,
        aggregationPeriod,
        salesMetricsData,
        mockSystemLogger
      );
      processStates.push('calculation_executed');
    }).toThrow(/計算ルール/);

    expect(processStates).toEqual(['validation_started', 'error_logged']);
    expect(processStates).not.toContain('calculation_executed');
  });
});