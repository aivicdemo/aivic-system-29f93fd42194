import { validateActualQuantityRange } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("計画数量100個に対して実績121個で入力が拒否される", () => {
    // SCEN-382
    expect(() => 
      validateActualQuantityRange(121, 100)
    ).toThrow(/計画数量/);
  });
});