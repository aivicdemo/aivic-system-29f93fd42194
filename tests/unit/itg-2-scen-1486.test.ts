import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateRegistrationDataQuality } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1486
  test("登録データが完全重複している場合、エラーメッセージで通知される", () => {
    const testDataSet = [
      {
        item_name: "鉄骨造2階建",
        quantity: 1,
        unit_price: 50000,
        total_amount: 50000,
        assessor_id: "ASS001",
        assessment_date: "2024-01-15",
        region: "東京都",
        work_type: "新築",
      },
      {
        item_name: "鉄骨造2階建",
        quantity: 1,
        unit_price: 50000,
        total_amount: 50000,
        assessor_id: "ASS001",
        assessment_date: "2024-01-15",
        region: "東京都",
        work_type: "新築",
      },
    ];

    expect(() => validateRegistrationDataQuality(testDataSet)).toThrow(
      /重複/
    );
  });
});