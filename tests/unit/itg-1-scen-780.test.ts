import { describe, test, expect, beforeEach } from '@jest/globals';
import { filterDocumentsByEffectiveDateRange } from '../../src/logic/it-1781935279444-1-1-1';

describe('資料検索・フィルタリング機能 - 有効期限の境界値判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-780
  test('有効期限の開始当日・終了当日・終了翌日の境界値でフィルタリング結果が正確に変動する', () => {
    // テスト用資料データ準備
    const material_a = {
      id: 'mat_001',
      name: '資料A',
      effective_start_date: new Date('2024-01-01T00:00:00Z'),
      effective_end_date: new Date('2024-01-31T23:59:59Z'),
    };

    const material_b = {
      id: 'mat_002',
      name: '資料B',
      effective_start_date: new Date('2024-02-01T00:00:00Z'),
      effective_end_date: new Date('2024-02-29T23:59:59Z'),
    };

    const material_c = {
      id: 'mat_003',
      name: '資料C',
      effective_start_date: new Date('2024-03-01T00:00:00Z'),
      effective_end_date: new Date('2024-03-31T23:59:59Z'),
    };

    const all_materials = [material_a, material_b, material_c];

    // ケース1: 開始当日（2024年1月1日）でフィルタリング
    // 期待: 資料Aが含まれる
    const result_start_day = filterDocumentsByEffectiveDateRange(
      all_materials,
      new Date('2024-01-01T00:00:00Z')
    );
    expect(result_start_day).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mat_001',
          name: '資料A',
        }),
      ])
    );
    expect(result_start_day.length).toBe(1);

    // ケース2: 終了当日（2024年1月31日）でフィルタリング
    // 期待: 資料Aが含まれる
    const result_end_day = filterDocumentsByEffectiveDateRange(
      all_materials,
      new Date('2024-01-31T23:59:59Z')
    );
    expect(result_end_day).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mat_001',
          name: '資料A',
        }),
      ])
    );
    expect(result_end_day.length).toBe(1);

    // ケース3: 終了翌日（2024年2月1日）でフィルタリング
    // 期待: 資料Aが含まれない、資料Bが含まれる
    const result_after_end = filterDocumentsByEffectiveDateRange(
      all_materials,
      new Date('2024-02-01T00:00:00Z')
    );
    expect(result_after_end).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mat_001',
        }),
      ])
    );
    expect(result_after_end).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mat_002',
          name: '資料B',
        }),
      ])
    );
    expect(result_after_end.length).toBe(1);

    // ケース4: 資料Bの終了翌日（2024年3月1日）でフィルタリング
    // 期待: 資料Bが含まれない、資料Cが含まれる
    const result_b_after_end = filterDocumentsByEffectiveDateRange(
      all_materials,
      new Date('2024-03-01T00:00:00Z')
    );
    expect(result_b_after_end).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mat_002',
        }),
      ])
    );
    expect(result_b_after_end).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mat_003',
          name: '資料C',
        }),
      ])
    );
    expect(result_b_after_end.length).toBe(1);

    // 境界値判定の正確性確認: 
    // 開始当日: 資料が有効
    expect(
      filterDocumentsByEffectiveDateRange(all_materials, new Date('2024-01-01T00:00:00Z')).some(
        (m) => m.id === 'mat_001'
      )
    ).toBe(true);

    // 終了当日: 資料が有効
    expect(
      filterDocumentsByEffectiveDateRange(all_materials, new Date('2024-01-31T23:59:59Z')).some(
        (m) => m.id === 'mat_001'
      )
    ).toBe(true);

    // 終了翌日: 資料が無効（期限切れ）
    expect(
      filterDocumentsByEffectiveDateRange(all_materials, new Date('2024-02-01T00:00:00Z')).some(
        (m) => m.id === 'mat_001'
      )
    ).toBe(false);
  });
});