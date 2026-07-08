import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  aggregateOperationalData,
  calculateOcrAccuracy,
  calculateJudgmentAccuracy,
  calculateProcessingTime,
  classifyFormatAccuracy,
  classifyDivergencePattern,
} from "../../src/logic/it-6-2-2-2";

describe("初期運用データ自動集計・ダッシュボード可視化機能", () => {
  // SCEN-1530
  test("3ヶ月運用実績から AI-OCR精度、AI判定精度、処理時間、フォーマット別精度、地域別工種別乖離パターンを一元集計できる", () => {
    const operation_data_3months = [
      {
        date: "2024-01-15",
        estimate_id: "EST001",
        format_type: "type_A",
        region: "tokyo",
        construction_type: "kenzou",
        ocr_accuracy: 94.5,
        judgment_accuracy: 89.2,
        processing_time_minutes: 18,
        divergence_rate: 3.2,
      },
      {
        date: "2024-01-20",
        estimate_id: "EST002",
        format_type: "type_A",
        region: "tokyo",
        construction_type: "kenzou",
        ocr_accuracy: 95.1,
        judgment_accuracy: 90.5,
        processing_time_minutes: 16,
        divergence_rate: 2.8,
      },
      {
        date: "2024-01-25",
        estimate_id: "EST003",
        format_type: "type_B",
        region: "osaka",
        construction_type: "shikumi",
        ocr_accuracy: 91.8,
        judgment_accuracy: 85.6,
        processing_time_minutes: 22,
        divergence_rate: 5.1,
      },
      {
        date: "2024-02-10",
        estimate_id: "EST004",
        format_type: "type_A",
        region: "tokyo",
        construction_type: "kenzou",
        ocr_accuracy: 96.2,
        judgment_accuracy: 91.3,
        processing_time_minutes: 15,
        divergence_rate: 2.1,
      },
      {
        date: "2024-02-15",
        estimate_id: "EST005",
        format_type: "type_B",
        region: "osaka",
        construction_type: "kenzou",
        ocr_accuracy: 93.4,
        judgment_accuracy: 87.9,
        processing_time_minutes: 19,
        divergence_rate: 4.3,
      },
      {
        date: "2024-02-28",
        estimate_id: "EST006",
        format_type: "type_C",
        region: "nagoya",
        construction_type: "shikumi",
        ocr_accuracy: 92.7,
        judgment_accuracy: 86.8,
        processing_time_minutes: 20,
        divergence_rate: 5.8,
      },
      {
        date: "2024-03-05",
        estimate_id: "EST007",
        format_type: "type_A",
        region: "tokyo",
        construction_type: "kenzou",
        ocr_accuracy: 97.0,
        judgment_accuracy: 92.1,
        processing_time_minutes: 14,
        divergence_rate: 1.9,
      },
      {
        date: "2024-03-15",
        estimate_id: "EST008",
        format_type: "type_B",
        region: "osaka",
        construction_type: "shikumi",
        ocr_accuracy: 94.3,
        judgment_accuracy: 88.7,
        processing_time_minutes: 18,
        divergence_rate: 4.6,
      },
      {
        date: "2024-03-25",
        estimate_id: "EST009",
        format_type: "type_C",
        region: "nagoya",
        construction_type: "kenzou",
        ocr_accuracy: 93.9,
        judgment_accuracy: 88.2,
        processing_time_minutes: 17,
        divergence_rate: 3.5,
      },
    ];

    const start_date = "2024-01-01";
    const end_date = "2024-03-31";

    const aggregated_result = aggregateOperationalData(
      operation_data_3months,
      start_date,
      end_date
    );

    expect(aggregated_result).toBeDefined();
    expect(aggregated_result.period_start).toBe("2024-01-01");
    expect(aggregated_result.period_end).toBe("2024-03-31");
    expect(aggregated_result.total_records).toBe(9);

    // AI-OCR精度集計: 3ヶ月分の平均 (94.5+95.1+91.8+96.2+93.4+92.7+97.0+94.3+93.9)/9 = 846.9/9 = 94.1
    const ocr_accuracy_result = calculateOcrAccuracy(operation_data_3months);
    expect(ocr_accuracy_result.average_accuracy).toBeCloseTo(94.1, 1);
    expect(ocr_accuracy_result.min_accuracy).toBe(91.8);
    expect(ocr_accuracy_result.max_accuracy).toBe(97.0);
    expect(ocr_accuracy_result.record_count).toBe(9);

    // AI判定精度集計: (89.2+90.5+85.6+91.3+87.9+86.8+92.1+88.7+88.2)/9 = 800.3/9 = 88.9
    const judgment_accuracy_result = calculateJudgmentAccuracy(
      operation_data_3months
    );
    expect(judgment_accuracy_result.average_accuracy).toBeCloseTo(88.9, 1);
    expect(judgment_accuracy_result.min_accuracy).toBe(85.6);
    expect(judgment_accuracy_result.max_accuracy).toBe(92.1);
    expect(judgment_accuracy_result.record_count).toBe(9);

    // 処理時間集計: (18+16+22+15+19+20+14+18+17)/9 = 159/9 = 17.67
    const processing_time_result = calculateProcessingTime(operation_data_3months);
    expect(processing_time_result.average_processing_minutes).toBeCloseTo(
      17.67,
      1
    );
    expect(processing_time_result.min_processing_minutes).toBe(14);
    expect(processing_time_result.max_processing_minutes).toBe(22);
    expect(processing_time_result.record_count).toBe(9);

    // フォーマット別精度集計
    // type_A: EST001(94.5), EST002(95.1), EST004(96.2), EST007(97.0) = (94.5+95.1+96.2+97.0)/4 = 382.8/4 = 95.7
    // type_B: EST003(91.8), EST005(93.4), EST008(94.3) = (91.8+93.4+94.3)/3 = 279.5/3 = 93.17
    // type_C: EST006(92.7), EST009(93.9) = (92.7+93.9)/2 = 186.6/2 = 93.3
    const format_accuracy_result = classifyFormatAccuracy(operation_data_3months);
    expect(format_accuracy_result).toBeDefined();
    expect(format_accuracy_result.type_A).toBeDefined();
    expect(format_accuracy_result.type_A.average_ocr_accuracy).toBeCloseTo(
      95.7,
      1
    );
    expect(format_accuracy_result.type_A.record_count).toBe(4);
    expect(format_accuracy_result.type_B.average_ocr_accuracy).toBeCloseTo(
      93.17,
      1
    );
    expect(format_accuracy_result.type_B.record_count).toBe(3);
    expect(format_accuracy_result.type_C.average_ocr_accuracy).toBeCloseTo(
      93.3,
      1
    );
    expect(format_accuracy_result.type_C.record_count).toBe(2);

    // 地域別工種別乖離パターン分類
    // tokyo + kenzou: EST001(3.2), EST002(2.8), EST004(2.1), EST007(1.9) = avg 2.5
    // osaka + shikumi: EST003(5.1), EST008(4.6) = avg 4.85
    // osaka + kenzou: EST005(4.3)
    // nagoya + shikumi: EST006(5.8)
    // nagoya + kenzou: EST009(3.5)
    const divergence_pattern_result = classifyDivergencePattern(
      operation_data_3months
    );
    expect(divergence_pattern_result).toBeDefined();
    expect(
      divergence_pattern_result["tokyo-kenzou"].average_divergence_rate
    ).toBeCloseTo(2.5, 1);
    expect(divergence_pattern_result["tokyo-kenzou"].record_count).toBe(4);
    expect(
      divergence_pattern_result["osaka-shikumi"].average_divergence_rate
    ).toBeCloseTo(4.85, 1);
    expect(divergence_pattern_result["osaka-shikumi"].record_count).toBe(2);
    expect(divergence_pattern_result["osaka-kenzou"].average_divergence_rate).toBe(
      4.3
    );
    expect(divergence_pattern_result["osaka-kenzou"].record_count).toBe(1);
    expect(
      divergence_pattern_result["nagoya-shikumi"].average_divergence_rate
    ).toBe(5.8);
    expect(divergence_pattern_result["nagoya-shikumi"].record_count).toBe(1);
    expect(
      divergence_pattern_result["nagoya-kenzou"].average_divergence_rate
    ).toBe(3.5);
    expect(divergence_pattern_result["nagoya-kenzou"].record_count).toBe(1);

    // ダッシュボード統合表示用データ検証
    expect(aggregated_result.ocr_accuracy_summary).toEqual(ocr_accuracy_result);
    expect(aggregated_result.judgment_accuracy_summary).toEqual(
      judgment_accuracy_result
    );
    expect(aggregated_result.processing_time_summary).toEqual(
      processing_time_result
    );
    expect(aggregated_result.format_accuracy_classification).toEqual(
      format_accuracy_result
    );
    expect(aggregated_result.divergence_pattern_classification).toEqual(
      divergence_pattern_result
    );

    // データソース検証: 重複なし、欠落なし
    expect(aggregated_result.total_records).toBe(operation_data_3months.length);
    expect(aggregated_result.data_validation_status).toBe("valid");
    expect(aggregated_result.has_duplicates).toBe(false);
    expect(aggregated_result.missing_records).toBe(0);
  });
});