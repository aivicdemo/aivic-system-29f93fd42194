import { determineLatestDocumentVersion } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  // SCEN-793: [normal] 文書バージョン最新版自動判定機能 - 複数バージョンが存在する契約書から最新版が正しく自動判定される
  test('複数バージョンの中から最新版（v2.0）が正しく自動判定され、最新版以外が除外されること', () => {
    const contract_id = 'CTR-2024-001';
    const versions = [
      {
        version_id: 'VER-001',
        contract_id: contract_id,
        version_number: 'v1.0',
        created_at: '2024-01-05T09:00:00Z',
        updated_at: '2024-01-05T09:00:00Z',
        is_active: false,
      },
      {
        version_id: 'VER-002',
        contract_id: contract_id,
        version_number: 'v1.1',
        created_at: '2024-01-10T10:30:00Z',
        updated_at: '2024-01-10T10:30:00Z',
        is_active: false,
      },
      {
        version_id: 'VER-003',
        contract_id: contract_id,
        version_number: 'v2.0',
        created_at: '2024-01-20T14:15:00Z',
        updated_at: '2024-01-20T14:15:00Z',
        is_active: true,
      },
    ];

    const result = determineLatestDocumentVersion(versions);

    // 最新版として v2.0 が返されること
    expect(result.version_number).toBe('v2.0');
    expect(result.version_id).toBe('VER-003');
    expect(result.contract_id).toBe(contract_id);

    // 最新版のメタデータが正確であること
    expect(result.created_at).toBe('2024-01-20T14:15:00Z');
    expect(result.updated_at).toBe('2024-01-20T14:15:00Z');
    expect(result.is_active).toBe(true);

    // 最新版以外のバージョンが候補から除外されていること
    expect(result.excluded_versions).toHaveLength(2);
    expect(result.excluded_versions).toContainEqual(
      expect.objectContaining({
        version_number: 'v1.0',
        version_id: 'VER-001',
      })
    );
    expect(result.excluded_versions).toContainEqual(
      expect.objectContaining({
        version_number: 'v1.1',
        version_id: 'VER-002',
      })
    );

    // 戻り値に is_latest フラグが含まれていること
    expect(result.is_latest).toBe(true);
  });
});