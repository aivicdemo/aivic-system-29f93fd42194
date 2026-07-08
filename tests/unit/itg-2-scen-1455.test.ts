import { aggregateMonthlyDeviationPatterns } from '../../src/logic/it-1-br-2-2-2-1';

describe('月次相場乖離パターン集計機能 - エラーハンドリング', () => {
  test('SCEN-1455: 入力データが空またはNullの場合、エラーハンドリングで適切にエラーを返す', () => {
    // ケース1: 入力データパラメータがnull
    expect(() => {
      aggregateMonthlyDeviationPatterns(null);
    }).toThrow(/入力データ/);

    // ケース2: 入力データパラメータが空配列
    expect(() => {
      aggregateMonthlyDeviationPatterns([]);
    }).toThrow(/入力データ/);

    // ケース3: 入力データパラメータが空文字列
    expect(() => {
      aggregateMonthlyDeviationPatterns('');
    }).toThrow(/入力データ/);

    // ケース4: 入力データパラメータがundefined
    expect(() => {
      aggregateMonthlyDeviationPatterns(undefined);
    }).toThrow(/入力データ/);
  });
});