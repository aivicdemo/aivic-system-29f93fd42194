import { evaluateTestResult } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1574: [error] 理解度テスト実施・評価機能 - テスト結果がnullまたは無効値の場合に採点処理がスキップされる
  test('テスト結果がnullまたは無効値の場合に採点処理がスキップされ、エラーハンドリングが正常に機能する', () => {
    // テスト結果がnullの場合
    expect(() => {
      evaluateTestResult({
        test_result: null,
        evaluator_id: 'EVA001',
        test_datetime: new Date('2024-01-15T10:00:00Z')
      });
    }).toThrow(/採点結果/);

    // テスト結果が空文字列の場合
    expect(() => {
      evaluateTestResult({
        test_result: '',
        evaluator_id: 'EVA001',
        test_datetime: new Date('2024-01-15T10:00:00Z')
      });
    }).toThrow(/採点結果/);

    // テスト結果がundefinedの場合
    expect(() => {
      evaluateTestResult({
        test_result: undefined,
        evaluator_id: 'EVA001',
        test_datetime: new Date('2024-01-15T10:00:00Z')
      });
    }).toThrow(/採点結果/);
  });
});