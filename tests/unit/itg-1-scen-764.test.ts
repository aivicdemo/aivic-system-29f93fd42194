import { determineValidVersion } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-764: 顧客別・案件別の有効版自動判定 - 該当する有効バージョンが存在しない場合にnullが返却される", () => {
    const customer_id = "CUST_999999";
    const project_id = "PROJ_999999";

    const result = determineValidVersion(customer_id, project_id);

    expect(result).toBeNull();
  });
});