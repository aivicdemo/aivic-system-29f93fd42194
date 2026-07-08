import { measureOCRAccuracyForOtherDepartmentFormat } from "../../src/logic/it-6-2-1-1";

describe("他部署フォーマットOCR読取精度測定機能", () => {
  test("SCEN-1361: 見積書サンプルが空の場合に精度測定が実行されず例外を返す", () => {
    const estimateFileSamples: string[] = [];

    expect(() => {
      measureOCRAccuracyForOtherDepartmentFormat({
        estimateFileSamples,
      });
    }).toThrow(/見積書サンプル/);
  });
});