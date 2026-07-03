import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateAndCreateMonthlySummaryTemplateVersion } from '../../src/logic/it-1-br-1781935279444-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('Monthly Summary Template Version Management', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-917: [error] 標準手順書バージョン管理機能 - 新バージョン作成時に前バージョンとの差分情報が不完全である場合、エラーを返す
  test('should return 400 error when creating new version with incomplete difference information', () => {
    // Arrange: 前バージョン（v1.0）の情報を設定
    const previousVersion = {
      version_id: 'tmpl_v_001',
      version_number: '1.0',
      template_name: '月次営業成果レポート',
      created_at: '2024-01-01T09:00:00Z',
      created_by: 'user_001',
    };

    // 新バージョン作成フォーム入力: 差分情報が不完全（変更内容と変更理由は入力、変更箇所は空白）
    const newVersionInput = {
      previous_version_id: previousVersion.version_id,
      change_description: '請求対象項目の集計ロジック修正', // ✅ 入力あり
      change_reason: 'システム要件の変更対応', // ✅ 入力あり
      change_items: '', // ❌ 変更箇所が空白
      modified_by: 'user_002',
    };

    // Act & Assert: エラーをスロー
    expect(() =>
      validateAndCreateMonthlySummaryTemplateVersion(previousVersion, newVersionInput)
    ).toThrow(/変更箇所/);
  });

  // 境界値テスト: 変更内容が空白の場合
  test('should return error when change description is empty', () => {
    const previousVersion = {
      version_id: 'tmpl_v_001',
      version_number: '1.0',
      template_name: '月次営業成果レポート',
      created_at: '2024-01-01T09:00:00Z',
      created_by: 'user_001',
    };

    const newVersionInput = {
      previous_version_id: previousVersion.version_id,
      change_description: '', // ❌ 空白
      change_reason: 'システム要件の変更対応',
      change_items: '集計ロジック,レポート形式',
      modified_by: 'user_002',
    };

    expect(() =>
      validateAndCreateMonthlySummaryTemplateVersion(previousVersion, newVersionInput)
    ).toThrow(/変更内容/);
  });

  // 境界値テスト: 変更理由が空白の場合
  test('should return error when change reason is empty', () => {
    const previousVersion = {
      version_id: 'tmpl_v_001',
      version_number: '1.0',
      template_name: '月次営業成果レポート',
      created_at: '2024-01-01T09:00:00Z',
      created_by: 'user_001',
    };

    const newVersionInput = {
      previous_version_id: previousVersion.version_id,
      change_description: '請求対象項目の集計ロジック修正',
      change_reason: '', // ❌ 空白
      change_items: '集計ロジック,レポート形式',
      modified_by: 'user_002',
    };

    expect(() =>
      validateAndCreateMonthlySummaryTemplateVersion(previousVersion, newVersionInput)
    ).toThrow(/変更理由/);
  });

  // 成功テスト: すべての差分情報が完全に入力された場合
  test('should successfully create new version when all difference information is complete', () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        version_id: 'tmpl_v_002',
        version_number: '1.1',
        template_name: '月次営業成果レポート',
        previous_version_id: 'tmpl_v_001',
        change_description: '請求対象項目の集計ロジック修正',
        change_reason: 'システム要件の変更対応',
        change_items: '集計ロジック,レポート形式',
        created_at: '2024-02-01T10:00:00Z',
        created_by: 'user_002',
        status: 'active',
      }),
      { status: 200 }
    );

    const previousVersion = {
      version_id: 'tmpl_v_001',
      version_number: '1.0',
      template_name: '月次営業成果レポート',
      created_at: '2024-01-01T09:00:00Z',
      created_by: 'user_001',
    };

    const newVersionInput = {
      previous_version_id: previousVersion.version_id,
      change_description: '請求対象項目の集計ロジック修正',
      change_reason: 'システム要件の変更対応',
      change_items: '集計ロジック,レポート形式',
      modified_by: 'user_002',
    };

    const result = validateAndCreateMonthlySummaryTemplateVersion(
      previousVersion,
      newVersionInput
    );

    expect(result).toEqual(
      expect.objectContaining({
        version_id: 'tmpl_v_002',
        version_number: '1.1',
        status: 'active',
      })
    );
  });

  // 複合エラーテスト: 変更内容と変更箇所が両方空白
  test('should return error when multiple difference fields are empty', () => {
    const previousVersion = {
      version_id: 'tmpl_v_001',
      version_number: '1.0',
      template_name: '月次営業成果レポート',
      created_at: '2024-01-01T09:00:00Z',
      created_by: 'user_001',
    };

    const newVersionInput = {
      previous_version_id: previousVersion.version_id,
      change_description: '', // ❌ 空白
      change_reason: 'システム要件の変更対応',
      change_items: '', // ❌ 空白
      modified_by: 'user_002',
    };

    expect(() =>
      validateAndCreateMonthlySummaryTemplateVersion(previousVersion, newVersionInput)
    ).toThrow(/変更内容|変更箇所/);
  });
});