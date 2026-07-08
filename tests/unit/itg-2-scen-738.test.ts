import { recordModificationHistory } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  // SCEN-738: [normal] 修正履歴自動記録・検索機能 - 査定員が金額を修正したとき修正内容・修正理由・学習データ・判定ロジックが全て記録される
  test('修正履歴に修正内容・修正理由・学習データ・判定ロジックが完全に記録される', () => {
    // Setup: 修正前の初期情報
    const beforeAmount = 5000000;
    const beforeDate = new Date('2024-01-15T10:30:00Z');
    
    // Setup: 修正後の情報
    const afterAmount = 5200000;
    const modificationReason = '市場相場の変動を反映';
    const modificationDate = new Date('2024-01-15T11:45:00Z');
    const modificationUserId = 'assessor_001';
    const assessmentItemId = 'item_12345';
    
    // Setup: 修正時に使用された学習データ
    const learningDataUsed = {
      pastCaseCount: 24,
      priceBookVersion: 'pb_2024_01',
      regionCode: 'region_tokyo',
      workTypeCode: 'work_type_foundation',
      seasonCode: 'season_winter_2024'
    };
    
    // Setup: 修正時に適用された判定ロジック
    const appliedLogic = {
      logicId: 'logic_market_comparison_v2',
      algorithmName: 'market_deviation_analysis',
      deviationThreshold: 0.15,
      correctionFactor: 1.04,
      logicVersion: '2.1.0',
      appliedRules: [
        'seasonal_adjustment_applied',
        'regional_premium_applied',
        'historical_trend_correction_applied'
      ]
    };
    
    // Execute: 修正履歴를 기록
    const recordResult = recordModificationHistory({
      assessmentItemId,
      beforeAmount,
      beforeDate,
      afterAmount,
      modificationDate,
      modificationUserId,
      modificationReason,
      learningDataUsed,
      appliedLogic
    });
    
    // Assert: 修正履歴が正常に記録されたことを確認
    expect(recordResult.success).toBe(true);
    expect(recordResult.historyId).toBeDefined();
    
    // Assert: 修正内容が完全に記録されている
    expect(recordResult.modificationContent).toEqual({
      assessmentItemId,
      beforeAmount: 5000000,
      afterAmount: 5200000,
      modificationDate: new Date('2024-01-15T11:45:00Z'),
      modificationUserId: 'assessor_001',
      amountChangeAbsolute: 200000,
      amountChangePercentage: 0.04
    });
    
    // Assert: 修正理由が完全に保存されている
    expect(recordResult.modificationReason).toBe('市場相場の変動を反映');
    
    // Assert: 学習データが完全に記録されている
    expect(recordResult.learningDataApplied).toEqual({
      pastCaseCount: 24,
      priceBookVersion: 'pb_2024_01',
      regionCode: 'region_tokyo',
      workTypeCode: 'work_type_foundation',
      seasonCode: 'season_winter_2024'
    });
    
    // Assert: 判定ロジックが完全に記録されている
    expect(recordResult.appliedLogicDetail).toEqual({
      logicId: 'logic_market_comparison_v2',
      algorithmName: 'market_deviation_analysis',
      deviationThreshold: 0.15,
      correctionFactor: 1.04,
      logicVersion: '2.1.0',
      appliedRules: [
        'seasonal_adjustment_applied',
        'regional_premium_applied',
        'historical_trend_correction_applied'
      ]
    });
    
    // Assert: 修正履歴が検索可能（全4項目が検索対象）
    expect(recordResult.searchableFields).toEqual({
      modificationContent: true,
      modificationReason: true,
      learningData: true,
      appliedLogic: true
    });
    
    // Assert: 履歴詳細表示時の統合情報が正確に構成されている
    expect(recordResult.detailedDisplay).toEqual({
      historyId: recordResult.historyId,
      assessmentItemId: 'item_12345',
      modification: {
        before: 5000000,
        after: 5200000,
        changeAbsolute: 200000,
        changePercentage: 0.04,
        timestamp: new Date('2024-01-15T11:45:00Z'),
        performer: 'assessor_001'
      },
      reason: '市場相場の変動を反映',
      learningDataContext: {
        pastCaseCount: 24,
        priceBookVersion: 'pb_2024_01',
        region: 'region_tokyo',
        workType: 'work_type_foundation',
        season: 'season_winter_2024'
      },
      logicContext: {
        logicId: 'logic_market_comparison_v2',
        algorithm: 'market_deviation_analysis',
        thresholds: {
          deviation: 0.15,
          correction: 1.04
        },
        version: '2.1.0',
        appliedRules: [
          'seasonal_adjustment_applied',
          'regional_premium_applied',
          'historical_trend_correction_applied'
        ]
      }
    });
    
    // Assert: 一覧表示時の要約情報が正確に構成されている
    expect(recordResult.summaryDisplay).toEqual({
      historyId: recordResult.historyId,
      itemId: 'item_12345',
      amountChange: '5,000,000 → 5,200,000 (+200,000)',
      changePercentage: '+4.0%',
      reason: '市場相場の変動を反映',
      timestamp: new Date('2024-01-15T11:45:00Z'),
      performer: 'assessor_001',
      dataSourceCount: 24
    });
    
    // Assert: 修正履歴のレコード構造が完全性チェックに合格する
    expect(recordResult.validationStatus).toEqual({
      modificationContentComplete: true,
      modificationReasonComplete: true,
      learningDataComplete: true,
      appliedLogicComplete: true,
      allFieldsPresent: true
    });
  });
});