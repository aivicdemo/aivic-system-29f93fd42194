import { validateActualQuantityRange } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("計画数量100個に対して実績数量0個で入力が正常に受け付けられる", () => {
    // SCEN-383
    const actualQuantity = 0;
    const plannedQuantity = 100;

    const result = validateActualQuantityRange(actualQuantity, plannedQuantity);

    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });
});