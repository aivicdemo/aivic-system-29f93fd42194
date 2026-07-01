import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  executeCalculationLogicChain,
  getMetadataWithLogicSequence,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - 複数計算ロジック実行", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("SCEN-1330: 複数の計算ロジックが紐付いた項目の場合、すべてのロジックが正しく順序で実行される", () => {
    // テストデータ：複数の計算ロジックが紐付いた営業データ項目
    const basicAmount = 100000; // 基本金額
    const discountRate = 0.1; // 割引率 10%
    const taxRate = 0.1; // 税率 10%

    const metadataId = "meta_sales_final_amount";
    const logicSequence = [
      {
        sequence: 1,
        logicId: "logic_base_calc",
        logicName: "基本金額計算",
        inputField: "base_amount",
        outputField: "calculated_base",
      },
      {
        sequence: 2,
        logicId: "logic_discount_apply",
        logicName: "割引率適用",
        inputField: "calculated_base",
        outputField: "after_discount",
      },
      {
        sequence: 3,
        logicId: "logic_tax_calc",
        logicName: "税金計算",
        inputField: "after_discount",
        outputField: "tax_amount",
      },
      {
        sequence: 4,
        logicId: "logic_final_amount",
        logicName: "最終金額確定",
        inputField: "tax_amount",
        outputField: "final_amount",
      },
    ];

    // 期待される計算フロー
    // Step 1: 基本金額計算 → 100000
    const expectedStep1Result = basicAmount; // 100000

    // Step 2: 割引率適用 → 100000 * (1 - 0.1) = 90000
    const expectedStep2Result = expectedStep1Result * (1 - discountRate); // 90000

    // Step 3: 税金計算 → 税金額 = 90000 * 0.1 = 9000
    const expectedStep3TaxAmount = expectedStep2Result * taxRate; // 9000

    // Step 4: 最終金額確定 → 90000 + 9000 = 99000
    const expectedStep4Result = expectedStep2Result + expectedStep3TaxAmount; // 99000

    // 入力データ
    const inputData = {
      base_amount: basicAmount,
      discount_rate: discountRate,
      tax_rate: taxRate,
    };

    // 計算ロジックチェーンを実行
    const executionResult = executeCalculationLogicChain({
      metadataId,
      logicSequence,
      inputData,
    });

    // 各ロジックの実行順序を検証
    expect(executionResult.executionSequence).toEqual([1, 2, 3, 4]);

    // 各ステップの中間結果を検証
    expect(executionResult.intermediateResults.step_1_calculated_base).toBe(
      expectedStep1Result
    ); // 100000
    expect(executionResult.intermediateResults.step_2_after_discount).toBe(
      expectedStep2Result
    ); // 90000
    expect(executionResult.intermediateResults.step_3_tax_amount).toBe(
      expectedStep3TaxAmount
    ); // 9000
    expect(executionResult.intermediateResults.step_4_final_amount).toBe(
      expectedStep4Result
    ); // 99000

    // 最終計算結果が期待値と合致すること
    expect(executionResult.finalAmount).toBe(expectedStep4Result); // 99000

    // すべての中間結果がシステムに記録されていることを確認
    expect(executionResult.recordedSteps).toBe(4);
    expect(executionResult.allStepsCompleted).toBe(true);

    // 実行順序が定義された順序と一致すること
    expect(executionResult.sequenceValidation.isOrderCorrect).toBe(true);
    expect(executionResult.sequenceValidation.hasNoGaps).toBe(true);
    expect(executionResult.sequenceValidation.hasNoReversals).toBe(true);

    // メタデータの取得と検証
    const retrievedMetadata = getMetadataWithLogicSequence(metadataId);
    expect(retrievedMetadata.id).toBe(metadataId);
    expect(retrievedMetadata.logicSequence.length).toBe(4);
    expect(retrievedMetadata.logicSequence[0].sequence).toBe(1);
    expect(retrievedMetadata.logicSequence[1].sequence).toBe(2);
    expect(retrievedMetadata.logicSequence[2].sequence).toBe(3);
    expect(retrievedMetadata.logicSequence[3].sequence).toBe(4);

    // ロジック連鎖の入出力が正しくマッピングされていることを検証
    expect(retrievedMetadata.logicSequence[0].outputField).toBe(
      retrievedMetadata.logicSequence[1].inputField
    ); // calculated_base
    expect(retrievedMetadata.logicSequence[1].outputField).toBe(
      retrievedMetadata.logicSequence[2].inputField
    ); // after_discount
    expect(retrievedMetadata.logicSequence[2].outputField).toBe(
      retrievedMetadata.logicSequence[3].inputField
    ); // tax_amount

    // 実行フロー全体の妥当性を検証
    expect(executionResult.totalExecutionTimeMs).toBeGreaterThan(0);
    expect(executionResult.totalExecutionTimeMs).toBeLessThan(5000);
  });
});