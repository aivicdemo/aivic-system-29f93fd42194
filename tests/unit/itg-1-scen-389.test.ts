import { recordDefectiveProductDetails } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("不良品情報記録機能 - 不良品詳細情報の必須項目が不足している場合、記録処理がエラーになる", () => {
    // SCEN-389

    // 不良品種別（必須項目）を未入力のまま記録を試行
    expect(() => 
      recordDefectiveProductDetails(100, 5, "", "工程A", "推定原因", "対応措置")
    ).toThrow(/不良種別/);

    // 不良原因（必須項目）を未入力のまま記録を試行
    expect(() => 
      recordDefectiveProductDetails(100, 5, "寸法不良", "工程A", "", "対応措置")
    ).toThrow(/推定原因/);

    // 対応措置（必須項目）を未入力のまま記録を試行
    expect(() => 
      recordDefectiveProductDetails(100, 5, "寸法不良", "工程A", "推定原因", "")
    ).toThrow(/対応措置/);

    // 複数の必須項目が未入力の場合
    expect(() => 
      recordDefectiveProductDetails(100, 5, "", "工程A", "", "")
    ).toThrow(/不良種別/);
  });
});