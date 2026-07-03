import { validateContractChangeConsistency } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-855: [edge] 契約変更前後の整合性検証機能 - 変更前後の契約期間が重複する境界ケースで整合性が正確に判定される
  test('SCEN-855: 契約変更前後の整合性検証 - 同一日付重複と1日重複の境界ケース', () => {
    // テストケース1: 変更前契約（開始日：2024/01/01、終了日：2024/12/31）
    //              変更後契約（開始日：2024/12/31、終了日：2025/12/31）
    // 期待：同一日付で重複（2024/12/31が共通）
    const previousContract1 = {
      contract_id: 'C001',
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-12-31T00:00:00Z'),
    };

    const changedContract1 = {
      contract_id: 'C001',
      start_date: new Date('2024-12-31T00:00:00Z'),
      end_date: new Date('2025-12-31T00:00:00Z'),
    };

    const result1 = validateContractChangeConsistency(previousContract1, changedContract1);

    expect(result1.is_overlap).toBe(true);
    expect(result1.overlap_days).toBe(1);
    expect(result1.overlap_start_date).toEqual(new Date('2024-12-31T00:00:00Z'));
    expect(result1.overlap_end_date).toEqual(new Date('2024-12-31T00:00:00Z'));
    expect(result1.is_continuous).toBe(true);
    expect(result1.has_error).toBe(false);

    // テストケース2: 変更前契約（開始日：2024/01/01、終了日：2024/12/31）
    //              変更後契約（開始日：2024/12/30、終了日：2025/12/31）
    // 期待：1日重複（2024/12/30 と 2024/12/31）
    const previousContract2 = {
      contract_id: 'C002',
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-12-31T00:00:00Z'),
    };

    const changedContract2 = {
      contract_id: 'C002',
      start_date: new Date('2024-12-30T00:00:00Z'),
      end_date: new Date('2025-12-31T00:00:00Z'),
    };

    const result2 = validateContractChangeConsistency(previousContract2, changedContract2);

    expect(result2.is_overlap).toBe(true);
    expect(result2.overlap_days).toBe(2);
    expect(result2.overlap_start_date).toEqual(new Date('2024-12-30T00:00:00Z'));
    expect(result2.overlap_end_date).toEqual(new Date('2024-12-31T00:00:00Z'));
    expect(result2.is_continuous).toBe(false);
    expect(result2.has_error).toBe(false);

    // テストケース3: 重複がないケース（変更前終了日と変更後開始日が異なる）
    //              変更前契約（開始日：2024/01/01、終了日：2024/12/30）
    //              変更後契約（開始日：2024/12/31、終了日：2025/12/31）
    // 期待：重複なし、ギャップあり
    const previousContract3 = {
      contract_id: 'C003',
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-12-30T00:00:00Z'),
    };

    const changedContract3 = {
      contract_id: 'C003',
      start_date: new Date('2024-12-31T00:00:00Z'),
      end_date: new Date('2025-12-31T00:00:00Z'),
    };

    const result3 = validateContractChangeConsistency(previousContract3, changedContract3);

    expect(result3.is_overlap).toBe(false);
    expect(result3.overlap_days).toBe(0);
    expect(result3.is_continuous).toBe(false);
    expect(result3.has_error).toBe(false);
    expect(result3.gap_days).toBe(1);

    // テストケース4: 完全に連続するケース（変更前終了日の翌日が変更後開始日）
    //              変更前契約（開始日：2024/01/01、終了日：2024/12/31）
    //              変更後契約（開始日：2025/01/01、終了日：2025/12/31）
    // 期待：重複なし、ギャップなし、連続フラグ=true
    const previousContract4 = {
      contract_id: 'C004',
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-12-31T00:00:00Z'),
    };

    const changedContract4 = {
      contract_id: 'C004',
      start_date: new Date('2025-01-01T00:00:00Z'),
      end_date: new Date('2025-12-31T00:00:00Z'),
    };

    const result4 = validateContractChangeConsistency(previousContract4, changedContract4);

    expect(result4.is_overlap).toBe(false);
    expect(result4.overlap_days).toBe(0);
    expect(result4.is_continuous).toBe(true);
    expect(result4.has_error).toBe(false);
    expect(result4.gap_days).toBe(0);

    // テストケース5: エラーケース - 無効な日付（開始日 > 終了日）
    const invalidContract = {
      contract_id: 'C005',
      start_date: new Date('2024-12-31T00:00:00Z'),
      end_date: new Date('2024-01-01T00:00:00Z'),
    };

    expect(() => {
      validateContractChangeConsistency(previousContract1, invalidContract);
    }).toThrow(/日付範囲/);

    // テストケース6: 複数日間の重複ケース
    //              変更前契約（開始日：2024/01/01、終了日：2024/12/31）
    //              変更後契約（開始日：2024/12/15、終了日：2025/12/31）
    // 期待：17日間の重複（12/15〜12/31）
    const previousContract6 = {
      contract_id: 'C006',
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-12-31T00:00:00Z'),
    };

    const changedContract6 = {
      contract_id: 'C006',
      start_date: new Date('2024-12-15T00:00:00Z'),
      end_date: new Date('2025-12-31T00:00:00Z'),
    };

    const result6 = validateContractChangeConsistency(previousContract6, changedContract6);

    expect(result6.is_overlap).toBe(true);
    expect(result6.overlap_days).toBe(17);
    expect(result6.overlap_start_date).toEqual(new Date('2024-12-15T00:00:00Z'));
    expect(result6.overlap_end_date).toEqual(new Date('2024-12-31T00:00:00Z'));
    expect(result6.is_continuous).toBe(false);
    expect(result6.has_error).toBe(false);
  });
});