import { determineContractTypeAndVersion } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約書バージョン判定', () => {
  // SCEN-1083
  test('契約書種別が正確に判別され、古いバージョンが自動的に除外される', () => {
    // 基本契約 v1.0 テストデータ
    const baseContractV1 = {
      contractId: 'BASE_001',
      contractName: '基本契約書',
      contractType: '基本契約',
      version: 'v1.0',
      versionNumber: 1.0,
      createdAt: new Date('2024-01-01T09:00:00Z'),
      isActive: true,
    };

    // 基本契約 v2.0 テストデータ
    const baseContractV2 = {
      contractId: 'BASE_001',
      contractName: '基本契約書',
      contractType: '基本契約',
      version: 'v2.0',
      versionNumber: 2.0,
      createdAt: new Date('2024-06-15T10:30:00Z'),
      isActive: true,
    };

    // 個別契約 v1.0 テストデータ
    const individualContractV1 = {
      contractId: 'IND_001',
      contractName: '個別契約書',
      contractType: '個別契約',
      version: 'v1.0',
      versionNumber: 1.0,
      createdAt: new Date('2024-02-10T11:00:00Z'),
      isActive: true,
    };

    // 個別契約 v1.1 テストデータ
    const individualContractV1_1 = {
      contractId: 'IND_001',
      contractName: '個別契約書',
      contractType: '個別契約',
      version: 'v1.1',
      versionNumber: 1.1,
      createdAt: new Date('2024-05-20T14:00:00Z'),
      isActive: true,
    };

    // 変更契約 v1.0 テストデータ
    const amendmentContractV1 = {
      contractId: 'AMD_001',
      contractName: '変更契約書',
      contractType: '変更契約',
      version: 'v1.0',
      versionNumber: 1.0,
      createdAt: new Date('2024-03-05T08:15:00Z'),
      isActive: true,
    };

    // 変更契約 v2.0 テストデータ
    const amendmentContractV2 = {
      contractId: 'AMD_001',
      contractName: '変更契約書',
      contractType: '変更契約',
      version: 'v2.0',
      versionNumber: 2.0,
      createdAt: new Date('2024-07-10T09:45:00Z'),
      isActive: true,
    };

    // 基本契約 v1.0 の種別判定
    const resultBaseV1 = determineContractTypeAndVersion(baseContractV1);
    expect(resultBaseV1.contractType).toBe('基本契約');
    expect(resultBaseV1.version).toBe('v1.0');
    expect(resultBaseV1.versionNumber).toBe(1.0);
    expect(resultBaseV1.isLatestVersion).toBe(false);

    // 基本契約 v2.0 の種別判定 - v1.0 は除外
    const resultBaseV2 = determineContractTypeAndVersion(baseContractV2);
    expect(resultBaseV2.contractType).toBe('基本契約');
    expect(resultBaseV2.version).toBe('v2.0');
    expect(resultBaseV2.versionNumber).toBe(2.0);
    expect(resultBaseV2.isLatestVersion).toBe(true);

    // 個別契約 v1.0 の種別判定
    const resultIndividualV1 = determineContractTypeAndVersion(individualContractV1);
    expect(resultIndividualV1.contractType).toBe('個別契約');
    expect(resultIndividualV1.version).toBe('v1.0');
    expect(resultIndividualV1.versionNumber).toBe(1.0);
    expect(resultIndividualV1.isLatestVersion).toBe(false);

    // 個別契約 v1.1 の種別判定 - v1.0 は除外
    const resultIndividualV1_1 = determineContractTypeAndVersion(individualContractV1_1);
    expect(resultIndividualV1_1.contractType).toBe('個別契約');
    expect(resultIndividualV1_1.version).toBe('v1.1');
    expect(resultIndividualV1_1.versionNumber).toBe(1.1);
    expect(resultIndividualV1_1.isLatestVersion).toBe(true);

    // 変更契約 v1.0 の種別判定
    const resultAmendmentV1 = determineContractTypeAndVersion(amendmentContractV1);
    expect(resultAmendmentV1.contractType).toBe('変更契約');
    expect(resultAmendmentV1.version).toBe('v1.0');
    expect(resultAmendmentV1.versionNumber).toBe(1.0);
    expect(resultAmendmentV1.isLatestVersion).toBe(false);

    // 変更契約 v2.0 の種別判定 - v1.0 は除外
    const resultAmendmentV2 = determineContractTypeAndVersion(amendmentContractV2);
    expect(resultAmendmentV2.contractType).toBe('変更契約');
    expect(resultAmendmentV2.version).toBe('v2.0');
    expect(resultAmendmentV2.versionNumber).toBe(2.0);
    expect(resultAmendmentV2.isLatestVersion).toBe(true);

    // 複数バージョン存在時、最新バージョンのみ有効確認
    const allContractVersions = [
      baseContractV1,
      baseContractV2,
      individualContractV1,
      individualContractV1_1,
      amendmentContractV1,
      amendmentContractV2,
    ];

    const latestVersions = allContractVersions.filter(
      (contract) => determineContractTypeAndVersion(contract).isLatestVersion
    );

    expect(latestVersions).toHaveLength(3);
    expect(latestVersions.map((c) => c.version)).toEqual([
      'v2.0',
      'v1.1',
      'v2.0',
    ]);

    // 古いバージョンが処理対象から外されていることを確認
    const inactiveVersions = allContractVersions.filter(
      (contract) => !determineContractTypeAndVersion(contract).isLatestVersion
    );

    expect(inactiveVersions).toHaveLength(3);
    expect(inactiveVersions.map((c) => c.version)).toEqual([
      'v1.0',
      'v1.0',
      'v1.0',
    ]);

    // 各種別の最新バージョンのみが処理対象として確認
    const baseLatest = latestVersions.find((c) => c.contractType === '基本契約');
    expect(baseLatest?.versionNumber).toBe(2.0);

    const individualLatest = latestVersions.find(
      (c) => c.contractType === '個別契約'
    );
    expect(individualLatest?.versionNumber).toBe(1.1);

    const amendmentLatest = latestVersions.find(
      (c) => c.contractType === '変更契約'
    );
    expect(amendmentLatest?.versionNumber).toBe(2.0);
  });
});