import { generateExplanationMaterial } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-1012
  test("AI判定結果が存在しない場合にエラーが返却される", () => {
    const assessment_case_id = "CASE-20240115-001";
    const ai_judgment_result = null;

    expect(() =>
      generateExplanationMaterial({
        assessment_case_id,
        ai_judgment_result,
      })
    ).toThrow(/AI判定結果/);
  });
});