import { determineLatestContractVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-1061: 同一日時に複数バージョンが作成された場合、バージョン番号順で最新版が判定される", () => {
    // Arrange: 同一の作成日時を持つ複数の契約書バージョンを準備
    const commonTimestamp = new Date("2024-01-15T10:30:00Z");
    
    const contractVersions = [
      {
        version_number: "v1.0",
        created_at: commonTimestamp,
        contract_id: "CONTRACT_001",
        file_path: "/contracts/v1.0/contract.pdf",
        status: "archived"
      },
      {
        version_number: "v1.1",
        created_at: commonTimestamp,
        contract_id: "CONTRACT_001",
        file_path: "/contracts/v1.1/contract.pdf",
        status: "archived"
      },
      {
        version_number: "v1.2",
        created_at: commonTimestamp,
        contract_id: "CONTRACT_001",
        file_path: "/contracts/v1.2/contract.pdf",
        status: "archived"
      },
      {
        version_number: "v2.0",
        created_at: commonTimestamp,
        contract_id: "CONTRACT_001",
        file_path: "/contracts/v2.0/contract.pdf",
        status: "active"
      }
    ];

    // Act: バージョン自動判定機能を実行
    const latestVersion = determineLatestContractVersion(contractVersions);

    // Assert: 戻り値のバージョン番号が最大値（v2.0）であることを確認
    expect(latestVersion.version_number).toBe("v2.0");
    
    // タイムスタンプが入力データと一致していることを確認
    expect(latestVersion.created_at).toEqual(commonTimestamp);
    
    // その他のメタデータが正確に返されていることを確認
    expect(latestVersion.contract_id).toBe("CONTRACT_001");
    expect(latestVersion.file_path).toBe("/contracts/v2.0/contract.pdf");
    expect(latestVersion.status).toBe("active");

    // 複数回実行して結果の一貫性を検証
    const secondCallResult = determineLatestContractVersion(contractVersions);
    expect(secondCallResult.version_number).toBe("v2.0");
    expect(secondCallResult.created_at).toEqual(commonTimestamp);
    expect(secondCallResult.file_path).toBe("/contracts/v2.0/contract.pdf");

    const thirdCallResult = determineLatestContractVersion(contractVersions);
    expect(thirdCallResult.version_number).toBe("v2.0");
    expect(thirdCallResult.contract_id).toBe("CONTRACT_001");
  });
});