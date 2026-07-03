import { describe, test, expect } from "@jest/globals";
import {
  searchSalesActivityData,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業活動データ検索・抽出機能", () => {
  // SCEN-1158: [error] 営業活動データ検索・抽出機能 - 無効な検索条件でエラーが発生する
  test("無効な検索条件でエラーメッセージが表示される", () => {
    // 無効な日付形式（不正なISO文字列）
    expect(() =>
      searchSalesActivityData({
        startDate: "2024-13-45",
        endDate: "2024-01-31",
        customerId: "C001",
        salesPersonId: "S001",
      })
    ).toThrow(/日付形式/);

    // 負の数値（無効な顧客ID数値表現）
    expect(() =>
      searchSalesActivityData({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        customerId: "-1",
        salesPersonId: "S001",
      })
    ).toThrow(/顧客ID/);

    // 特殊文字のみの営業担当者ID
    expect(() =>
      searchSalesActivityData({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        customerId: "C001",
        salesPersonId: "!!!",
      })
    ).toThrow(/営業担当者ID/);

    // 開始日が終了日より後
    expect(() =>
      searchSalesActivityData({
        startDate: "2024-02-01",
        endDate: "2024-01-31",
        customerId: "C001",
        salesPersonId: "S001",
      })
    ).toThrow(/期間/);

    // 正常な条件では例外が発生しない（ハッピーパス）
    const result = searchSalesActivityData({
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      customerId: "C001",
      salesPersonId: "S001",
    });

    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.recordCount).toBeGreaterThanOrEqual(0);
    expect(result.searchExecuted).toBe(true);
  });
});