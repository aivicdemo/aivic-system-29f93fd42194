import { identifyLatestVersionByPriority } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 複数バージョン存在時の優先度ベース特定機能', () => {
  // SCEN-786
  test('複数の有効なバージョンから優先度ルールに基づいて唯一の最新版を特定する', () => {
    // === Setup: 複数バージョンのテストデータ準備 ===
    const version_v1_0 = {
      version_id: 'ver_001',
      version_number: '1.0',
      created_at: new Date('2024-01-01T10:00:00Z'),
      updated_at: new Date('2024-01-05T10:00:00Z'),
      priority_flag: false,
      is_active: true,
    };

    const version_v1_1 = {
      version_id: 'ver_002',
      version_number: '1.1',
      created_at: new Date('2024-01-10T10:00:00Z'),
      updated_at: new Date('2024-01-15T10:00:00Z'),
      priority_flag: false,
      is_active: true,
    };

    const version_v2_0 = {
      version_id: 'ver_003',
      version_number: '2.0',
      created_at: new Date('2024-01-20T10:00:00Z'),
      updated_at: new Date('2024-01-25T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    };

    const versions = [version_v1_0, version_v1_1, version_v2_0];

    const priority_rule = {
      order: ['priority_flag', 'updated_at', 'created_at'],
      descending: true,
    };

    // === Test 1: 最初の実行で優先度ルール適用により唯一の最新版を特定 ===
    const latest_version_1st_run = identifyLatestVersionByPriority(
      versions,
      priority_rule
    );

    expect(latest_version_1st_run).toEqual({
      version_id: 'ver_003',
      version_number: '2.0',
      created_at: new Date('2024-01-20T10:00:00Z'),
      updated_at: new Date('2024-01-25T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    });

    // === Test 2: 複数回実行で結果の一貫性を確認 ===
    const latest_version_2nd_run = identifyLatestVersionByPriority(
      versions,
      priority_rule
    );

    expect(latest_version_2nd_run).toEqual({
      version_id: 'ver_003',
      version_number: '2.0',
      created_at: new Date('2024-01-20T10:00:00Z'),
      updated_at: new Date('2024-01-25T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    });

    const latest_version_3rd_run = identifyLatestVersionByPriority(
      versions,
      priority_rule
    );

    expect(latest_version_3rd_run).toEqual({
      version_id: 'ver_003',
      version_number: '2.0',
      created_at: new Date('2024-01-20T10:00:00Z'),
      updated_at: new Date('2024-01-25T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    });

    // === Test 3: 優先度ルール変更後の再特定 ===
    // 優先度フラグを無視し、更新日時のみで判定するルールに変更
    const modified_priority_rule = {
      order: ['updated_at'],
      descending: true,
    };

    const latest_version_modified_rule =
      identifyLatestVersionByPriority(versions, modified_priority_rule);

    // 更新日時が最新のバージョンはver_003のまま（2024-01-25T10:00:00Z）
    expect(latest_version_modified_rule).toEqual({
      version_id: 'ver_003',
      version_number: '2.0',
      created_at: new Date('2024-01-20T10:00:00Z'),
      updated_at: new Date('2024-01-25T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    });

    // === Test 4: さらに優先度ルール変更（created_atで判定） ===
    const alternative_priority_rule = {
      order: ['created_at'],
      descending: true,
    };

    const latest_version_alternative_rule = identifyLatestVersionByPriority(
      versions,
      alternative_priority_rule
    );

    // 作成日時が最新のバージョンはver_003のまま（2024-01-20T10:00:00Z）
    expect(latest_version_alternative_rule).toEqual({
      version_id: 'ver_003',
      version_number: '2.0',
      created_at: new Date('2024-01-20T10:00:00Z'),
      updated_at: new Date('2024-01-25T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    });

    // === Test 5: 新しいバージョン追加後の再特定 ===
    const version_v2_1 = {
      version_id: 'ver_004',
      version_number: '2.1',
      created_at: new Date('2024-02-01T10:00:00Z'),
      updated_at: new Date('2024-02-05T10:00:00Z'),
      priority_flag: false,
      is_active: true,
    };

    const versions_with_new = [
      version_v1_0,
      version_v1_1,
      version_v2_0,
      version_v2_1,
    ];

    const latest_version_with_new_version =
      identifyLatestVersionByPriority(versions_with_new, priority_rule);

    // priority_flag優先度ではver_003がまだ最新（priority_flag: true）
    expect(latest_version_with_new_version).toEqual({
      version_id: 'ver_003',
      version_number: '2.0',
      created_at: new Date('2024-01-20T10:00:00Z'),
      updated_at: new Date('2024-01-25T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    });

    // === Test 6: 新バージョンがpriority_flagを持つ場合 ===
    const version_v2_1_with_priority = {
      version_id: 'ver_004',
      version_number: '2.1',
      created_at: new Date('2024-02-01T10:00:00Z'),
      updated_at: new Date('2024-02-05T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    };

    const versions_all_priority = [
      version_v1_0,
      version_v1_1,
      version_v2_0,
      version_v2_1_with_priority,
    ];

    const latest_version_priority_tie_break =
      identifyLatestVersionByPriority(versions_all_priority, priority_rule);

    // priority_flagで同じため、updated_atで判定 → ver_004（2024-02-05T10:00:00Z）
    expect(latest_version_priority_tie_break).toEqual({
      version_id: 'ver_004',
      version_number: '2.1',
      created_at: new Date('2024-02-01T10:00:00Z'),
      updated_at: new Date('2024-02-05T10:00:00Z'),
      priority_flag: true,
      is_active: true,
    });
  });
});