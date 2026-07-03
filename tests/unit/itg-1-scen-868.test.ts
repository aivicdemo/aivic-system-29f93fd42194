import { describe, test, expect, beforeEach } from "@jest/globals";
import { calculateContractChangeVerificationDeadline } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-868: [edge] 契約変更検証期限自動計算機能 - 検証期限がシステム最小単位（1日）で計算される
  test("SCEN-868: 契約変更検証期限が1日単位で正確に計算されることを確認", () => {
    // テスト1: 基本的な1日後の計算検証
    const registration_timestamp_1 = new Date("2024-06-15T10:30:00Z");
    const minimum_unit_days = 1;
    const expected_deadline_1 = new Date("2024-06-16T10:30:00Z");

    const result_1 = calculateContractChangeVerificationDeadline({
      registration_timestamp: registration_timestamp_1,
      minimum_unit_days: minimum_unit_days,
    });

    expect(result_1.verification_deadline).toEqual(expected_deadline_1);
    expect(result_1.calculated_days).toBe(1);

    // テスト2: 異なる時刻での登録で1日後が正確に計算されることを確認
    const registration_timestamp_2 = new Date("2024-07-20T23:45:00Z");
    const expected_deadline_2 = new Date("2024-07-21T23:45:00Z");

    const result_2 = calculateContractChangeVerificationDeadline({
      registration_timestamp: registration_timestamp_2,
      minimum_unit_days: minimum_unit_days,
    });

    expect(result_2.verification_deadline).toEqual(expected_deadline_2);
    expect(result_2.calculated_days).toBe(1);

    // テスト3: 複数の契約変更登録での検証期限計算精度を確認
    const registration_timestamps = [
      new Date("2024-08-01T09:00:00Z"),
      new Date("2024-08-02T14:15:00Z"),
      new Date("2024-08-03T00:00:00Z"),
    ];

    const expected_deadlines = [
      new Date("2024-08-02T09:00:00Z"),
      new Date("2024-08-03T14:15:00Z"),
      new Date("2024-08-04T00:00:00Z"),
    ];

    registration_timestamps.forEach((timestamp, index) => {
      const result = calculateContractChangeVerificationDeadline({
        registration_timestamp: timestamp,
        minimum_unit_days: minimum_unit_days,
      });

      expect(result.verification_deadline).toEqual(expected_deadlines[index]);
      expect(result.calculated_days).toBe(1);
    });

    // テスト4: システム時刻が異なる場合でも1日単位の計算が正確であることを確認
    const registration_timestamp_3 = new Date("2024-09-10T18:30:00Z");
    const expected_deadline_3 = new Date("2024-09-11T18:30:00Z");

    const result_3 = calculateContractChangeVerificationDeadline({
      registration_timestamp: registration_timestamp_3,
      minimum_unit_days: minimum_unit_days,
    });

    expect(result_3.verification_deadline).toEqual(expected_deadline_3);
    expect(result_3.calculated_days).toBe(1);

    // テスト5: 月跨ぎの日付で1日後が正確に計算されることを確認
    const registration_timestamp_4 = new Date("2024-06-30T16:45:00Z");
    const expected_deadline_4 = new Date("2024-07-01T16:45:00Z");

    const result_4 = calculateContractChangeVerificationDeadline({
      registration_timestamp: registration_timestamp_4,
      minimum_unit_days: minimum_unit_days,
    });

    expect(result_4.verification_deadline).toEqual(expected_deadline_4);
    expect(result_4.calculated_days).toBe(1);

    // テスト6: 年跨ぎの日付で1日後が正確に計算されることを確認
    const registration_timestamp_5 = new Date("2024-12-31T20:00:00Z");
    const expected_deadline_5 = new Date("2025-01-01T20:00:00Z");

    const result_5 = calculateContractChangeVerificationDeadline({
      registration_timestamp: registration_timestamp_5,
      minimum_unit_days: minimum_unit_days,
    });

    expect(result_5.verification_deadline).toEqual(expected_deadline_5);
    expect(result_5.calculated_days).toBe(1);

    // テスト7: 登録タイムスタンプが null の場合のエラーハンドリング
    expect(() => {
      calculateContractChangeVerificationDeadline({
        registration_timestamp: null as any,
        minimum_unit_days: minimum_unit_days,
      });
    }).toThrow(/タイムスタンプ/);

    // テスト8: minimum_unit_days が0以下の場合のエラーハンドリング
    expect(() => {
      calculateContractChangeVerificationDeadline({
        registration_timestamp: registration_timestamp_1,
        minimum_unit_days: 0,
      });
    }).toThrow(/最小単位/);

    // テスト9: minimum_unit_days が0未満の場合のエラーハンドリング
    expect(() => {
      calculateContractChangeVerificationDeadline({
        registration_timestamp: registration_timestamp_1,
        minimum_unit_days: -1,
      });
    }).toThrow(/最小単位/);

    // テスト10: 計算結果がデータベースに正確に保存されることを確認するための戻り値検証
    const result_db = calculateContractChangeVerificationDeadline({
      registration_timestamp: new Date("2024-10-15T12:00:00Z"),
      minimum_unit_days: 1,
    });

    expect(result_db).toHaveProperty("verification_deadline");
    expect(result_db).toHaveProperty("calculated_days");
    expect(result_db).toHaveProperty("is_valid_calculation");
    expect(result_db.is_valid_calculation).toBe(true);
    expect(typeof result_db.verification_deadline).toBe("object");
    expect(result_db.verification_deadline instanceof Date).toBe(true);
  });
});