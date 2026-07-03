import { calculateContractChangeVerificationDeadline } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-865: 契約変更検証期限自動計算機能 - 契約変更通知受領時に検証完了期限が正しく計算される", () => {
    // ========================================
    // テストケース 1: 新規契約（契約タイプ: NEW）
    // ========================================
    // 入力: 契約変更通知受領日時 2024-01-15T09:00:00Z, 契約タイプ NEW
    // 業務ルール: 新規契約は受領日から営業日ベース 3 日以内に検証完了
    // 期待値計算:
    //   - 受領日: 2024-01-15（月曜）
    //   - +1営業日: 2024-01-16（火曜）
    //   - +2営業日: 2024-01-17（水曜）
    //   - +3営業日: 2024-01-18（木曜）
    //   - 期限: 2024-01-18T23:59:59Z
    const result_new = calculateContractChangeVerificationDeadline({
      notificationReceivedAt: new Date("2024-01-15T09:00:00Z"),
      contractType: "NEW",
    });

    expect(result_new.deadline).toEqual(new Date("2024-01-18T23:59:59Z"));
    expect(result_new.businessDaysAllowed).toBe(3);
    expect(result_new.contractType).toBe("NEW");

    // ========================================
    // テストケース 2: 契約更新（契約タイプ: UPDATE）
    // ========================================
    // 入力: 契約変更通知受領日時 2024-01-15T10:30:00Z, 契約タイプ UPDATE
    // 業務ルール: 契約更新は受領日から営業日ベース 2 日以内に検証完了
    // 期待値計算:
    //   - 受領日: 2024-01-15（月曜）
    //   - +1営業日: 2024-01-16（火曜）
    //   - +2営業日: 2024-01-17（水曜）
    //   - 期限: 2024-01-17T23:59:59Z
    const result_update = calculateContractChangeVerificationDeadline({
      notificationReceivedAt: new Date("2024-01-15T10:30:00Z"),
      contractType: "UPDATE",
    });

    expect(result_update.deadline).toEqual(new Date("2024-01-17T23:59:59Z"));
    expect(result_update.businessDaysAllowed).toBe(2);
    expect(result_update.contractType).toBe("UPDATE");

    // ========================================
    // テストケース 3: 契約変更（契約タイプ: CHANGE）
    // ========================================
    // 入力: 契約変更通知受領日時 2024-01-15T14:00:00Z, 契約タイプ CHANGE
    // 業務ルール: 契約変更は受領日から営業日ベース 2 日以内に検証完了
    // 期待値計算:
    //   - 受領日: 2024-01-15（月曜）
    //   - +1営業日: 2024-01-16（火曜）
    //   - +2営業日: 2024-01-17（水曜）
    //   - 期限: 2024-01-17T23:59:59Z
    const result_change = calculateContractChangeVerificationDeadline({
      notificationReceivedAt: new Date("2024-01-15T14:00:00Z"),
      contractType: "CHANGE",
    });

    expect(result_change.deadline).toEqual(new Date("2024-01-17T23:59:59Z"));
    expect(result_change.businessDaysAllowed).toBe(2);
    expect(result_change.contractType).toBe("CHANGE");

    // ========================================
    // テストケース 4: 金曜日受領の場合の営業日計算
    // ========================================
    // 入力: 契約変更通知受領日時 2024-01-19T09:00:00Z（金曜日）, 契約タイプ UPDATE
    // 業務ルール: 契約更新は受領日から営業日ベース 2 日以内に検証完了
    // 期待値計算:
    //   - 受領日: 2024-01-19（金曜日）
    //   - +1営業日: 2024-01-22（月曜日、土日をスキップ）
    //   - +2営業日: 2024-01-23（火曜日）
    //   - 期限: 2024-01-23T23:59:59Z
    const result_friday = calculateContractChangeVerificationDeadline({
      notificationReceivedAt: new Date("2024-01-19T09:00:00Z"),
      contractType: "UPDATE",
    });

    expect(result_friday.deadline).toEqual(new Date("2024-01-23T23:59:59Z"));
    expect(result_friday.businessDaysAllowed).toBe(2);

    // ========================================
    // テストケース 5: 祝日を含む期間の営業日計算
    // ========================================
    // 入力: 契約変更通知受領日時 2024-01-08T09:00:00Z（月曜）, 契約タイプ NEW
    // 注: 2024-01-08 は成人の日（祝日）とする
    // 業務ルール: 新規契約は受領日から営業日ベース 3 日以内に検証完了
    // 期待値計算:
    //   - 受領日: 2024-01-08（月曜、祝日）
    //   - +1営業日: 2024-01-09（火曜）
    //   - +2営業日: 2024-01-10（水曜）
    //   - +3営業日: 2024-01-11（木曜）
    //   - 期限: 2024-01-11T23:59:59Z
    const result_holiday = calculateContractChangeVerificationDeadline({
      notificationReceivedAt: new Date("2024-01-08T09:00:00Z"),
      contractType: "NEW",
      holidays: [new Date("2024-01-08")],
    });

    expect(result_holiday.deadline).toEqual(new Date("2024-01-11T23:59:59Z"));
    expect(result_holiday.businessDaysAllowed).toBe(3);

    // ========================================
    // テストケース 6: エラーケース - 無効な契約タイプ
    // ========================================
    // 入力: 無効な契約タイプ "INVALID"
    // 期待: エラーをスロー、メッセージに "契約タイプ" を含む
    expect(() => {
      calculateContractChangeVerificationDeadline({
        notificationReceivedAt: new Date("2024-01-15T09:00:00Z"),
        contractType: "INVALID",
      });
    }).toThrow(/契約タイプ/);

    // ========================================
    // テストケース 7: エラーケース - 無効な受領日時
    // ========================================
    // 入力: 不正な受領日時（null または undefined）
    // 期待: エラーをスロー、メッセージに "受領日時" を含む
    expect(() => {
      calculateContractChangeVerificationDeadline({
        notificationReceivedAt: null as any,
        contractType: "UPDATE",
      });
    }).toThrow(/受領日時/);

    // ========================================
    // テストケース 8: 返却値の構造検証
    // ========================================
    // 期限計算結果が正しい構造を持つことを確認
    const result_structure = calculateContractChangeVerificationDeadline({
      notificationReceivedAt: new Date("2024-01-15T09:00:00Z"),
      contractType: "NEW",
    });

    expect(result_structure).toHaveProperty("deadline");
    expect(result_structure).toHaveProperty("businessDaysAllowed");
    expect(result_structure).toHaveProperty("contractType");
    expect(result_structure.deadline).toBeInstanceOf(Date);
    expect(typeof result_structure.businessDaysAllowed).toBe("number");
    expect(typeof result_structure.contractType).toBe("string");
  });
});