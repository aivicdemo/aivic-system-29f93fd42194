import { getLatestContractVersionBySalesDocId } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-783: 同一顧客・案件に複数バージョンが存在する場合、最新バージョンのみが返される", () => {
    // 同一顧客・案件に対して、異なるバージョンの契約資料を3件事前登録
    const customerId = "CUST-001";
    const opportunityId = "OPP-001";
    const createdAtV1 = new Date("2024-01-10T08:00:00Z");
    const createdAtV1_5 = new Date("2024-01-15T10:30:00Z");
    const createdAtV2 = new Date("2024-01-20T14:00:00Z");

    const inputData = {
      customerId: customerId,
      opportunityId: opportunityId,
      versions: [
        {
          id: "DOC-V1-001",
          versionNumber: "v1.0",
          createdAt: createdAtV1,
          isLatest: false,
          fileName: "contract_v1.0.pdf",
        },
        {
          id: "DOC-V1_5-001",
          versionNumber: "v1.5",
          createdAt: createdAtV1_5,
          isLatest: false,
          fileName: "contract_v1.5.pdf",
        },
        {
          id: "DOC-V2-001",
          versionNumber: "v2.0",
          createdAt: createdAtV2,
          isLatest: true,
          fileName: "contract_v2.0.pdf",
        },
      ],
    };

    // 最新版自動特定機能を実行
    const result = getLatestContractVersionBySalesDocId(inputData);

    // 返却されたレコード件数を検証：1件のみ
    expect(result.length).toBe(1);

    // 返却されたバージョンが最新版（v2.0）であることを検証
    expect(result[0].versionNumber).toBe("v2.0");

    // 返却されたドキュメントIDが正しいことを検証
    expect(result[0].id).toBe("DOC-V2-001");

    // 最新版を示すメタデータが含まれていることを検証
    expect(result[0].isLatest).toBe(true);

    // 作成日時が最も新しいタイムスタンプであることを検証
    expect(result[0].createdAt).toEqual(createdAtV2);

    // ファイル名が正しいことを検証
    expect(result[0].fileName).toBe("contract_v2.0.pdf");

    // 旧バージョン（v1.0、v1.5）が除外されていることを検証
    const versionNumbers = result.map((item) => item.versionNumber);
    expect(versionNumbers).not.toContain("v1.0");
    expect(versionNumbers).not.toContain("v1.5");
  });
});