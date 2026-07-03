import { describe, test, expect } from "@jest/globals";
import { validateInvoiceAmountAgainstProcedure } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-963: [error] 請求額計算結果の手順書照合検証 - 計算された請求額が手順書のルールから乖離し、例外ケースが検出される
  test("計算された請求額が手順書のルールから乖離している場合、例外ケースとして検出され、詳細なエラーメッセージが出力される", () => {
    // 前提: 営業システムから請求対象データ（アポ数、成約数、顧客反応など）が自動抽出され、顧客ごと・サービスごとの請求額が計算されている状態
    // 発生条件: 計算された請求額が手順書で定義されたルールから乖離しているか検証する

    // テスト用の営業取引データ
    const salesTransactionData = {
      customer_id: "CUST_001",
      service_id: "SRV_A",
      base_amount: 100000, // 基本請求額
      appointment_count: 5, // アポ数
      deal_count: 2, // 成約数
      discount_rate: 0.1, // 割引率 10%
      tax_rate: 0.1, // 税率 10%
      calculated_invoice_amount: 99000, // システムが計算した請求額（誤り: 正しくは99000である場合と異なる）
    };

    // 手順書で定義されたルール（正確な計算ロジック）
    const procedureRules = {
      base_amount: 100000,
      discount_rate: 0.1,
      tax_rate: 0.1,
      // 正確な計算順序: (基本額 - 割引) × (1 + 税率)
      // (100000 - 100000*0.1) × (1 + 0.1) = 90000 × 1.1 = 99000
      expected_invoice_amount: 99000,
      rounding_method: "round_half_up",
      discount_application_order: "before_tax",
      exception_patterns: [
        {
          pattern_id: "rounding_error",
          description: "丸め誤差による計算ずれ",
          tolerance: 1,
        },
        {
          pattern_id: "discount_order_error",
          description: "割引適用順序の誤り",
          tolerance: 9000,
        },
        {
          pattern_id: "tax_calc_error",
          description: "税計算の誤り",
          tolerance: 8900,
        },
      ],
    };

    // 検証を実行
    const validationResult = validateInvoiceAmountAgainstProcedure(
      salesTransactionData,
      procedureRules
    );

    // 期待結果: 計算ロジックが手順書のルールから乖離していない場合、合格
    expect(validationResult).toEqual({
      is_valid: true,
      status: "合格",
      calculated_amount: 99000,
      expected_amount: 99000,
      deviation: 0,
      exception_detected: false,
      exception_details: null,
      validation_timestamp: expect.any(String),
    });

    // ケース2: 計算された請求額が手順書のルールから乖離している場合（割引適用順序の誤り）
    const salesTransactionDataWithError = {
      customer_id: "CUST_001",
      service_id: "SRV_A",
      base_amount: 100000,
      appointment_count: 5,
      deal_count: 2,
      discount_rate: 0.1,
      tax_rate: 0.1,
      calculated_invoice_amount: 108900, // 誤り: (100000 * (1 + 0.1) - 100000 * (1 + 0.1) * 0.1) = 99000ではなく108900（割引後に税金を計算）
    };

    const validationResultWithError = validateInvoiceAmountAgainstProcedure(
      salesTransactionDataWithError,
      procedureRules
    );

    // 期待結果: 乖離が検出される場合、例外として記録される
    expect(validationResultWithError).toEqual({
      is_valid: false,
      status: "不合格",
      calculated_amount: 108900,
      expected_amount: 99000,
      deviation: 9900,
      exception_detected: true,
      exception_details: {
        pattern_id: "discount_order_error",
        description: "割引適用順序の誤り",
        detected_deviation: 9900,
        tolerance: 9000,
        exceeds_tolerance: true,
      },
      validation_timestamp: expect.any(String),
    });

    // ケース3: 丸め誤差のみで許容範囲内の場合
    const salesTransactionDataWithRoundingError = {
      customer_id: "CUST_001",
      service_id: "SRV_A",
      base_amount: 100000,
      appointment_count: 5,
      deal_count: 2,
      discount_rate: 0.1,
      tax_rate: 0.1,
      calculated_invoice_amount: 99001, // 丸め誤差: 1円
    };

    const validationResultWithRoundingError =
      validateInvoiceAmountAgainstProcedure(
        salesTransactionDataWithRoundingError,
        procedureRules
      );

    // 期待結果: 丸め誤差が許容範囲内の場合、警告レベルで報告
    expect(validationResultWithRoundingError).toEqual({
      is_valid: true,
      status: "合格",
      calculated_amount: 99001,
      expected_amount: 99000,
      deviation: 1,
      exception_detected: true,
      exception_details: {
        pattern_id: "rounding_error",
        description: "丸め誤差による計算ずれ",
        detected_deviation: 1,
        tolerance: 1,
        exceeds_tolerance: false,
      },
      validation_timestamp: expect.any(String),
    });

    // ケース4: 税計算の誤り（許容範囲外）
    const salesTransactionDataWithTaxError = {
      customer_id: "CUST_001",
      service_id: "SRV_A",
      base_amount: 100000,
      appointment_count: 5,
      deal_count: 2,
      discount_rate: 0.1,
      tax_rate: 0.1,
      calculated_invoice_amount: 98000, // 誤り: 税計算が誤る
    };

    const validationResultWithTaxError = validateInvoiceAmountAgainstProcedure(
      salesTransactionDataWithTaxError,
      procedureRules
    );

    // 期待結果: 税計算の誤りが許容範囲外の場合、不合格
    expect(validationResultWithTaxError).toEqual({
      is_valid: false,
      status: "不合格",
      calculated_amount: 98000,
      expected_amount: 99000,
      deviation: -1000,
      exception_detected: true,
      exception_details: {
        pattern_id: "tax_calc_error",
        description: "税計算の誤り",
        detected_deviation: 1000,
        tolerance: 8900,
        exceeds_tolerance: false,
      },
      validation_timestamp: expect.any(String),
    });

    // ケース5: 複数の例外パターンが該当する場合（最初に検出されたパターンを報告）
    const salesTransactionDataWithMultipleErrors = {
      customer_id: "CUST_001",
      service_id: "SRV_A",
      base_amount: 100000,
      appointment_count: 5,
      deal_count: 2,
      discount_rate: 0.1,
      tax_rate: 0.1,
      calculated_invoice_amount: 110000, // 複数の誤りが重なっている
    };

    const validationResultWithMultipleErrors =
      validateInvoiceAmountAgainstProcedure(
        salesTransactionDataWithMultipleErrors,
        procedureRules
      );

    // 期待結果: 最初に該当する例外パターンが検出・報告される
    expect(validationResultWithMultipleErrors).toEqual({
      is_valid: false,
      status: "不合格",
      calculated_amount: 110000,
      expected_amount: 99000,
      deviation: 11000,
      exception_detected: true,
      exception_details: {
        pattern_id: "discount_order_error",
        description: "割引適用順序の誤り",
        detected_deviation: 11000,
        tolerance: 9000,
        exceeds_tolerance: true,
      },
      validation_timestamp: expect.any(String),
    });

    // エラーケース: 必須フィールドが不足している場合
    expect(() => {
      validateInvoiceAmountAgainstProcedure(
        {
          customer_id: "CUST_001",
          service_id: "SRV_A",
          base_amount: 100000,
          // discount_rate がない
          tax_rate: 0.1,
          calculated_invoice_amount: 99000,
        } as any,
        procedureRules
      );
    }).toThrow(/割引率/);

    // エラーケース: 手順書のルール定義が不完全
    expect(() => {
      validateInvoiceAmountAgainstProcedure(salesTransactionData, {
        base_amount: 100000,
        // expected_invoice_amount がない
        discount_rate: 0.1,
        tax_rate: 0.1,
      } as any);
    }).toThrow(/期待値/);

    // エラーケース: 例外パターンのマッピングが不正
    expect(() => {
      validateInvoiceAmountAgainstProcedure(
        salesTransactionData,
        {
          ...procedureRules,
          exception_patterns: [
            {
              pattern_id: "unknown_pattern",
              description: "未知の例外パターン",
              tolerance: -100, // 負の許容値は不正
            },
          ],
        }
      );
    }).toThrow(/許容範囲/);
  });
});