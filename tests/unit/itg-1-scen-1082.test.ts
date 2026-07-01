import { getValidContractVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-1082: 契約書バージョン判定機能 - 有効バージョンが存在しない場合にエラーが返される", async () => {
    // テストデータ: すべてのバージョンが無効状態の契約書
    const contractId = "CONTRACT_001";
    const invalidVersions = [
      {
        contractId: contractId,
        versionId: "V001",
        isDeleted: true,
        deleteDate: "2024-01-10T00:00:00Z",
        expiryDate: null,
        isInvalid: false,
      },
      {
        contractId: contractId,
        versionId: "V002",
        isDeleted: false,
        deleteDate: null,
        expiryDate: "2023-12-31T23:59:59Z",
        isInvalid: false,
      },
      {
        contractId: contractId,
        versionId: "V003",
        isDeleted: false,
        deleteDate: null,
        expiryDate: null,
        isInvalid: true,
      },
    ];

    // mock API レスポンス: 無効なバージョンのみを返す
    const fetchMock = require("jest-fetch-mock");
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    fetchMock.mockResponseOnce(JSON.stringify(invalidVersions), {
      status: 200,
    });

    // エラーが発生することを期待
    try {
      await getValidContractVersion({ contractId });
      fail("エラーが発生するはずです");
    } catch (error: any) {
      // エラーメッセージが『有効なバージョンが存在しない』を示す業務キーワードを含む
      expect(error.message).toMatch(/有効.*バージョン/);

      // エラーコード検証
      expect(error.code).toBe("NO_VALID_VERSION");

      // HTTPステータスコード検証 (400 or 404)
      expect([400, 404]).toContain(error.statusCode);

      // ログ出力の確認 (実装側でログが記録されていることを前提)
      expect(error.logMessage).toMatch(/有効な契約書バージョンが見つかりません/);
    }
  });
});