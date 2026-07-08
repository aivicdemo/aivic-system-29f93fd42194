import { recordExplanationMaterialRevision } from '../../src/logic/it-6-2-2-1';

describe('Explanation Material Revision Recording', () => {
  test('SCEN-1020: Error when revision reason is empty or invalid format', () => {
    // Test 1: Empty revision reason
    const emptyReasonInput = {
      material_id: 'MAT-20240115-001',
      revision_content: '相場乖離率を5%から3%に修正しました',
      revision_reason: '',
      revision_timestamp: '2024-01-15T11:30:00Z',
      revised_by: 'ASSESSOR-001'
    };

    expect(() => recordExplanationMaterialRevision(emptyReasonInput))
      .toThrow(/修正理由を入力してください/);

    // Test 2: Only whitespace in revision reason
    const whitespaceOnlyInput = {
      material_id: 'MAT-20240115-002',
      revision_content: '金額の補正係数を1.0から1.05に更新',
      revision_reason: '   ',
      revision_timestamp: '2024-01-15T11:31:00Z',
      revised_by: 'ASSESSOR-002'
    };

    expect(() => recordExplanationMaterialRevision(whitespaceOnlyInput))
      .toThrow(/修正理由を入力してください/);

    // Test 3: Invalid format - control characters only
    const controlCharInput = {
      material_id: 'MAT-20240115-003',
      revision_content: '参照データ件数の表記を修正',
      revision_reason: '\x00\x01\x02',
      revision_timestamp: '2024-01-15T11:32:00Z',
      revised_by: 'ASSESSOR-003'
    };

    expect(() => recordExplanationMaterialRevision(controlCharInput))
      .toThrow(/修正理由の形式が不正です/);

    // Test 4: Invalid format - special characters only
    const specialCharOnlyInput = {
      material_id: 'MAT-20240115-004',
      revision_content: 'グラフの数値を更新',
      revision_reason: '!@#$%^&*()',
      revision_timestamp: '2024-01-15T11:33:00Z',
      revised_by: 'ASSESSOR-004'
    };

    expect(() => recordExplanationMaterialRevision(specialCharOnlyInput))
      .toThrow(/修正理由の形式が不正です/);

    // Test 5: Valid revision reason - should not throw
    const validInput = {
      material_id: 'MAT-20240115-005',
      revision_content: '過去案件データの参照件数を15件から20件に変更',
      revision_reason: 'より正確な相場判定のため、参照データを追加しました',
      revision_timestamp: '2024-01-15T11:34:00Z',
      revised_by: 'ASSESSOR-005'
    };

    const result = recordExplanationMaterialRevision(validInput);

    expect(result).toEqual({
      material_id: 'MAT-20240115-005',
      revision_id: expect.any(String),
      revision_content: '過去案件データの参照件数を15件から20件に変更',
      revision_reason: 'より正確な相場判定のため、参照データを追加しました',
      revision_timestamp: '2024-01-15T11:34:00Z',
      revised_by: 'ASSESSOR-005',
      recorded_at: expect.any(String),
      status: 'recorded'
    });

    expect(result.status).toBe('recorded');
    expect(result.revision_id).toBeDefined();
  });
});