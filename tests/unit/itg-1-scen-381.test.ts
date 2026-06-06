import { validateActualQuantityRange } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("計画数量100個に対して実績80個で入力が受け付けられる", () => {
    // SCEN-381
    const result = validateActualQuantityRange(80, 100);
    
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });
});