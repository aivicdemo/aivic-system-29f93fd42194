import { describe, test, expect, beforeEach } from '@jest/globals';
import { sortContractVersions } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約書バージョン管理', () => {
  // SCEN-843: [edge] 契約書・提案資料のバージョン管理機能 - 同一契約書の複数バージョンが存在するときに版番号の昇順が正しく保たれている
  test('SCEN-843: 同一契約書ID「CONTRACT-2024-001」の複数バージョンが版番号の昇順で正しくソートされる', () => {
    // Arrange: テスト用の契約書バージョンデータを準備
    const contractVersions = [
      {
        contract_id: 'CONTRACT-2024-001',
        version_number: '1.0',
        uploaded_date: '2024-01-01T10:00:00Z',
        file_path: '/contracts/CONTRACT-2024-001/v1.0.pdf',
        is_latest: false,
      },
      {
        contract_id: 'CONTRACT-2024-001',
        version_number: '1.1',
        uploaded_date: '2024-01-05T10:00:00Z',
        file_path: '/contracts/CONTRACT-2024-001/v1.1.pdf',
        is_latest: false,
      },
      {
        contract_id: 'CONTRACT-2024-001',
        version_number: '1.2',
        uploaded_date: '2024-01-10T10:00:00Z',
        file_path: '/contracts/CONTRACT-2024-001/v1.2.pdf',
        is_latest: false,
      },
      {
        contract_id: 'CONTRACT-2024-001',
        version_number: '2.0',
        uploaded_date: '2024-01-20T10:00:00Z',
        file_path: '/contracts/CONTRACT-2024-001/v2.0.pdf',
        is_latest: true,
      },
      {
        contract_id: 'CONTRACT-2024-001',
        version_number: '1.5',
        uploaded_date: '2024-01-15T10:00:00Z',
        file_path: '/contracts/CONTRACT-2024-001/v1.5.pdf',
        is_latest: false,
      },
    ];

    // Act: バージョン一覧を版番号の昇順でソート
    const sorted_versions = sortContractVersions(contractVersions);

    // Assert: 期待結果の検証
    // (1) ソート後のバージョン数が5件であることを確認
    expect(sorted_versions).toHaveLength(5);

    // (2) バージョン番号が昇順（1.0 → 1.1 → 1.2 → 1.5 → 2.0）で正しくソートされていることを確認
    expect(sorted_versions[0].version_number).toBe('1.0');
    expect(sorted_versions[1].version_number).toBe('1.1');
    expect(sorted_versions[2].version_number).toBe('1.2');
    expect(sorted_versions[3].version_number).toBe('1.5');
    expect(sorted_versions[4].version_number).toBe('2.0');

    // (3) 後からアップロードされたバージョン1.5が1.2と2.0の間に正しく挿入されていることを確認
    const index_of_v1_5 = sorted_versions.findIndex(
      (v) => v.version_number === '1.5'
    );
    const index_of_v1_2 = sorted_versions.findIndex(
      (v) => v.version_number === '1.2'
    );
    const index_of_v2_0 = sorted_versions.findIndex(
      (v) => v.version_number === '2.0'
    );
    expect(index_of_v1_5).toBe(index_of_v1_2 + 1);
    expect(index_of_v2_0).toBe(index_of_v1_5 + 1);

    // (4) 最新バージョン（2.0）が一覧の最下部（インデックス4）に表示されていることを確認
    expect(sorted_versions[4].version_number).toBe('2.0');
    expect(sorted_versions[4].is_latest).toBe(true);

    // (5) 全バージョンが同一の契約書IDを保持していることを確認
    sorted_versions.forEach((version) => {
      expect(version.contract_id).toBe('CONTRACT-2024-001');
    });

    // (6) ファイルパスと日付が各バージョンに正しく対応していることを確認
    expect(sorted_versions[0].file_path).toBe(
      '/contracts/CONTRACT-2024-001/v1.0.pdf'
    );
    expect(sorted_versions[4].file_path).toBe(
      '/contracts/CONTRACT-2024-001/v2.0.pdf'
    );
    expect(sorted_versions[0].uploaded_date).toBe('2024-01-01T10:00:00Z');
    expect(sorted_versions[4].uploaded_date).toBe('2024-01-20T10:00:00Z');
  });
});