import { describe, test, expect } from "@jest/globals";
import { evaluateDeviationReliability } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1003
  test("相場乖離根拠データの総合判定 - 根拠データの信頼度が低い場合（例：信頼度スコア<60%）、再確認が必要である旨が表示される", () => {
    const input_low_reliability = {
      deviation_rate: 25.5,
      deviation_amount: 150000,
      reference_data_count: 3,
      price_book_source: "物価本2024年1月版",
      correction_factor: 0.95,
      confidence_score: 55,
    };

    const result_low_reliability = evaluateDeviationReliability(
      input_low_reliability
    );

    expect(result_low_reliability.confidence_score).toBe(55);
    expect(result_low_reliability.requires_reconfirmation).toBe(true);
    expect(result_low_reliability.alert_message).toMatch(/再確認/);
    expect(result_low_reliability.alert_message).toMatch(/信頼度が低い/);
    expect(result_low_reliability.alert_level).toBe("warning");

    const input_medium_reliability = {
      deviation_rate: 18.3,
      deviation_amount: 110000,
      reference_data_count: 8,
      price_book_source: "物価本2024年1月版",
      correction_factor: 0.98,
      confidence_score: 60,
    };

    const result_medium_reliability = evaluateDeviationReliability(
      input_medium_reliability
    );

    expect(result_medium_reliability.confidence_score).toBe(60);
    expect(result_medium_reliability.requires_reconfirmation).toBe(false);
    expect(result_medium_reliability.alert_level).toBe("normal");

    const input_high_reliability = {
      deviation_rate: 12.1,
      deviation_amount: 72000,
      reference_data_count: 25,
      price_book_source: "物価本2024年1月版",
      correction_factor: 1.0,
      confidence_score: 88,
    };

    const result_high_reliability = evaluateDeviationReliability(
      input_high_reliability
    );

    expect(result_high_reliability.confidence_score).toBe(88);
    expect(result_high_reliability.requires_reconfirmation).toBe(false);
    expect(result_high_reliability.alert_level).toBe("normal");

    const input_very_low_reliability = {
      deviation_rate: 42.8,
      deviation_amount: 256000,
      reference_data_count: 1,
      price_book_source: "物価本2023年6月版",
      correction_factor: 0.85,
      confidence_score: 35,
    };

    const result_very_low_reliability = evaluateDeviationReliability(
      input_very_low_reliability
    );

    expect(result_very_low_reliability.confidence_score).toBe(35);
    expect(result_very_low_reliability.requires_reconfirmation).toBe(true);
    expect(result_very_low_reliability.alert_message).toMatch(/再確認/);
    expect(result_very_low_reliability.alert_level).toBe("warning");

    const input_boundary_59 = {
      deviation_rate: 20.0,
      deviation_amount: 120000,
      reference_data_count: 5,
      price_book_source: "物価本2024年1月版",
      correction_factor: 0.96,
      confidence_score: 59,
    };

    const result_boundary_59 = evaluateDeviationReliability(input_boundary_59);

    expect(result_boundary_59.confidence_score).toBe(59);
    expect(result_boundary_59.requires_reconfirmation).toBe(true);
    expect(result_boundary_59.alert_level).toBe("warning");

    const input_boundary_61 = {
      deviation_rate: 19.5,
      deviation_amount: 117000,
      reference_data_count: 6,
      price_book_source: "物価本2024年1月版",
      correction_factor: 0.97,
      confidence_score: 61,
    };

    const result_boundary_61 = evaluateDeviationReliability(input_boundary_61);

    expect(result_boundary_61.confidence_score).toBe(61);
    expect(result_boundary_61.requires_reconfirmation).toBe(false);
    expect(result_boundary_61.alert_level).toBe("normal");
  });
});