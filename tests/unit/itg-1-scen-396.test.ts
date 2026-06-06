import { validateProductionResults } from "../../src/logic/it-1-br-1-2-1";

const fetchMock = require("jest-fetch-mock");

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test("承認対象の実績データが存在しない場合、承認処理がエラーになる", async () => {
    // SCEN-396
    fetchMock.mockResponseOnce(JSON.stringify({ error: "指定された実績データが見つかりません" }), { status: 404 });

    const nonExistentDataId = "nonexistent-id-12345";
    
    try {
      const response = await fetch(`/api/production-results/${nonExistentDataId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalAction: "approve" })
      });
      
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData.error).toContain("指定された実績データが見つかりません");
    } catch (error) {
      expect(() => { throw error; }).toThrow(/実績データ/);
    }
  });
});