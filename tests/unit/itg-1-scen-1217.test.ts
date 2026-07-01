import { detectDataDiscrepancies } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1217: [edge] データ不一致自動判定機能 - 複数の不一致原因が同時に存在する場合、優先度に基づいて主要原因が判定される
  test('複数の不一致原因が同時に存在する場合、優先度に基づいて主要原因が判定される', () => {
    // テストパターン1: 金額差異（優先度1）+ 日付ずれ（優先度2）+ 顧客情報相違（優先度3）が同時に存在
    const discrepancyData_pattern1 = {
      amount_difference: 50000,
      date_mismatch_days: 5,
      customer_info_mismatch: true,
      contract_id: 'C001',
      period: '2024-01',
    };

    const result_pattern1 = detectDataDiscrepancies(discrepancyData_pattern1);

    expect(result_pattern1.primary_cause).toBe('金額差異');
    expect(result_pattern1.primary_cause_priority).toBe(1);
    expect(result_pattern1.secondary_causes).toEqual([
      { cause: '日付ずれ', priority: 2 },
      { cause: '顧客情報相違', priority: 3 },
    ]);
    expect(result_pattern1.all_discrepancies_detected).toBe(3);

    // テストパターン2: 日付ずれ（優先度2）+ 顧客情報相違（優先度3）のみ（金額差異なし）
    const discrepancyData_pattern2 = {
      amount_difference: 0,
      date_mismatch_days: 7,
      customer_info_mismatch: true,
      contract_id: 'C002',
      period: '2024-02',
    };

    const result_pattern2 = detectDataDiscrepancies(discrepancyData_pattern2);

    expect(result_pattern2.primary_cause).toBe('日付ずれ');
    expect(result_pattern2.primary_cause_priority).toBe(2);
    expect(result_pattern2.secondary_causes).toEqual([
      { cause: '顧客情報相違', priority: 3 },
    ]);
    expect(result_pattern2.all_discrepancies_detected).toBe(2);

    // テストパターン3: 金額差異（優先度1）+ 顧客情報相違（優先度3）のみ（日付ずれなし）
    const discrepancyData_pattern3 = {
      amount_difference: 25000,
      date_mismatch_days: 0,
      customer_info_mismatch: true,
      contract_id: 'C003',
      period: '2024-03',
    };

    const result_pattern3 = detectDataDiscrepancies(discrepancyData_pattern3);

    expect(result_pattern3.primary_cause).toBe('金額差異');
    expect(result_pattern3.primary_cause_priority).toBe(1);
    expect(result_pattern3.secondary_causes).toEqual([
      { cause: '顧客情報相違', priority: 3 },
    ]);
    expect(result_pattern3.all_discrepancies_detected).toBe(2);

    // テストパターン4: 顧客情報相違（優先度3）のみ
    const discrepancyData_pattern4 = {
      amount_difference: 0,
      date_mismatch_days: 0,
      customer_info_mismatch: true,
      contract_id: 'C004',
      period: '2024-04',
    };

    const result_pattern4 = detectDataDiscrepancies(discrepancyData_pattern4);

    expect(result_pattern4.primary_cause).toBe('顧客情報相違');
    expect(result_pattern4.primary_cause_priority).toBe(3);
    expect(result_pattern4.secondary_causes).toEqual([]);
    expect(result_pattern4.all_discrepancies_detected).toBe(1);

    // テストパターン5: 複数の金額差異ケース - 差異が大きい場合
    const discrepancyData_pattern5 = {
      amount_difference: 150000,
      date_mismatch_days: 3,
      customer_info_mismatch: true,
      contract_id: 'C005',
      period: '2024-05',
    };

    const result_pattern5 = detectDataDiscrepancies(discrepancyData_pattern5);

    expect(result_pattern5.primary_cause).toBe('金額差異');
    expect(result_pattern5.primary_cause_priority).toBe(1);
    expect(result_pattern5.secondary_causes).toEqual([
      { cause: '日付ずれ', priority: 2 },
      { cause: '顧客情報相違', priority: 3 },
    ]);
    expect(result_pattern5.all_discrepancies_detected).toBe(3);
    expect(result_pattern5.amount_difference_value).toBe(150000);

    // テストパターン6: 不一致が存在しないケース
    const discrepancyData_pattern6 = {
      amount_difference: 0,
      date_mismatch_days: 0,
      customer_info_mismatch: false,
      contract_id: 'C006',
      period: '2024-06',
    };

    const result_pattern6 = detectDataDiscrepancies(discrepancyData_pattern6);

    expect(result_pattern6.primary_cause).toBeNull();
    expect(result_pattern6.secondary_causes).toEqual([]);
    expect(result_pattern6.all_discrepancies_detected).toBe(0);
  });
});