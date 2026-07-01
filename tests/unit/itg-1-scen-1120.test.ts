import { validateAndProcessDocumentImprovement } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質管理・請求自動化システム - ドキュメント改善管理", () => {
  // SCEN-1120
  test("存在しないドキュメントIDで反映処理を実行するとエラーが発生して中止される", () => {
    const nonExistentDocumentId = 99999999;

    expect(() =>
      validateAndProcessDocumentImprovement({
        documentId: nonExistentDocumentId,
        improvementContent: "サンプル改善内容",
        appliedAt: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/ドキュメントID/);
  });
});