import { calculateRequirementPriorityScore } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - 要件優先度スコア算出機能", () => {
  // SCEN-1368
  test("評価軸データが不足している場合、スコア算出がエラーとなり不足項目が明示される", () => {
    // 準備: 必須評価軸（ビジネス影響度、実装難易度、戦略適合性）のうち、ビジネス影響度と戦略適合性を欠落させたテストデータ
    const incompleteRequirementData = {
      requirementId: "REQ-001",
      name: "営業データ標準化仕様書の定義",
      implementationDifficulty: 3,
      // businessImpact は欠落
      // strategicAlignment は欠落
      description: "CRMベンダーとの連携を標準化"
    };

    // 実行: スコア算出メソッドを呼び出す
    let thrownError: any;
    try {
      calculateRequirementPriorityScore(incompleteRequirementData);
    } catch (error) {
      thrownError = error;
    }

    // 検証: エラーが発生すること
    expect(thrownError).toBeDefined();

    // 検証: (1) エラータイプが『ValidationError』であること
    expect(thrownError.type).toBe("ValidationError");

    // 検証: (2) エラーメッセージに『評価軸データが不足しています』と表示されること
    expect(thrownError.message).toMatch(/評価軸データが不足しています/);

    // 検証: (3) 不足している評価軸項目が配列形式で明示されること
    expect(Array.isArray(thrownError.missingFields)).toBe(true);
    expect(thrownError.missingFields).toContain("ビジネス影響度");
    expect(thrownError.missingFields).toContain("戦略適合性");
    expect(thrownError.missingFields.length).toBe(2);

    // 検証: (4) スコア値がnullまたはundefinedであること
    expect(thrownError.score === null || thrownError.score === undefined).toBe(true);
  });
});