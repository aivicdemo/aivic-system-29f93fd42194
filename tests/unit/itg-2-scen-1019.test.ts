import { recordMultipleDocumentModifications } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1019
  test('複数箇所の修正が同時に記録された場合、修正順序と履歴が正確に保持される', () => {
    const assessor_id = 'assessor_001';
    const document_id = 'doc_20240115_001';
    const modifications = [
      {
        modification_id: 'mod_001',
        section_name: '相場乖離率',
        modification_content: '乖離率を12.5%から15.3%に修正',
        modification_reason: '過去案件データの最新版を反映',
        timestamp: new Date('2024-01-15T10:15:00Z'),
        sequence_order: 1,
      },
      {
        modification_id: 'mod_002',
        section_name: '参照データ件数',
        modification_content: '参照件数を45件から52件に修正',
        modification_reason: '地域別フィルタ条件を厳密化',
        timestamp: new Date('2024-01-15T10:15:02Z'),
        sequence_order: 2,
      },
      {
        modification_id: 'mod_003',
        section_name: '補正係数',
        modification_content: '季節補正係数を1.08から1.12に修正',
        modification_reason: '2024年1月の市場変動を反映',
        timestamp: new Date('2024-01-15T10:15:04Z'),
        sequence_order: 3,
      },
    ];

    const result = recordMultipleDocumentModifications(
      assessor_id,
      document_id,
      modifications
    );

    expect(result.document_id).toBe('doc_20240115_001');
    expect(result.assessor_id).toBe('assessor_001');
    expect(result.total_modifications).toBe(3);
    expect(result.all_modifications_recorded).toBe(true);

    expect(result.modifications_list).toHaveLength(3);

    expect(result.modifications_list[0]).toEqual({
      modification_id: 'mod_001',
      section_name: '相場乖離率',
      modification_content: '乖離率を12.5%から15.3%に修正',
      modification_reason: '過去案件データの最新版を反映',
      timestamp: new Date('2024-01-15T10:15:00Z'),
      sequence_order: 1,
      recorded_at: expect.any(Date),
    });

    expect(result.modifications_list[1]).toEqual({
      modification_id: 'mod_002',
      section_name: '参照データ件数',
      modification_content: '参照件数を45件から52件に修正',
      modification_reason: '地域別フィルタ条件を厳密化',
      timestamp: new Date('2024-01-15T10:15:02Z'),
      sequence_order: 2,
      recorded_at: expect.any(Date),
    });

    expect(result.modifications_list[2]).toEqual({
      modification_id: 'mod_003',
      section_name: '補正係数',
      modification_content: '季節補正係数を1.08から1.12に修正',
      modification_reason: '2024年1月の市場変動を反映',
      timestamp: new Date('2024-01-15T10:15:04Z'),
      sequence_order: 3,
      recorded_at: expect.any(Date),
    });

    expect(result.chronological_order_preserved).toBe(true);

    expect(result.modifications_list[0].timestamp.getTime()).toBeLessThan(
      result.modifications_list[1].timestamp.getTime()
    );
    expect(result.modifications_list[1].timestamp.getTime()).toBeLessThan(
      result.modifications_list[2].timestamp.getTime()
    );

    expect(result.modifications_list.every((m: any) => m.recorded_at)).toBe(
      true
    );

    const detailed_view = result.modifications_list.map((m: any) => ({
      modification_id: m.modification_id,
      section_name: m.section_name,
      modification_content: m.modification_content,
      modification_reason: m.modification_reason,
      timestamp: m.timestamp,
      sequence_order: m.sequence_order,
    }));

    expect(detailed_view).toHaveLength(3);
    expect(detailed_view[0].section_name).toBe('相場乖離率');
    expect(detailed_view[1].section_name).toBe('参照データ件数');
    expect(detailed_view[2].section_name).toBe('補正係数');

    expect(result.history_integrity_verified).toBe(true);
    expect(result.modification_details_complete).toBe(true);
  });
});