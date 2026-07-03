import { generateBillingProcedureManual } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1053: 契約情報が存在しない場合、手順書生成が失敗し適切なエラーメッセージが出力される', () => {
    const input = {
      contracts: []
    };

    expect(() => generateBillingProcedureManual(input)).toThrow(/契約情報/);
  });
});