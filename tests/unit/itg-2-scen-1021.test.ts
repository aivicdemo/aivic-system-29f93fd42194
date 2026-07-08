import { recordExplanationMaterialRevision } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1021: 説明資料の修正内容の記録・追跡 - 修正前後のテキスト長が0文字の場合でも履歴が記録される', () => {
    const user_id = 'USR-00123';
    const user_name = '査定員太郎';
    const material_id = 'MAT-20250115-001';
    const revision_timestamp_before = '2025-01-15T10:30:00Z';
    const revision_timestamp_after = '2025-01-15T10:35:00Z';
    const material_content_before = '';
    const material_content_after = '';
    const material_length_before = 0;
    const material_length_after = 0;
    const revision_reason = '空文字列のまま確認';
    const session_id = 'SESSION-12345';

    const input_revision_record = {
      material_id: material_id,
      user_id: user_id,
      user_name: user_name,
      content_before: material_content_before,
      content_after: material_content_after,
      length_before: material_length_before,
      length_after: material_length_after,
      revision_reason: revision_reason,
      timestamp_before: revision_timestamp_before,
      timestamp_after: revision_timestamp_after,
      session_id: session_id,
    };

    const result = recordExplanationMaterialRevision(input_revision_record);

    expect(result).toEqual({
      is_recorded: true,
      revision_id: expect.any(String),
      material_id: material_id,
      user_id: user_id,
      user_name: user_name,
      length_before: 0,
      length_after: 0,
      content_before_text: '',
      content_after_text: '',
      revision_reason: revision_reason,
      is_content_changed: false,
      timestamp_recorded: expect.any(String),
      is_traceable: true,
      audit_trail_status: '記録完了',
    });

    expect(result.is_recorded).toBe(true);
    expect(result.length_before).toBe(0);
    expect(result.length_after).toBe(0);
    expect(result.content_before_text).toBe('');
    expect(result.content_after_text).toBe('');
    expect(result.is_content_changed).toBe(false);
    expect(result.is_traceable).toBe(true);
    expect(result.audit_trail_status).toBe('記録完了');
    expect(result.revision_id).toMatch(/^REV-/);
  });
});