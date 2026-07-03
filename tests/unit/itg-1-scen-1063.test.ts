import { applyDocumentNamingRules } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1063: ドキュメント統一命名規則適用機能 - 規則適用対象のドキュメントが空である場合、適切なエラーが返却される", () => {
    const emptyDocumentList: object[] = [];

    const result = applyDocumentNamingRules(emptyDocumentList);

    expect(result).toHaveProperty("error");
    expect(result.error).toBeDefined();
    expect(result.error).toHaveProperty("code");
    expect(result.error).toHaveProperty("message");
    expect(result.error.message).toMatch(/ドキュメントが存在しません/);
    expect(result.error).toHaveProperty("statusCode");
    expect(result.error.statusCode).toBeGreaterThanOrEqual(400);
    expect(result.error.statusCode).toBeLessThan(500);
  });
});