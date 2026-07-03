import { describe, test, expect } from "@jest/globals";
import { validateSalesActivitySearchDateRange } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-641: 不正な日付範囲が指定された場合はバリデーションエラーが発生する", () => {
    const start_date = new Date("2024-12-31T00:00:00Z");
    const end_date = new Date("2024-01-01T00:00:00Z");

    expect(() => {
      validateSalesActivitySearchDateRange({
        start_date,
        end_date,
      });
    }).toThrow(/終了日付は開始日付以降/);
  });
});