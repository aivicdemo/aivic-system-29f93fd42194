import { calculateBusinessDaysSLA } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1212
  test('問い合わせ受領から回答完了までが営業日ベースで1営業日以内に完了できることを確認', () => {
    // 前提: 問い合わせ受領時刻と回答完了時刻が記録されている状態
    // 発生条件: 問い合わせ受領から回答完了までの経過時間を営業日ベースで計算し、SLA定義の1営業日以内であるか判定する
    // 結果: 経過時間が営業日ベースで1営業日以内であり、SLAが達成されていることが確認される

    // ケース1: 同一営業日内（9時受領、16時回答）- SLA達成
    const received_at_1 = new Date('2024-01-15T09:00:00Z');
    const answered_at_1 = new Date('2024-01-15T16:00:00Z');
    const sla_definition_days = 1;

    const result_1 = calculateBusinessDaysSLA({
      received_at: received_at_1,
      answered_at: answered_at_1,
      sla_definition_days: sla_definition_days,
      business_hour_start: 9,
      business_hour_end: 18,
      weekend_days: [0, 6]
    });

    expect(result_1.is_sla_achieved).toBe(true);
    expect(result_1.business_days_elapsed).toBe(0.29); // 7時間 / 24時間 ≈ 0.29営業日

    // ケース2: 翌営業日（月曜9時受領、火曜16時回答）- SLA達成（1営業日以内）
    const received_at_2 = new Date('2024-01-15T09:00:00Z'); // 月曜
    const answered_at_2 = new Date('2024-01-16T16:00:00Z'); // 火曜
    const sla_definition_days_2 = 1;

    const result_2 = calculateBusinessDaysSLA({
      received_at: received_at_2,
      answered_at: answered_at_2,
      sla_definition_days: sla_definition_days_2,
      business_hour_start: 9,
      business_hour_end: 18,
      weekend_days: [0, 6]
    });

    expect(result_2.is_sla_achieved).toBe(true);
    expect(result_2.business_days_elapsed).toBeCloseTo(1.29, 2);

    // ケース3: 2営業日以上経過（月曜9時受領、水曜16時回答）- SLA未達成
    const received_at_3 = new Date('2024-01-15T09:00:00Z'); // 月曜
    const answered_at_3 = new Date('2024-01-17T16:00:00Z'); // 水曜
    const sla_definition_days_3 = 1;

    const result_3 = calculateBusinessDaysSLA({
      received_at: received_at_3,
      answered_at: answered_at_3,
      sla_definition_days: sla_definition_days_3,
      business_hour_start: 9,
      business_hour_end: 18,
      weekend_days: [0, 6]
    });

    expect(result_3.is_sla_achieved).toBe(false);
    expect(result_3.business_days_elapsed).toBeCloseTo(2.29, 2);

    // ケース4: 金曜18時受領、月曜9時回答（土日スキップ）- SLA達成
    const received_at_4 = new Date('2024-01-12T18:00:00Z'); // 金曜
    const answered_at_4 = new Date('2024-01-15T09:00:00Z'); // 月曜
    const sla_definition_days_4 = 1;

    const result_4 = calculateBusinessDaysSLA({
      received_at: received_at_4,
      answered_at: answered_at_4,
      sla_definition_days: sla_definition_days_4,
      business_hour_start: 9,
      business_hour_end: 18,
      weekend_days: [0, 6]
    });

    expect(result_4.is_sla_achieved).toBe(true);
    expect(result_4.business_days_elapsed).toBeCloseTo(0.5, 2); // 月曜午前のみ営業時間

    // ケース5: SLA定義が2営業日の場合、2営業日以内で達成
    const received_at_5 = new Date('2024-01-15T09:00:00Z'); // 月曜
    const answered_at_5 = new Date('2024-01-17T16:00:00Z'); // 水曜
    const sla_definition_days_5 = 2;

    const result_5 = calculateBusinessDaysSLA({
      received_at: received_at_5,
      answered_at: answered_at_5,
      sla_definition_days: sla_definition_days_5,
      business_hour_start: 9,
      business_hour_end: 18,
      weekend_days: [0, 6]
    });

    expect(result_5.is_sla_achieved).toBe(true);
    expect(result_5.business_days_elapsed).toBeCloseTo(2.29, 2);

    // ケース6: 営業時間外での受領・回答（翌営業日に正規化）
    const received_at_6 = new Date('2024-01-15T08:30:00Z'); // 営業開始前
    const answered_at_6 = new Date('2024-01-15T18:30:00Z'); // 営業終了後
    const sla_definition_days_6 = 1;

    const result_6 = calculateBusinessDaysSLA({
      received_at: received_at_6,
      answered_at: answered_at_6,
      sla_definition_days: sla_definition_days_6,
      business_hour_start: 9,
      business_hour_end: 18,
      weekend_days: [0, 6]
    });

    expect(result_6.is_sla_achieved).toBe(true);
    expect(result_6.business_days_elapsed).toBeLessThanOrEqual(1);

    // SLA達成ステータスがシステムで正常に判定・表示されることを確認
    expect(result_1.sla_status).toBe('ACHIEVED');
    expect(result_3.sla_status).toBe('NOT_ACHIEVED');

    // SLA管理画面表示用の情報が正常に生成されることを確認
    expect(result_1).toHaveProperty('received_at');
    expect(result_1).toHaveProperty('answered_at');
    expect(result_1).toHaveProperty('business_days_elapsed');
    expect(result_1).toHaveProperty('is_sla_achieved');
    expect(result_1).toHaveProperty('sla_status');
    expect(typeof result_1.received_at).toBe('string');
    expect(typeof result_1.answered_at).toBe('string');
    expect(typeof result_1.business_days_elapsed).toBe('number');
    expect(typeof result_1.is_sla_achieved).toBe('boolean');
    expect(typeof result_1.sla_status).toBe('string');
  });
});