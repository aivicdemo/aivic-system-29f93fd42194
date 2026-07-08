import { assignVerificationPriority } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  test('SCEN-833: 許容閾値が未設定の場合、検証優先度の付与に失敗し例外が発生する', () => {
    const deviation_item = {
      item_id: 'ITEM001',
      deviation_rate: 15.5,
      deviation_amount: 25000,
      reference_data_count: 12,
    };

    const tolerance_threshold = {
      lower_limit: undefined,
      upper_limit: undefined,
    };

    expect(() =>
      assignVerificationPriority(deviation_item, tolerance_threshold)
    ).toThrow(/許容閾値/);
  });
});