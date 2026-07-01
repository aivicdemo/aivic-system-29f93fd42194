import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesDataByRules,
  type SalesDataValidationInput,
  type SalesDataValidationResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("SCEN-1370: [normal] 営業データ入力時の品質検証ルール定義・実行機能 - 定義された検証ルール条件をすべて満たす営業データが正常に検証完了と判定される", () => {
    // テストデータ: すべての検証ルール条件を満たす営業データ
    const validSalesData: SalesDataValidationInput = {
      customer_name: "株式会社サンプル",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      contact_type: "電話",
      outcome_content: "製品デモ実施",
      appointment_status: "確定",
      appointment_date: "2024-01-20",
      appointment_time: "10:00",
      service_type: "営業支援",
      amount: 150000,
      notes: "フォローアップ予定",
    };

    // 検証ルール条件の確認
    // 1. 必須項目チェック: すべての必須項目が入力されている
    expect(validSalesData.customer_name).toBeTruthy();
    expect(validSalesData.contact_date).toBeTruthy();
    expect(validSalesData.contact_time).toBeTruthy();
    expect(validSalesData.outcome_content).toBeTruthy();
    expect(validSalesData.appointment_status).toBeTruthy();
    expect(validSalesData.service_type).toBeTruthy();

    // 検証処理を実行
    const result: SalesDataValidationResult = validateSalesDataByRules(validSalesData);

    // 検証結果の確認
    // 最終的な検証ステータスが「合格」であること
    expect(result.validation_status).toBe("passed");

    // すべての検証ルール条件に対して合格判定となること
    expect(result.rule_check_results).toEqual({
      mandatory_fields: {
        status: "passed",
        failed_fields: [],
      },
      data_format: {
        status: "passed",
        format_errors: [],
      },
      value_range: {
        status: "passed",
        range_errors: [],
      },
      data_consistency: {
        status: "passed",
        consistency_errors: [],
      },
    });

    // エラーメッセージが表示されないこと
    expect(result.error_messages).toEqual([]);

    // データが次の処理ステップに進むことが可能な状態であること
    expect(result.can_proceed_to_next_step).toBe(true);

    // 検証完了タイムスタンプが記録されていること
    expect(result.validation_completed_at).toBeTruthy();
    expect(typeof result.validation_completed_at).toBe("string");

    // データが「検証完了」ステータスで登録されることを確認
    expect(result.final_status).toBe("検証完了");

    // 検証ルール適用数が正しいこと (4つの主要検証ルールが全て適用)
    expect(result.total_rules_applied).toBe(4);

    // 検証ルール合格数が正しいこと
    expect(result.passed_rules_count).toBe(4);

    // 検証ルール不合格数がゼロであること
    expect(result.failed_rules_count).toBe(0);
  });
});