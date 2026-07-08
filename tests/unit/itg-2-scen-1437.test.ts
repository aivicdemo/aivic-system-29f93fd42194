import { calculateOCRCorrectionSLA } from "../../src/logic/it-6-2-2-2";

describe("読取誤り修正SLA可視化機能", () => {
  test("SCEN-1437: 学習データ補正から本番適用まで各段階の完了時間が自動記録され、SLA達成状況がダッシュボードに反映される", () => {
    // 学習データ補正プロセスの開始時刻
    const data_correction_start_time = new Date("2024-01-15T09:00:00Z");
    // 学習データ補正プロセスの完了時刻
    const data_correction_end_time = new Date("2024-01-15T10:30:00Z");
    // 検証段階の開始時刻
    const validation_start_time = new Date("2024-01-15T10:30:00Z");
    // 検証段階の完了時刻
    const validation_end_time = new Date("2024-01-15T11:45:00Z");
    // 本番適用段階の開始時刻
    const production_deploy_start_time = new Date("2024-01-15T11:45:00Z");
    // 本番適用段階の完了時刻
    const production_deploy_end_time = new Date("2024-01-15T12:00:00Z");

    // SLA基準値（分単位）
    const data_correction_sla_minutes = 120;
    const validation_sla_minutes = 90;
    const production_deploy_sla_minutes = 30;

    // 入力データ
    const sla_correction_input = {
      correction_phase_start: data_correction_start_time,
      correction_phase_end: data_correction_end_time,
      validation_phase_start: validation_start_time,
      validation_phase_end: validation_end_time,
      production_phase_start: production_deploy_start_time,
      production_phase_end: production_deploy_end_time,
      data_correction_sla_minutes: data_correction_sla_minutes,
      validation_sla_minutes: validation_sla_minutes,
      production_sla_minutes: production_deploy_sla_minutes,
    };

    // 関数実行
    const result = calculateOCRCorrectionSLA(sla_correction_input);

    // 各段階の所要時間の検証
    // 学習データ補正: 10:30 - 09:00 = 90分
    const expected_correction_duration_minutes = 90;
    expect(result.correction_phase_duration_minutes).toBe(
      expected_correction_duration_minutes
    );

    // 検証段階: 11:45 - 10:30 = 75分
    const expected_validation_duration_minutes = 75;
    expect(result.validation_phase_duration_minutes).toBe(
      expected_validation_duration_minutes
    );

    // 本番適用: 12:00 - 11:45 = 15分
    const expected_production_duration_minutes = 15;
    expect(result.production_phase_duration_minutes).toBe(
      expected_production_duration_minutes
    );

    // SLA達成判定
    // 学習データ補正: 90分 < 120分 → 達成
    expect(result.correction_phase_sla_achieved).toBe(true);
    // 検証段階: 75分 < 90分 → 達成
    expect(result.validation_phase_sla_achieved).toBe(true);
    // 本番適用: 15分 < 30分 → 達成
    expect(result.production_phase_sla_achieved).toBe(true);

    // ダッシュボード表示用データの構造検証
    expect(result.dashboard_display).toBeDefined();
    expect(result.dashboard_display.correction_phase_elapsed_minutes).toBe(90);
    expect(result.dashboard_display.validation_phase_elapsed_minutes).toBe(75);
    expect(result.dashboard_display.production_phase_elapsed_minutes).toBe(15);

    // SLA比較表示データの検証
    expect(result.dashboard_display.correction_phase_vs_sla).toBe("達成");
    expect(result.dashboard_display.validation_phase_vs_sla).toBe("達成");
    expect(result.dashboard_display.production_phase_vs_sla).toBe("達成");

    // 全体SLA達成状況
    expect(result.overall_sla_achieved).toBe(true);
    expect(result.overall_sla_status).toBe("達成");

    // 開始・完了時刻が正確に記録されていることの検証
    expect(result.recorded_timestamps.correction_start).toEqual(
      data_correction_start_time
    );
    expect(result.recorded_timestamps.correction_end).toEqual(
      data_correction_end_time
    );
    expect(result.recorded_timestamps.validation_start).toEqual(
      validation_start_time
    );
    expect(result.recorded_timestamps.validation_end).toEqual(
      validation_end_time
    );
    expect(result.recorded_timestamps.production_start).toEqual(
      production_deploy_start_time
    );
    expect(result.recorded_timestamps.production_end).toEqual(
      production_deploy_end_time
    );

    // SLA未達成シナリオの検証
    const sla_exceeded_input = {
      correction_phase_start: new Date("2024-01-15T09:00:00Z"),
      correction_phase_end: new Date("2024-01-15T11:30:00Z"), // 150分 > 120分
      validation_phase_start: new Date("2024-01-15T11:30:00Z"),
      validation_phase_end: new Date("2024-01-15T13:15:00Z"), // 105分 > 90分
      production_phase_start: new Date("2024-01-15T13:15:00Z"),
      production_phase_end: new Date("2024-01-15T13:50:00Z"), // 35分 > 30分
      data_correction_sla_minutes: 120,
      validation_sla_minutes: 90,
      production_sla_minutes: 30,
    };

    const result_exceeded = calculateOCRCorrectionSLA(sla_exceeded_input);

    // SLA未達成判定
    expect(result_exceeded.correction_phase_sla_achieved).toBe(false);
    expect(result_exceeded.validation_phase_sla_achieved).toBe(false);
    expect(result_exceeded.production_phase_sla_achieved).toBe(false);

    // ダッシュボード表示が「未達成」で統一される
    expect(result_exceeded.dashboard_display.correction_phase_vs_sla).toBe(
      "未達成"
    );
    expect(result_exceeded.dashboard_display.validation_phase_vs_sla).toBe(
      "未達成"
    );
    expect(result_exceeded.dashboard_display.production_phase_vs_sla).toBe(
      "未達成"
    );

    // 全体SLA達成状況が「未達成」
    expect(result_exceeded.overall_sla_achieved).toBe(false);
    expect(result_exceeded.overall_sla_status).toBe("未達成");

    // 所要時間が正確に計算される
    expect(result_exceeded.correction_phase_duration_minutes).toBe(150);
    expect(result_exceeded.validation_phase_duration_minutes).toBe(105);
    expect(result_exceeded.production_phase_duration_minutes).toBe(35);
  });
});