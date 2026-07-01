import { describe, test, expect } from '@jest/globals';
import { validateReportDataAgainstSource } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1198
  test('レポート数値とソースデータ照合機能 - 許容誤差範囲内の数値差分は一致判定される', () => {
    // ソースデータから計算した基準値
    const sourceDataValue = 1000.0;
    
    // 許容誤差範囲内（±0.1%）の下限値を含むレポート数値
    // 1000 * (1 - 0.001) = 999
    const reportValueAtLowerBound = 999.0;
    
    // 許容誤差範囲内（±0.1%）の上限値を含むレポート数値
    // 1000 * (1 + 0.001) = 1001
    const reportValueAtUpperBound = 1001.0;
    
    // 許容誤差範囲内の中間値
    // 1000 * 1.0005 = 1000.5
    const reportValueInRange = 1000.5;
    
    // 下限値境界での差分検証
    const resultAtLowerBound = validateReportDataAgainstSource(
      sourceDataValue,
      reportValueAtLowerBound,
      0.001
    );
    expect(resultAtLowerBound.status).toBe('一致');
    expect(resultAtLowerBound.differencePercentage).toBe(-0.1);
    expect(resultAtLowerBound.isWithinTolerance).toBe(true);
    expect(resultAtLowerBound.hasError).toBe(false);
    
    // 上限値境界での差分検証
    const resultAtUpperBound = validateReportDataAgainstSource(
      sourceDataValue,
      reportValueAtUpperBound,
      0.001
    );
    expect(resultAtUpperBound.status).toBe('一致');
    expect(resultAtUpperBound.differencePercentage).toBe(0.1);
    expect(resultAtUpperBound.isWithinTolerance).toBe(true);
    expect(resultAtUpperBound.hasError).toBe(false);
    
    // 中間値での差分検証
    const resultInRange = validateReportDataAgainstSource(
      sourceDataValue,
      reportValueInRange,
      0.001
    );
    expect(resultInRange.status).toBe('一致');
    expect(resultInRange.differencePercentage).toBe(0.05);
    expect(resultInRange.isWithinTolerance).toBe(true);
    expect(resultInRange.hasError).toBe(false);
    
    // 許容誤差範囲外（超過）での差分検証
    // 1000 * 1.002 = 1002 は ±0.1% を超過
    const reportValueOutOfRange = 1002.0;
    const resultOutOfRange = validateReportDataAgainstSource(
      sourceDataValue,
      reportValueOutOfRange,
      0.001
    );
    expect(resultOutOfRange.status).toBe('不一致');
    expect(resultOutOfRange.differencePercentage).toBe(0.2);
    expect(resultOutOfRange.isWithinTolerance).toBe(false);
    expect(resultOutOfRange.hasError).toBe(true);
    
    // ソースデータ値がゼロの場合の処理
    const zeroSourceResult = validateReportDataAgainstSource(
      0,
      0,
      0.001
    );
    expect(zeroSourceResult.status).toBe('一致');
    expect(zeroSourceResult.isWithinTolerance).toBe(true);
    expect(zeroSourceResult.hasError).toBe(false);
  });
});