import { describe, test, expect } from "@jest/globals";
import { validateApprovalResponse } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1219
  test("回答内容が契約条件と矛盾している場合、修正指示が返され、承認は保留される", () => {
    // 契約条件: 契約期間12ヶ月、月額料金50,000円、支払い条件は月末払い
    const contractConditions = {
      contract_period_months: 12,
      monthly_fee_yen: 50000,
      payment_condition: "月末払い",
    };

    // 回答内容: 矛盾する契約期間24ヶ月、月額料金60,000円、支払い条件は即日払い
    const response_content = {
      contract_period_months: 24,
      monthly_fee_yen: 60000,
      payment_condition: "即日払い",
    };

    // validateApprovalResponse関数を呼び出し、矛盾検出を実行
    const result = validateApprovalResponse(
      contractConditions,
      response_content
    );

    // 矛盾が検出され、修正指示メッセージが返されることを検証
    expect(result.approval_status).toBe("保留中");
    expect(result.has_contradictions).toBe(true);
    expect(result.contradictions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "contract_period_months",
          expected_value: 12,
          provided_value: 24,
          message: expect.stringMatching(/契約期間/),
        }),
        expect.objectContaining({
          field: "monthly_fee_yen",
          expected_value: 50000,
          provided_value: 60000,
          message: expect.stringMatching(/月額料金/),
        }),
        expect.objectContaining({
          field: "payment_condition",
          expected_value: "月末払い",
          provided_value: "即日払い",
          message: expect.stringMatching(/支払い条件/),
        }),
      ])
    );
    expect(result.correction_required).toBe(true);
    expect(result.http_status_code).toMatch(/^(400|422)$/);
  });

  // SCEN-1219: エラーケース - 矛盾検出時のエラー throws
  test("回答内容が契約条件と矛盾している場合、エラーがスロー される", () => {
    const contractConditions = {
      contract_period_months: 12,
      monthly_fee_yen: 50000,
      payment_condition: "月末払い",
    };

    const response_content = {
      contract_period_months: 24,
      monthly_fee_yen: 60000,
      payment_condition: "即日払い",
    };

    expect(() =>
      validateApprovalResponse(contractConditions, response_content)
    ).toThrow(/矛盾/);
  });

  // SCEN-1219: 成功ケース - 契約条件と回答内容が一致している場合
  test("回答内容が契約条件と一致している場合、承認が確定される", () => {
    const contractConditions = {
      contract_period_months: 12,
      monthly_fee_yen: 50000,
      payment_condition: "月末払い",
    };

    // 回答内容が契約条件と一致
    const response_content = {
      contract_period_months: 12,
      monthly_fee_yen: 50000,
      payment_condition: "月末払い",
    };

    const result = validateApprovalResponse(
      contractConditions,
      response_content
    );

    expect(result.approval_status).toBe("承認済み");
    expect(result.has_contradictions).toBe(false);
    expect(result.contradictions).toEqual([]);
    expect(result.correction_required).toBe(false);
    expect(result.http_status_code).toBe("200");
  });

  // SCEN-1219: 部分的な矛盾検出 - 月額料金のみ異なる場合
  test("回答内容の一部フィールドのみが契約条件と矛盾する場合、該当フィールドの修正指示が返される", () => {
    const contractConditions = {
      contract_period_months: 12,
      monthly_fee_yen: 50000,
      payment_condition: "月末払い",
    };

    // 月額料金のみ異なる
    const response_content = {
      contract_period_months: 12,
      monthly_fee_yen: 55000,
      payment_condition: "月末払い",
    };

    const result = validateApprovalResponse(
      contractConditions,
      response_content
    );

    expect(result.approval_status).toBe("保留中");
    expect(result.has_contradictions).toBe(true);
    expect(result.contradictions).toHaveLength(1);
    expect(result.contradictions[0]).toEqual(
      expect.objectContaining({
        field: "monthly_fee_yen",
        expected_value: 50000,
        provided_value: 55000,
      })
    );
    expect(result.correction_required).toBe(true);
    expect(result.http_status_code).toMatch(/^(400|422)$/);
  });
});