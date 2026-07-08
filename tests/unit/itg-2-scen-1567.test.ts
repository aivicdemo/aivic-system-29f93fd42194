import { generateStagedRolloutSchedule } from '../../src/logic/it-6-2-1-1';

describe('段階的展開スケジュール生成機能 - 実績指標エラーハンドリング', () => {
  test('SCEN-1567: 実績指標がnullまたは異常値の場合に計算処理が中断される', () => {
    // =========================================================================
    // テスト前提条件: 段階的展開スケジュール生成機能を初期化
    // =========================================================================
    const validBasePerformanceMetrics = {
      processing_time_reduction_rate: 35.5,
      quality_uniformity_index: 88.2,
      system_uptime_rate: 99.5,
      initial_headcount: 30,
      average_processing_time_minutes: 18.5,
      monthly_assessment_count: 1250,
    };

    const validExpandedScaleMetrics = {
      target_headcount: 700,
      expected_improvement_rate: 0.92,
      data_preparation_months: 3,
    };

    // =========================================================================
    // テスト1: null値を含むデータでの計算処理実行と検証
    // =========================================================================
    const nullValuePerformanceMetrics = {
      processing_time_reduction_rate: null,
      quality_uniformity_index: 88.2,
      system_uptime_rate: 99.5,
      initial_headcount: 30,
      average_processing_time_minutes: 18.5,
      monthly_assessment_count: 1250,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        nullValuePerformanceMetrics as any,
        validExpandedScaleMetrics,
      ),
    ).toThrow(/実績指標/);

    // =========================================================================
    // テスト2: 異常値（負の数値）を含むデータでの計算処理実行と検証
    // =========================================================================
    const negativeValuePerformanceMetrics = {
      processing_time_reduction_rate: -15.5,
      quality_uniformity_index: 88.2,
      system_uptime_rate: 99.5,
      initial_headcount: 30,
      average_processing_time_minutes: 18.5,
      monthly_assessment_count: 1250,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        negativeValuePerformanceMetrics,
        validExpandedScaleMetrics,
      ),
    ).toThrow(/短縮率/);

    // =========================================================================
    // テスト3: 異常値（極端に大きい値）を含むデータでの計算処理実行と検証
    // =========================================================================
    const extremeValuePerformanceMetrics = {
      processing_time_reduction_rate: 350.5,
      quality_uniformity_index: 88.2,
      system_uptime_rate: 99.5,
      initial_headcount: 30,
      average_processing_time_minutes: 18.5,
      monthly_assessment_count: 1250,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        extremeValuePerformanceMetrics,
        validExpandedScaleMetrics,
      ),
    ).toThrow(/短縮率/);

    // =========================================================================
    // テスト4: quality_uniformity_indexがnullの場合
    // =========================================================================
    const nullUniformityMetrics = {
      processing_time_reduction_rate: 35.5,
      quality_uniformity_index: null,
      system_uptime_rate: 99.5,
      initial_headcount: 30,
      average_processing_time_minutes: 18.5,
      monthly_assessment_count: 1250,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        nullUniformityMetrics as any,
        validExpandedScaleMetrics,
      ),
    ).toThrow(/実績指標/);

    // =========================================================================
    // テスト5: system_uptime_rateが100%を超える異常値の場合
    // =========================================================================
    const overtimeUptimeMetrics = {
      processing_time_reduction_rate: 35.5,
      quality_uniformity_index: 88.2,
      system_uptime_rate: 105.0,
      initial_headcount: 30,
      average_processing_time_minutes: 18.5,
      monthly_assessment_count: 1250,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        overtimeUptimeMetrics,
        validExpandedScaleMetrics,
      ),
    ).toThrow(/稼働率/);

    // =========================================================================
    // テスト6: initial_headcountがnullの場合
    // =========================================================================
    const nullHeadcountMetrics = {
      processing_time_reduction_rate: 35.5,
      quality_uniformity_index: 88.2,
      system_uptime_rate: 99.5,
      initial_headcount: null,
      average_processing_time_minutes: 18.5,
      monthly_assessment_count: 1250,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        nullHeadcountMetrics as any,
        validExpandedScaleMetrics,
      ),
    ).toThrow(/実績指標/);

    // =========================================================================
    // テスト7: average_processing_time_minutesが負の値の場合
    // =========================================================================
    const negativeTimeMetrics = {
      processing_time_reduction_rate: 35.5,
      quality_uniformity_index: 88.2,
      system_uptime_rate: 99.5,
      initial_headcount: 30,
      average_processing_time_minutes: -5.5,
      monthly_assessment_count: 1250,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        negativeTimeMetrics,
        validExpandedScaleMetrics,
      ),
    ).toThrow(/処理時間/);

    // =========================================================================
    // テスト8: monthly_assessment_countがnullの場合
    // =========================================================================
    const nullCountMetrics = {
      processing_time_reduction_rate: 35.5,
      quality_uniformity_index: 88.2,
      system_uptime_rate: 99.5,
      initial_headcount: 30,
      average_processing_time_minutes: 18.5,
      monthly_assessment_count: null,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        nullCountMetrics as any,
        validExpandedScaleMetrics,
      ),
    ).toThrow(/実績指標/);

    // =========================================================================
    // テスト9: 拡張スケールメトリクスのexpected_improvement_rateがnullの場合
    // =========================================================================
    const nullImprovementRateMetrics = {
      target_headcount: 700,
      expected_improvement_rate: null,
      data_preparation_months: 3,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        validBasePerformanceMetrics,
        nullImprovementRateMetrics as any,
      ),
    ).toThrow(/改善率/);

    // =========================================================================
    // テスト10: 拡張スケールメトリクスのdata_preparation_monthsが負の値の場合
    // =========================================================================
    const negativeMonthsMetrics = {
      target_headcount: 700,
      expected_improvement_rate: 0.92,
      data_preparation_months: -2,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        validBasePerformanceMetrics,
        negativeMonthsMetrics,
      ),
    ).toThrow(/準備期間/);

    // =========================================================================
    // テスト11: target_headcountが0または負の値の場合
    // =========================================================================
    const zeroTargetHeadcountMetrics = {
      target_headcount: 0,
      expected_improvement_rate: 0.92,
      data_preparation_months: 3,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        validBasePerformanceMetrics,
        zeroTargetHeadcountMetrics,
      ),
    ).toThrow(/対象人数/);

    // =========================================================================
    // テスト12: expected_improvement_rateが1.0を超える場合
    // =========================================================================
    const overImprovementRateMetrics = {
      target_headcount: 700,
      expected_improvement_rate: 1.5,
      data_preparation_months: 3,
    };

    expect(() =>
      generateStagedRolloutSchedule(
        validBasePerformanceMetrics,
        overImprovementRateMetrics,
      ),
    ).toThrow(/改善率/);

    // =========================================================================
    // テスト13: 正常なデータでの成功ケース検証
    // =========================================================================
    const successResult = generateStagedRolloutSchedule(
      validBasePerformanceMetrics,
      validExpandedScaleMetrics,
    );

    expect(successResult).toBeDefined();
    expect(successResult).not.toBeNull();
    expect(typeof successResult).toBe('object');
    expect(successResult.schedule_phases).toBeDefined();
    expect(Array.isArray(successResult.schedule_phases)).toBe(true);
    expect(successResult.schedule_phases.length).toBeGreaterThan(0);

    // =========================================================================
    // テスト14: スケジュール生成完了時のフェーズ構造検証
    // =========================================================================
    const firstPhase = successResult.schedule_phases[0];
    expect(firstPhase).toHaveProperty('phase_number');
    expect(firstPhase).toHaveProperty('target_departments');
    expect(firstPhase).toHaveProperty('implementation_month');
    expect(firstPhase).toHaveProperty('expected_headcount');
    expect(typeof firstPhase.phase_number).toBe('number');
    expect(typeof firstPhase.implementation_month).toBe('number');

    // =========================================================================
    // テスト15: スケジュール全体の一貫性検証
    // =========================================================================
    expect(successResult).toHaveProperty('total_phases');
    expect(typeof successResult.total_phases).toBe('number');
    expect(successResult.total_phases).toEqual(
      successResult.schedule_phases.length,
    );
    expect(successResult).toHaveProperty('total_timeline_months');
    expect(typeof successResult.total_timeline_months).toBe('number');
  });
});