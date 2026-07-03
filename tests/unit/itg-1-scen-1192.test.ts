import { validateDataConsistency } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1192: [edge] データ不一致の自動判定機能 - 複数の不一致要因が同時に存在する場合、優先度順に判定結果が返される
  test('複数の不一致要因が同時に存在する場合、優先度ルールに従って順序付けられた判定結果が返される', () => {
    const testData = {
      reportedAmount: 150000,
      actualAmount: 120000,
      reportedDate: '2024-01-15',
      actualDate: '2024-01-10',
      reportedCustomerId: 'CUST-001',
      actualCustomerId: 'CUST-002',
      serviceType: 'service-A',
      contractId: 'CONTRACT-123',
    };

    const result = validateDataConsistency(testData);

    expect(result).toBeDefined();
    expect(Array.isArray(result.discrepancies)).toBe(true);
    expect(result.discrepancies.length).toBe(3);

    // 優先度順の確認: 金額不一致 > 日付不一致 > 顧客情報不一致
    expect(result.discrepancies[0].type).toBe('amount_mismatch');
    expect(result.discrepancies[0].priority).toBe(1);
    expect(result.discrepancies[0].details).toEqual({
      reported: 150000,
      actual: 120000,
      difference: 30000,
    });

    expect(result.discrepancies[1].type).toBe('date_mismatch');
    expect(result.discrepancies[1].priority).toBe(2);
    expect(result.discrepancies[1].details).toEqual({
      reported: '2024-01-15',
      actual: '2024-01-10',
    });

    expect(result.discrepancies[2].type).toBe('customer_mismatch');
    expect(result.discrepancies[2].priority).toBe(3);
    expect(result.discrepancies[2].details).toEqual({
      reported: 'CUST-001',
      actual: 'CUST-002',
    });

    // 最初の要素が最も優先度の高い不一致であることを検証
    expect(result.discrepancies[0].priority).toBeLessThan(result.discrepancies[1].priority);
    expect(result.discrepancies[1].priority).toBeLessThan(result.discrepancies[2].priority);

    // 判定結果の判定ステータスが不一致を示していること
    expect(result.isConsistent).toBe(false);
    expect(result.totalDiscrepancies).toBe(3);
    expect(result.highestPriorityDiscrepancy).toEqual(result.discrepancies[0]);
  });
});