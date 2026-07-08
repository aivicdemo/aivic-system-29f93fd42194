import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  analyzeDeviationWithoutPastProjects,
  type DeviationAnalysisRequest,
  type DeviationAnalysisResponse,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("相場乖離可視化機能 - エラーハンドリング", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-789: 参照可能な過去案件が存在しない場合のエラー処理
  test("should throw error when no past projects available for deviation analysis", () => {
    const request: DeviationAnalysisRequest = {
      assessment_project_id: "PROJ-20240115-001",
      assessment_item_name: "外壁塗装工事",
      quoted_amount: 1500000,
      quoted_quantity: 150,
      quoted_unit_price: 10000,
      region_code: "13",
      construction_type_code: "EXT-PAINT",
      assessment_date: "2024-01-15",
      reference_past_project_count: 0,
      available_price_book_versions: [],
    };

    expect(() => {
      analyzeDeviationWithoutPastProjects(request);
    }).toThrow(/過去案件/);
  });

  test("should return error response with proper error message and stack trace", () => {
    const request: DeviationAnalysisRequest = {
      assessment_project_id: "PROJ-20240115-002",
      assessment_item_name: "躯体工事",
      quoted_amount: 2500000,
      quoted_quantity: 0,
      quoted_unit_price: 0,
      region_code: "27",
      construction_type_code: "STRUCTURE",
      assessment_date: "2024-01-15",
      reference_past_project_count: 0,
      available_price_book_versions: [],
    };

    try {
      analyzeDeviationWithoutPastProjects(request);
      fail("Expected function to throw an error");
    } catch (error: any) {
      expect(error.message).toMatch(/過去案件/);
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack.length).toBeGreaterThan(0);
    }
  });

  test("should handle empty price book versions array as reference data unavailable", () => {
    const request: DeviationAnalysisRequest = {
      assessment_project_id: "PROJ-20240115-003",
      assessment_item_name: "足場工事",
      quoted_amount: 800000,
      quoted_quantity: 50,
      quoted_unit_price: 16000,
      region_code: "01",
      construction_type_code: "SCAFFOLD",
      assessment_date: "2024-01-15",
      reference_past_project_count: 0,
      available_price_book_versions: [],
    };

    expect(() => {
      analyzeDeviationWithoutPastProjects(request);
    }).toThrow(/過去案件/);
  });

  test("should maintain system stability after error and allow subsequent operations", () => {
    const request_error: DeviationAnalysisRequest = {
      assessment_project_id: "PROJ-20240115-004",
      assessment_item_name: "防水工事",
      quoted_amount: 600000,
      quoted_quantity: 80,
      quoted_unit_price: 7500,
      region_code: "14",
      construction_type_code: "WATERPROOF",
      assessment_date: "2024-01-15",
      reference_past_project_count: 0,
      available_price_book_versions: [],
    };

    expect(() => {
      analyzeDeviationWithoutPastProjects(request_error);
    }).toThrow(/過去案件/);

    const request_valid: DeviationAnalysisRequest = {
      assessment_project_id: "PROJ-20240115-005",
      assessment_item_name: "内装工事",
      quoted_amount: 1200000,
      quoted_quantity: 100,
      quoted_unit_price: 12000,
      region_code: "13",
      construction_type_code: "INTERIOR",
      assessment_date: "2024-01-15",
      reference_past_project_count: 5,
      available_price_book_versions: ["2024-01"],
    };

    const result: DeviationAnalysisResponse =
      analyzeDeviationWithoutPastProjects(request_valid);
    expect(result).toBeDefined();
    expect(result.assessment_project_id).toBe("PROJ-20240115-005");
    expect(typeof result.deviation_rate).toBe("number");
  });

  test("should provide detailed error logging with stack trace containing file and line information", () => {
    const request: DeviationAnalysisRequest = {
      assessment_project_id: "PROJ-20240115-006",
      assessment_item_name: "電気工事",
      quoted_amount: 900000,
      quoted_quantity: 75,
      quoted_unit_price: 12000,
      region_code: "23",
      construction_type_code: "ELECTRICAL",
      assessment_date: "2024-01-15",
      reference_past_project_count: 0,
      available_price_book_versions: [],
    };

    try {
      analyzeDeviationWithoutPastProjects(request);
      fail("Expected function to throw an error");
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatch(/過去案件/);
      expect(error.stack).toContain("analyzeDeviationWithoutPastProjects");
    }
  });
});