import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateStaffBillingAccuracyRate } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  it('SCEN-980: 請求額算出・検証機能 - スタッフごとの算出結果が基準値以上の一致率を達成できない場合を検出する', () => {
    // テストデータ準備: 複数スタッフの請求額算出結果
    const staffBillingResults = [
      {
        staffId: 'STAFF-001',
        calculatedAmount: 100000,
        referenceAmount: 100000,
        matchCount: 10,
        totalCount: 10
      },
      {
        staffId: 'STAFF-002',
        calculatedAmount: 95000,
        referenceAmount: 100000,
        matchCount: 6,
        totalCount: 10
      },
      {
        staffId: 'STAFF-003',
        calculatedAmount: 92000,
        referenceAmount: 100000,
        matchCount: 4,
        totalCount: 10
      }
    ];

    const accuracyThreshold = 0.80; // 基準値: 80%

    // 各スタッフの一致率を計算
    const accuracyResults = staffBillingResults.map(staff => ({
      staffId: staff.staffId,
      accuracyRate: staff.matchCount / staff.totalCount,
      threshold: accuracyThreshold,
      isAcceptable: (staff.matchCount / staff.totalCount) >= accuracyThreshold
    }));

    // 基準値以下のスタッフを検出
    const staffWithLowAccuracy = accuracyResults.filter(
      result => result.accuracyRate < accuracyThreshold
    );

    // エラー検出ロジック実行
    const errorDetected = staffWithLowAccuracy.length > 0;

    // 期待結果の検証
    expect(errorDetected).toBe(true);
    expect(staffWithLowAccuracy).toHaveLength(2);
    expect(staffWithLowAccuracy[0]).toEqual({
      staffId: 'STAFF-002',
      accuracyRate: 0.6,
      threshold: 0.8,
      isAcceptable: false
    });
    expect(staffWithLowAccuracy[1]).toEqual({
      staffId: 'STAFF-003',
      accuracyRate: 0.4,
      threshold: 0.8,
      isAcceptable: false
    });

    // エラーメッセージの内容検証
    const errorReport = staffWithLowAccuracy.map(result => ({
      staffId: result.staffId,
      actualAccuracyRate: (result.accuracyRate * 100).toFixed(1),
      expectedThreshold: (result.threshold * 100).toFixed(1),
      differencePercentage: ((result.threshold - result.accuracyRate) * 100).toFixed(1)
    }));

    expect(errorReport).toHaveLength(2);
    expect(errorReport[0].staffId).toBe('STAFF-002');
    expect(errorReport[0].actualAccuracyRate).toBe('60.0');
    expect(errorReport[0].expectedThreshold).toBe('80.0');
    expect(errorReport[0].differencePercentage).toBe('20.0');
    expect(errorReport[1].staffId).toBe('STAFF-003');
    expect(errorReport[1].actualAccuracyRate).toBe('40.0');
    expect(errorReport[1].expectedThreshold).toBe('80.0');
    expect(errorReport[1].differencePercentage).toBe('40.0');

    // calculateStaffBillingAccuracyRate関数の呼び出しと検証
    const result = calculateStaffBillingAccuracyRate(
      staffBillingResults,
      accuracyThreshold
    );

    expect(result.hasInsufficientAccuracy).toBe(true);
    expect(result.staffWithLowAccuracy).toHaveLength(2);
    expect(result.staffWithLowAccuracy[0].staffId).toBe('STAFF-002');
    expect(result.staffWithLowAccuracy[0].accuracyRate).toBe(0.6);
    expect(result.staffWithLowAccuracy[1].staffId).toBe('STAFF-003');
    expect(result.staffWithLowAccuracy[1].accuracyRate).toBe(0.4);
    expect(result.errorMessage).toMatch(/一致率/);
  });
});