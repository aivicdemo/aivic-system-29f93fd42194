import { calculateMonthlyCapacityWithOutlierCorrection } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-954
  test("月次処理能力の算出（外れ値除外・補正） - 外れ値判定の閾値境界値（IQR 1.5倍）で補正対象が正確に決定される", () => {
    // テストデータ: 10件の査定処理時間（分単位）
    const assessmentData = [10, 15, 18, 20, 22, 25, 28, 30, 32, 100];

    // 期待値計算:
    // ソート後: [10, 15, 18, 20, 22, 25, 28, 30, 32, 100]
    // Q1（第1四分位数）= 18（インデックス 2.5 → 18と20の平均 = 19 OR 18）
    // Q3（第3四分位数）= 30（インデックス 7.5 → 30と32の平均 = 31 OR 30）
    // IQR = Q3 - Q1 = 30 - 18 = 12 (より正確には Q1=18.5, Q3=31 の場合 IQR=12.5)
    // 標準的な四分位数計算（8つの方法のうち type 7/Excel方式）:
    // n=10, Q1位置 = (10+1)*0.25 = 2.75 → インデックス 2.75 → data[2] + 0.75*(data[3]-data[2]) = 18 + 0.75*2 = 19.5
    // Q3位置 = (10+1)*0.75 = 8.25 → インデックス 8.25 → data[8] + 0.25*(data[9]-data[8]) = 32 + 0.25*68 = 49
    // IQR = 49 - 19.5 = 29.5
    // 下限閾値 = Q1 - 1.5*IQR = 19.5 - 1.5*29.5 = 19.5 - 44.25 = -24.75
    // 上限閾値 = Q3 + 1.5*IQR = 49 + 1.5*29.5 = 49 + 44.25 = 93.25
    // 外れ値: 100（93.25超過）
    // 補正対象外: [10, 15, 18, 20, 22, 25, 28, 30, 32]
    // 補정対象外の平均 = (10+15+18+20+22+25+28+30+32)/9 = 200/9 ≈ 22.22

    // より単純な実装での四分位数計算を想定（線形補間）:
    // sorted = [10, 15, 18, 20, 22, 25, 28, 30, 32, 100]
    // Q1 = sorted[Math.floor(10*0.25)] = sorted[2] = 18 (or interpolated)
    // Q3 = sorted[Math.floor(10*0.75)] = sorted[7] = 30 (or interpolated)
    // IQR = 30 - 18 = 12
    // 下限 = 18 - 1.5*12 = 18 - 18 = 0
    // 上限 = 30 + 1.5*12 = 30 + 18 = 48
    // 外れ値: 100（48超過）
    // 補정対象外: [10, 15, 18, 20, 22, 25, 28, 30, 32]
    // 平均 = 200/9 ≈ 22.22

    const result = calculateMonthlyCapacityWithOutlierCorrection(assessmentData);

    // 検証 1: 外れ値として 100 が特定される
    expect(result.outliers).toContain(100);
    expect(result.outliers.length).toBe(1);

    // 検証 2: 補正対象外データが保持される（ソート済み）
    expect(result.correctedData).toEqual([10, 15, 18, 20, 22, 25, 28, 30, 32]);
    expect(result.correctedData.length).toBe(9);

    // 検証 3: Q1 の計算確認（下限では補正対象外）
    expect(result.q1).toBe(18);

    // 検証 4: Q3 の計算確認（上限では補正対象外）
    expect(result.q3).toBe(30);

    // 検証 5: IQR の計算確認
    expect(result.iqr).toBe(12);

    // 検証 6: 下限閾値の計算確認
    expect(result.lowerBound).toBe(0);

    // 検証 7: 上限閾値の計算確認
    expect(result.upperBound).toBe(48);

    // 検証 8: 外れ値除外後の平均処理時間（月次処理能力指標）
    const expectedMean = 200 / 9; // ≈ 22.222...
    expect(result.correctedMean).toBeCloseTo(expectedMean, 2);

    // 検証 9: 外れ値除外後の標準偏差
    // correctedData = [10, 15, 18, 20, 22, 25, 28, 30, 32]
    // mean = 22.222...
    // 分散 = ((10-22.22)^2 + (15-22.22)^2 + ... + (32-22.22)^2) / 9
    // = (148.73 + 52.16 + 17.93 + 4.93 + 0.05 + 7.72 + 33.38 + 60.49 + 96.05) / 9
    // ≈ 421.44 / 9 ≈ 46.827
    // 標準偏差 = sqrt(46.827) ≈ 6.84
    expect(result.correctedStdDev).toBeCloseTo(6.84, 1);

    // 検証 10: 外れ値フラグが正しく設定される
    expect(result.hasOutliers).toBe(true);

    // 検証 11: 補正率（外れ値の割合）
    const correctionRate = 1 / 10; // 1個 / 10個
    expect(result.correctionRate).toBeCloseTo(correctionRate, 3);
  });
});