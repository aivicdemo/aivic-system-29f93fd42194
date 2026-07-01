import { createMonthlyTemplateSummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能', () => {
  // SCEN-932: バージョン管理メタデータが不正な状態で新バージョン作成が試みられた場合、作成が拒否される
  test('バージョン管理メタデータ妥当性検証 - 不正なメタデータで作成拒否', () => {
    // バージョン管理メタデータが不正な入力
    const invalid_metadata_future_date = {
      template_id: 'tmpl_001',
      version_number: 1,
      created_at: '2099-12-31T23:59:59Z', // 未来日に設定（不正）
      created_by: 'user_123',
      is_active: true,
    };

    // 未来日設定でエラーが発生することを検証
    expect(() =>
      createMonthlyTemplateSummary(invalid_metadata_future_date)
    ).toThrow(/バージョン作成日時/);

    // バージョン番号が負の値
    const invalid_metadata_negative_version = {
      template_id: 'tmpl_001',
      version_number: -1, // 負の値（不正）
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'user_123',
      is_active: true,
    };

    // 負のバージョン番号でエラーが発生することを検証
    expect(() =>
      createMonthlyTemplateSummary(invalid_metadata_negative_version)
    ).toThrow(/バージョン番号/);

    // 作成者IDが空文字列
    const invalid_metadata_empty_creator = {
      template_id: 'tmpl_001',
      version_number: 1,
      created_at: '2024-01-15T09:00:00Z',
      created_by: '', // 空文字列（不正）
      is_active: true,
    };

    // 空の作成者IDでエラーが発生することを検証
    expect(() =>
      createMonthlyTemplateSummary(invalid_metadata_empty_creator)
    ).toThrow(/作成者/);

    // 正常なメタデータで作成可能
    const valid_metadata = {
      template_id: 'tmpl_001',
      version_number: 1,
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'user_123',
      is_active: true,
    };

    // 正常なメタデータの場合、結果は作成可能を示す
    const result = createMonthlyTemplateSummary(valid_metadata);
    expect(result).toEqual({
      template_id: 'tmpl_001',
      version_number: 1,
      created_at: '2024-01-15T09:00:00Z',
      created_by: 'user_123',
      is_active: true,
      status: 'created',
    });
  });
});