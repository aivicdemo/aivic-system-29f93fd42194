import { markDeprecatedDocuments } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 旧版資料の自動廃棄マーキング', () => {
  test('SCEN-790: 有効期限と新バージョンリリース日が同日の場合、廃棄マーク処理が正確に実行される', async () => {
    // Arrange: テストデータの準備
    const test_date = '2024-06-15';
    const old_document_id = 'doc-old-001';
    const new_document_id = 'doc-new-001';
    const customer_id = 'cust-123';
    const document_type = '提案資料';

    const old_document_record = {
      document_id: old_document_id,
      customer_id: customer_id,
      document_type: document_type,
      version: 1,
      valid_until_date: test_date,
      is_deprecated: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    const new_document_record = {
      document_id: new_document_id,
      customer_id: customer_id,
      document_type: document_type,
      version: 2,
      release_date: test_date,
      is_deprecated: false,
      created_at: '2024-06-15T00:00:00Z',
      updated_at: '2024-06-15T00:00:00Z'
    };

    // Act: 自動廃棄マーキング機能を実行
    const result = await markDeprecatedDocuments({
      old_documents: [old_document_record],
      new_documents: [new_document_record],
      execution_date: test_date
    });

    // Assert: 廃棄マーク処理の実行結果を検証
    expect(result.marked_count).toBe(1);
    expect(result.marked_documents).toHaveLength(1);
    expect(result.marked_documents[0].document_id).toBe(old_document_id);
    expect(result.marked_documents[0].is_deprecated).toBe(true);

    // Assert: 処理ログに廃棄マーク完了イベントが記録されていることを検証
    expect(result.execution_logs).toHaveLength(1);
    expect(result.execution_logs[0].event_type).toBe('DEPRECATED_MARKED');
    expect(result.execution_logs[0].document_id).toBe(old_document_id);
    expect(result.execution_logs[0].old_version).toBe(1);
    expect(result.execution_logs[0].new_version).toBe(2);
    expect(result.execution_logs[0].reason).toBe('同日リリース - 旧版自動廃棄');
    expect(result.execution_logs[0].executed_at).toBe(test_date);

    // Assert: 廃棄マーク処理が重複実行されていないことを検証
    expect(result.duplicate_execution_detected).toBe(false);
    expect(result.total_execution_count).toBe(1);

    // Assert: 新バージョンリリース日以降の旧版資料が正しくマーク済みであることを検証
    expect(result.marked_documents[0].updated_at).toBe(test_date);
    expect(result.marked_documents[0].deprecated_at).toBe(test_date);
    expect(result.valid_until_date_check).toBe(true);
    expect(result.release_date_check).toBe(true);
    expect(result.sync_date_detected).toBe(true);
  });
});