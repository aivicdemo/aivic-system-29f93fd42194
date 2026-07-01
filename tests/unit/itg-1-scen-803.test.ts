import { describe, test, expect, beforeEach } from '@jest/globals';
import { determineDocumentVersionLabel } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 文書バージョン自動判定・表示機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-803
  test('旧版の文書に対して「旧版」ラベルが正しく付与される', () => {
    // 準備: 複数バージョンの文書メタデータを定義
    const current_document_id = 'doc-v2-20240115';
    const current_version_number = 2;
    const current_created_date = new Date('2024-01-15T10:00:00Z');
    const current_is_active = true;

    const legacy_document_id = 'doc-v1-20231201';
    const legacy_version_number = 1;
    const legacy_created_date = new Date('2023-12-01T09:00:00Z');
    const legacy_is_active = false;

    // 実行: 最新版（アクティブ）の文書に対してバージョンラベル判定を実行
    const current_result = determineDocumentVersionLabel({
      document_id: current_document_id,
      version_number: current_version_number,
      created_date: current_created_date,
      is_active: current_is_active
    });

    // 実行: 旧版（非アクティブ）の文書に対してバージョンラベル判定を実行
    const legacy_result = determineDocumentVersionLabel({
      document_id: legacy_document_id,
      version_number: legacy_version_number,
      created_date: legacy_created_date,
      is_active: legacy_is_active
    });

    // 検証: 最新版の文書にはラベルが付与されていないこと
    expect(current_result.has_label).toBe(false);
    expect(current_result.label).toBe('');
    expect(current_result.display_status).toBe('latest');

    // 検証: 旧版の文書に対して「旧版」ラベルが付与されていること
    expect(legacy_result.has_label).toBe(true);
    expect(legacy_result.label).toBe('旧版');
    expect(legacy_result.display_status).toBe('deprecated');

    // 検証: 旧版の文書のメタデータが正確に保持されていること
    expect(legacy_result.document_id).toBe(legacy_document_id);
    expect(legacy_result.version_number).toBe(1);
    expect(legacy_result.is_active).toBe(false);

    // 検証: 複数バージョンが存在する場合、アクティブなもののみが最新版として判定されること
    const multi_version_input = [
      {
        document_id: 'doc-v3-20240120',
        version_number: 3,
        created_date: new Date('2024-01-20T11:00:00Z'),
        is_active: true
      },
      {
        document_id: 'doc-v2-latest-20240115',
        version_number: 2,
        created_date: new Date('2024-01-15T10:00:00Z'),
        is_active: false
      },
      {
        document_id: 'doc-v1-old-20231201',
        version_number: 1,
        created_date: new Date('2023-12-01T09:00:00Z'),
        is_active: false
      }
    ];

    const v3_result = determineDocumentVersionLabel(multi_version_input[0]);
    const v2_result = determineDocumentVersionLabel(multi_version_input[1]);
    const v1_result = determineDocumentVersionLabel(multi_version_input[2]);

    expect(v3_result.display_status).toBe('latest');
    expect(v3_result.has_label).toBe(false);

    expect(v2_result.display_status).toBe('deprecated');
    expect(v2_result.has_label).toBe(true);
    expect(v2_result.label).toBe('旧版');

    expect(v1_result.display_status).toBe('deprecated');
    expect(v1_result.has_label).toBe(true);
    expect(v1_result.label).toBe('旧版');

    // 検証: 一覧画面での表示フォーマットが正確であること
    expect(legacy_result.list_display_format).toBe('[旧版] ' + legacy_document_id);
    expect(current_result.list_display_format).toBe(current_document_id);

    // 検証: 詳細画面での表示フォーマットが正確であること
    expect(legacy_result.detail_display_format).toContain('旧版');
    expect(legacy_result.detail_display_format).toContain(legacy_version_number.toString());
    expect(current_result.detail_display_format).not.toContain('旧版');
  });
});