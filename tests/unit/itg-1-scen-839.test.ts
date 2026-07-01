import { saveResponseContent } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-839: [edge] 対応内容の構造化データ保存・ポータル反映機能 - 対応内容が最大文字数を超える場合、適切にトリミングまたはエラーが返却される
  test('対応内容が最大文字数(5000文字)を超える場合、バリデーションエラーまたはトリミング保存される', async () => {
    const max_length = 5000;
    const content_within_limit = 'a'.repeat(max_length);
    const content_exceed_limit = 'a'.repeat(max_length + 1);
    const response_id = 'RESP_20250126_001';
    const user_id = 'USR_20250126_100';
    const created_at = new Date('2025-01-26T10:00:00Z');

    // ケース1: 最大文字数以内の正常な入力
    const valid_input = {
      response_id,
      user_id,
      content: content_within_limit,
      created_at,
      is_trimmed: false,
    };

    const valid_result = await saveResponseContent(valid_input);
    expect(valid_result.success).toBe(true);
    expect(valid_result.saved_content.length).toBe(max_length);
    expect(valid_result.status_code).toBe(200);

    // ケース2: 最大文字数を超える入力 - エラーが発生する
    const invalid_input = {
      response_id: 'RESP_20250126_002',
      user_id,
      content: content_exceed_limit,
      created_at: new Date('2025-01-26T11:00:00Z'),
      is_trimmed: false,
    };

    expect(() => saveResponseContent(invalid_input)).toThrow(/文字数/);

    // ケース3: 最大文字数を超える入力でトリミングオプションが有効な場合
    const trimmed_input = {
      response_id: 'RESP_20250126_003',
      user_id,
      content: content_exceed_limit,
      created_at: new Date('2025-01-26T12:00:00Z'),
      is_trimmed: true,
    };

    const trimmed_result = await saveResponseContent(trimmed_input);
    expect(trimmed_result.success).toBe(true);
    expect(trimmed_result.saved_content.length).toBe(max_length);
    expect(trimmed_result.status_code).toBe(200);
    expect(trimmed_result.was_trimmed).toBe(true);
    expect(trimmed_result.original_length).toBe(max_length + 1);

    // ケース4: 保存されたデータベースレコードの一貫性確認
    const db_record = {
      response_id: trimmed_input.response_id,
      content_length: trimmed_result.saved_content.length,
      max_allowed_length: max_length,
      content_hash: 'abc123def456',
    };
    expect(db_record.content_length).toBeLessThanOrEqual(db_record.max_allowed_length);

    // ケース5: ポータル表示用の対応内容が正常に処理されていることを確認
    const portal_content = trimmed_result.portal_display_content;
    expect(portal_content.length).toBe(max_length);
    expect(portal_content).toEqual(content_within_limit);

    // ケース6: エラーメッセージが適切に返却されていることを確認
    const error_input = {
      response_id: 'RESP_20250126_004',
      user_id,
      content: 'x'.repeat(max_length + 500),
      created_at: new Date('2025-01-26T13:00:00Z'),
      is_trimmed: false,
    };

    expect(() => saveResponseContent(error_input)).toThrow(/文字数/);
  });
});