import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { calculatePriceDivergenceMetrics } from "../../src/logic/it-6-2-1-1";

const fetchMock = require("jest-fetch-mock");

describe("相場乖離根拠データの一覧表示 - 査定担当者別・工種別・金額帯別の判定精度指標", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  test("SCEN-987: AI-OCR読取と学習データ照合完了時に乖離率・乖離額・参照データ件数・補正係数が一覧表示される", async () => {
    const ocrReadResults = [
      {
        estimate_id: "EST-001",
        item_name: "型枠工事",
        ocr_quantity: 100.0,
        ocr_unit_price: 5500.0,
        ocr_total_amount: 550000.0,
        work_type: "鉄筋工事",
        region: "東京都",
        assessment_period: "2024-01-15",
      },
      {
        estimate_id: "EST-002",
        item_name: "鉄筋加工",
        ocr_quantity: 80.0,
        ocr_unit_price: 6200.0,
        ocr_total_amount: 496000.0,
        work_type: "鉄筋工事",
        region: "神奈川県",
        assessment_period: "2024-01-16",
      },
      {
        estimate_id: "EST-003",
        item_name: "コンクリート打設",
        ocr_quantity: 200.0,
        ocr_unit_price: 8500.0,
        ocr_total_amount: 1700000.0,
        work_type: "コンクリート工事",
        region: "埼玉県",
        assessment_period: "2024-01-17",
      },
    ];

    const learningDataReferences = [
      {
        estimate_id: "EST-001",
        past_project_count: 45,
        market_standard_unit_price: 5200.0,
        regional_correction_factor: 1.05,
        seasonal_correction_factor: 1.02,
        reference_price_book_version: "2024-01",
      },
      {
        estimate_id: "EST-002",
        past_project_count: 32,
        market_standard_unit_price: 5900.0,
        regional_correction_factor: 1.08,
        seasonal_correction_factor: 1.01,
        reference_price_book_version: "2024-01",
      },
      {
        estimate_id: "EST-003",
        past_project_count: 68,
        market_standard_unit_price: 8200.0,
        regional_correction_factor: 1.02,
        seasonal_correction_factor: 1.03,
        reference_price_book_version: "2024-01",
      },
    ];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 200,
        data: {
          ocr_results: ocrReadResults,
          learning_data: learningDataReferences,
        },
      }),
      { status: 200 }
    );

    const result = await calculatePriceDivergenceMetrics(
      ocrReadResults,
      learningDataReferences
    );

    expect(result).toEqual([
      {
        estimate_id: "EST-001",
        divergence_rate: 5.77,
        divergence_amount: 300.0,
        reference_data_count: 45,
        correction_coefficient: 1.071,
        assessment_period: "2024-01-15",
        work_type: "鉄筋工事",
        region: "東京都",
      },
      {
        estimate_id: "EST-002",
        divergence_rate: 5.08,
        divergence_amount: 300.0,
        reference_data_count: 32,
        correction_coefficient: 1.090,
        assessment_period: "2024-01-16",
        work_type: "鉄筋工事",
        region: "神奈川県",
      },
      {
        estimate_id: "EST-003",
        divergence_rate: 3.66,
        divergence_amount: 300.0,
        reference_data_count: 68,
        correction_coefficient: 1.051,
        assessment_period: "2024-01-17",
        work_type: "コンクリート工事",
        region: "埼玉県",
      },
    ]);

    expect(result[0].divergence_rate).toStrictEqual(5.77);
    expect(result[0].divergence_amount).toStrictEqual(300.0);
    expect(result[0].reference_data_count).toStrictEqual(45);
    expect(result[0].correction_coefficient).toStrictEqual(1.071);

    expect(result[1].divergence_rate).toStrictEqual(5.08);
    expect(result[1].divergence_amount).toStrictEqual(300.0);
    expect(result[1].reference_data_count).toStrictEqual(32);
    expect(result[1].correction_coefficient).toStrictEqual(1.090);

    expect(result[2].divergence_rate).toStrictEqual(3.66);
    expect(result[2].divergence_amount).toStrictEqual(300.0);
    expect(result[2].reference_data_count).toStrictEqual(68);
    expect(result[2].correction_coefficient).toStrictEqual(1.051);

    expect(result.length).toBe(3);
    expect(
      result.every(
        (item) =>
          typeof item.estimate_id === "string" &&
          typeof item.divergence_rate === "number" &&
          typeof item.divergence_amount === "number" &&
          typeof item.reference_data_count === "number" &&
          typeof item.correction_coefficient === "number"
      )
    ).toBe(true);
  });
});