import { calculateProcessingTimeReductionRate } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-1305: [error] 処理時間短縮率の自動計算 - 導入前平均処理時間がnullまたはゼロの場合、計算エラーを適切に検出する
  test('処理時間短縮率の自動計算で導入前平均処理時間がnullの場合にエラーを検出', () => {
    const preImplementationAvgTime = null;
    const postImplementationAvgTime = 45.5;

    expect(() =>
      calculateProcessingTimeReductionRate(
        preImplementationAvgTime as any,
        postImplementationAvgTime
      )
    ).toThrow(/導入前平均処理時間/);
  });

  test('処理時間短縮率の自動計算で導入前平均処理時間がゼロの場合にエラーを検出', () => {
    const preImplementationAvgTime = 0;
    const postImplementationAvgTime = 45.5;

    expect(() =>
      calculateProcessingTimeReductionRate(
        preImplementationAvgTime,
        postImplementationAvgTime
      )
    ).toThrow(/ゼロで除算|導入前平均処理時間/);
  });

  test('処理時間短縮率の自動計算で有効な入力値の場合に正常に計算される', () => {
    const preImplementationAvgTime = 120.0;
    const postImplementationAvgTime = 45.5;

    const result = calculateProcessingTimeReductionRate(
      preImplementationAvgTime,
      postImplementationAvgTime
    );

    const expectedReductionRate = ((120.0 - 45.5) / 120.0) * 100;
    expect(result).toBe(expectedReductionRate);
  });

  test('処理時間短縮率の自動計算で導入後平均処理時間がnullの場合にエラーを検出', () => {
    const preImplementationAvgTime = 120.0;
    const postImplementationAvgTime = null;

    expect(() =>
      calculateProcessingTimeReductionRate(
        preImplementationAvgTime,
        postImplementationAvgTime as any
      )
    ).toThrow(/導入後平均処理時間/);
  });

  test('処理時間短縮率の自動計算で導入後平均処理時間がゼロの場合に正常に計算される', () => {
    const preImplementationAvgTime = 120.0;
    const postImplementationAvgTime = 0;

    const result = calculateProcessingTimeReductionRate(
      preImplementationAvgTime,
      postImplementationAvgTime
    );

    const expectedReductionRate = ((120.0 - 0) / 120.0) * 100;
    expect(result).toBe(expectedReductionRate);
  });

  test('処理時間短縮率の自動計算で導入後平均処理時間が導入前より大きい場合に負の短縮率を返す', () => {
    const preImplementationAvgTime = 60.0;
    const postImplementationAvgTime = 90.0;

    const result = calculateProcessingTimeReductionRate(
      preImplementationAvgTime,
      postImplementationAvgTime
    );

    const expectedReductionRate = ((60.0 - 90.0) / 60.0) * 100;
    expect(result).toBe(expectedReductionRate);
    expect(result).toBeLessThan(0);
  });

  test('処理時間短縮率の自動計算で導入前後平均処理時間が同じ場合に0を返す', () => {
    const preImplementationAvgTime = 100.0;
    const postImplementationAvgTime = 100.0;

    const result = calculateProcessingTimeReductionRate(
      preImplementationAvgTime,
      postImplementationAvgTime
    );

    expect(result).toBe(0);
  });

  test('処理時間短縮率の自動計算で小数値を正確に計算する', () => {
    const preImplementationAvgTime = 115.75;
    const postImplementationAvgTime = 50.25;

    const result = calculateProcessingTimeReductionRate(
      preImplementationAvgTime,
      postImplementationAvgTime
    );

    const expectedReductionRate = ((115.75 - 50.25) / 115.75) * 100;
    expect(result).toBeCloseTo(expectedReductionRate, 5);
  });
});