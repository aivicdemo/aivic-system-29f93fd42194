import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

import {
  generateImprovementResultReport,
} from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1237
  test("改善結果レポートがPDF形式で正常に生成される", async () => {
    const report_generation_request = {
      target_period_start: "2024-01-01",
      target_period_end: "2024-03-31",
      department_id: "dept_001",
      assessor_ids: ["assessor_001", "assessor_002", "assessor_003"],
      include_assessor_breakdown: true,
      include_work_type_breakdown: true,
      include_price_range_breakdown: true,
    };

    const mock_pdf_buffer = Buffer.from(
      "%PDF-1.4\n%mock-pdf-content\n%%EOF",
      "utf-8"
    );

    const mock_report_data = {
      report_id: "report_20240415_001",
      generated_at: "2024-04-15T10:30:00Z",
      target_period: {
        start: "2024-01-01",
        end: "2024-03-31",
      },
      department_id: "dept_001",
      summary_metrics: {
        total_assessments: 450,
        average_processing_time_minutes: 18.5,
        quality_uniformity_index: 0.92,
        system_uptime_percentage: 99.2,
        ocr_accuracy_percentage: 96.8,
        ai_judgment_accuracy_percentage: 94.3,
      },
      assessor_breakdown: [
        {
          assessor_id: "assessor_001",
          assessor_name: "山田太郎",
          judgment_accuracy: 0.96,
          average_processing_time_minutes: 17.2,
          processing_count: 150,
          divergence_rate_percent: 2.1,
        },
        {
          assessor_id: "assessor_002",
          assessor_name: "鈴木花子",
          judgment_accuracy: 0.94,
          average_processing_time_minutes: 19.1,
          processing_count: 148,
          divergence_rate_percent: 3.5,
        },
        {
          assessor_id: "assessor_003",
          assessor_name: "佐藤次郎",
          judgment_accuracy: 0.91,
          average_processing_time_minutes: 19.5,
          processing_count: 152,
          divergence_rate_percent: 4.8,
        },
      ],
      work_type_breakdown: [
        {
          work_type_id: "wt_001",
          work_type_name: "土木工事",
          total_assessments: 180,
          judgment_accuracy: 0.95,
          average_divergence_rate_percent: 2.3,
        },
        {
          work_type_id: "wt_002",
          work_type_name: "建築工事",
          total_assessments: 185,
          judgment_accuracy: 0.93,
          average_divergence_rate_percent: 3.1,
        },
        {
          work_type_id: "wt_003",
          work_type_name: "設備工事",
          total_assessments: 85,
          judgment_accuracy: 0.91,
          average_divergence_rate_percent: 4.2,
        },
      ],
      price_range_breakdown: [
        {
          price_range_id: "pr_001",
          price_range_label: "100万～500万円",
          total_assessments: 120,
          judgment_accuracy: 0.97,
          average_divergence_rate_percent: 1.8,
        },
        {
          price_range_id: "pr_002",
          price_range_label: "500万～1000万円",
          total_assessments: 210,
          judgment_accuracy: 0.94,
          average_divergence_rate_percent: 2.9,
        },
        {
          price_range_id: "pr_003",
          price_range_label: "1000万円以上",
          total_assessments: 120,
          judgment_accuracy: 0.89,
          average_divergence_rate_percent: 5.1,
        },
      ],
      improvements_implemented: [
        {
          improvement_id: "imp_001",
          improvement_name: "物価本データベースの季節変動対応",
          implementation_date: "2024-01-15",
          pre_improvement_ocr_accuracy: 0.934,
          post_improvement_ocr_accuracy: 0.968,
          improvement_rate_percent: 3.4,
        },
        {
          improvement_id: "imp_002",
          improvement_name: "地域別補正係数の追加学習",
          implementation_date: "2024-02-10",
          pre_improvement_judgment_accuracy: 0.918,
          post_improvement_judgment_accuracy: 0.943,
          improvement_rate_percent: 2.5,
        },
        {
          improvement_id: "imp_003",
          improvement_name: "過去案件データの年間更新",
          implementation_date: "2024-03-01",
          pre_improvement_processing_time_minutes: 21.3,
          post_improvement_processing_time_minutes: 18.5,
          improvement_rate_percent: 13.1,
        },
      ],
      file_format: "application/pdf",
      file_size_bytes: 245876,
      file_name: "improvement_result_report_20240415_dept_001.pdf",
    };

    fetchMock.mockResponseOnce(JSON.stringify(mock_report_data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    fetchMock.mockResponseOnce(mock_pdf_buffer, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });

    const result = await generateImprovementResultReport(
      report_generation_request
    );

    expect(result).toBeDefined();
    expect(result.report_id).toBe("report_20240415_001");
    expect(result.file_format).toBe("application/pdf");
    expect(result.file_name).toBe(
      "improvement_result_report_20240415_dept_001.pdf"
    );
    expect(result.file_size_bytes).toBe(245876);
    expect(result.generated_at).toBe("2024-04-15T10:30:00Z");

    expect(result.summary_metrics.total_assessments).toBe(450);
    expect(result.summary_metrics.average_processing_time_minutes).toBe(18.5);
    expect(result.summary_metrics.quality_uniformity_index).toBe(0.92);
    expect(result.summary_metrics.system_uptime_percentage).toBe(99.2);
    expect(result.summary_metrics.ocr_accuracy_percentage).toBe(96.8);
    expect(result.summary_metrics.ai_judgment_accuracy_percentage).toBe(94.3);

    expect(result.assessor_breakdown).toHaveLength(3);
    expect(result.assessor_breakdown[0]).toEqual({
      assessor_id: "assessor_001",
      assessor_name: "山田太郎",
      judgment_accuracy: 0.96,
      average_processing_time_minutes: 17.2,
      processing_count: 150,
      divergence_rate_percent: 2.1,
    });
    expect(result.assessor_breakdown[1].judgment_accuracy).toBe(0.94);
    expect(result.assessor_breakdown[2].divergence_rate_percent).toBe(4.8);

    expect(result.work_type_breakdown).toHaveLength(3);
    expect(result.work_type_breakdown[0].work_type_name).toBe("土木工事");
    expect(result.work_type_breakdown[0].total_assessments).toBe(180);
    expect(result.work_type_breakdown[0].judgment_accuracy).toBe(0.95);
    expect(result.work_type_breakdown[1].average_divergence_rate_percent).toBe(
      3.1
    );
    expect(result.work_type_breakdown[2].work_type_name).toBe("設備工事");

    expect(result.price_range_breakdown).toHaveLength(3);
    expect(result.price_range_breakdown[0].price_range_label).toBe(
      "100万～500万円"
    );
    expect(result.price_range_breakdown[0].judgment_accuracy).toBe(0.97);
    expect(result.price_range_breakdown[0].average_divergence_rate_percent).toBe(
      1.8
    );
    expect(result.price_range_breakdown[1].total_assessments).toBe(210);
    expect(result.price_range_breakdown[2].judgment_accuracy).toBe(0.89);

    expect(result.improvements_implemented).toHaveLength(3);
    expect(result.improvements_implemented[0].improvement_name).toBe(
      "物価本データベースの季節変動対応"
    );
    expect(
      result.improvements_implemented[0].post_improvement_ocr_accuracy
    ).toBe(0.968);
    expect(
      result.improvements_implemented[0].improvement_rate_percent
    ).toBeCloseTo(3.4, 1);

    expect(result.improvements_implemented[1].improvement_name).toBe(
      "地域別補正係数の追加学習"
    );
    expect(
      result.improvements_implemented[1].post_improvement_judgment_accuracy
    ).toBe(0.943);
    expect(
      result.improvements_implemented[1].improvement_rate_percent
    ).toBeCloseTo(2.5, 1);

    expect(result.improvements_implemented[2].improvement_name).toBe(
      "過去案件データの年間更新"
    );
    expect(
      result.improvements_implemented[2].pre_improvement_processing_time_minutes
    ).toBe(21.3);
    expect(
      result.improvements_implemented[2].post_improvement_processing_time_minutes
    ).toBe(18.5);
    expect(
      result.improvements_implemented[2].improvement_rate_percent
    ).toBeCloseTo(13.1, 1);

    expect(result.target_period.start).toBe("2024-01-01");
    expect(result.target_period.end).toBe("2024-03-31");
    expect(result.department_id).toBe("dept_001");
  });
});