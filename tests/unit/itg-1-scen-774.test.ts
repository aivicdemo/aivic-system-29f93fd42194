import { describe, test, expect, beforeEach } from "@jest/globals";

describe("営業データ項目のメタデータ管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-774
  test("顧客IDと案件IDに該当する資料が存在しない場合、空の結果を返す", async () => {
    const { findApplicableMaterials } = await import(
      "../../src/logic/it-1781935279444-1-1-1"
    );

    const nonExistentCustomerId = "CUST-999999";
    const nonExistentProjectId = "PROJ-999999";

    const result = await findApplicableMaterials({
      customerId: nonExistentCustomerId,
      projectId: nonExistentProjectId,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    expect(result).toEqual([]);
  });
});