import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateReportSourceDataExists } from "../../src/logic/it-1781935279444-2-2-1";

describe("レポート数値とソースデータ照合機能 - ソースデータ存在検証", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1199
  test("対象期間のソースデータが存在しない場合、エラーが発生する", () => {
    const input = {
      start_date: "2099-01-01",
      end_date: "2099-01-31",
      customer_id: "CUST001",
      source_data: [],
    };

    expect(() => validateReportSourceDataExists(input)).toThrow(
      /対象期間のソースデータが見つかりません/
    );
  });

  // SCEN-1199: ハッピーパス - ソースデータが存在する場合
  test("対象期間のソースデータが存在する場合、検証が成功する", () => {
    const input = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      customer_id: "CUST001",
      source_data: [
        {
          id: "DATA001",
          customer_id: "CUST001",
          activity_date: "2024-01-15",
          activity_type: "appointment",
          count: 5,
        },
      ],
    };

    const result = validateReportSourceDataExists(input);
    expect(result).toEqual({
      is_valid: true,
      data_count: 1,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      message: "指定期間内のソースデータが確認されました",
    });
  });

  // SCEN-1199: 境界値テスト - 複数レコード存在時
  test("対象期間内に複数のソースデータが存在する場合、すべてカウントされる", () => {
    const input = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      customer_id: "CUST001",
      source_data: [
        {
          id: "DATA001",
          customer_id: "CUST001",
          activity_date: "2024-01-10",
          activity_type: "appointment",
          count: 3,
        },
        {
          id: "DATA002",
          customer_id: "CUST001",
          activity_date: "2024-01-20",
          activity_type: "contract",
          count: 2,
        },
        {
          id: "DATA003",
          customer_id: "CUST001",
          activity_date: "2024-01-25",
          activity_type: "feedback",
          count: 1,
        },
      ],
    };

    const result = validateReportSourceDataExists(input);
    expect(result).toEqual({
      is_valid: true,
      data_count: 3,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      message: "指定期間内のソースデータが確認されました",
    });
  });

  // SCEN-1199: 境界値テスト - 期間外データの排除
  test("期間外のソースデータは集計対象から除外される", () => {
    const input = {
      start_date: "2024-01-15",
      end_date: "2024-01-20",
      customer_id: "CUST001",
      source_data: [
        {
          id: "DATA001",
          customer_id: "CUST001",
          activity_date: "2024-01-10",
          activity_type: "appointment",
          count: 2,
        },
        {
          id: "DATA002",
          customer_id: "CUST001",
          activity_date: "2024-01-17",
          activity_type: "contract",
          count: 3,
        },
        {
          id: "DATA003",
          customer_id: "CUST001",
          activity_date: "2024-01-25",
          activity_type: "feedback",
          count: 1,
        },
      ],
    };

    const result = validateReportSourceDataExists(input);
    expect(result).toEqual({
      is_valid: true,
      data_count: 1,
      period_start: "2024-01-15",
      period_end: "2024-01-20",
      message: "指定期間内のソースデータが確認されました",
    });
  });

  // SCEN-1199: エラー境界 - 空配列
  test("ソースデータ配列が空の場合、エラーが発生する", () => {
    const input = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      customer_id: "CUST001",
      source_data: [],
    };

    expect(() => validateReportSourceDataExists(input)).toThrow(
      /対象期間のソースデータが見つかりません/
    );
  });

  // SCEN-1199: エラー境界 - 無効な日付形式
  test("無効な日付形式が指定された場合、エラーが発生する", () => {
    const input = {
      start_date: "2024/01/01",
      end_date: "2024/01/31",
      customer_id: "CUST001",
      source_data: [
        {
          id: "DATA001",
          customer_id: "CUST001",
          activity_date: "2024-01-15",
          activity_type: "appointment",
          count: 5,
        },
      ],
    };

    expect(() => validateReportSourceDataExists(input)).toThrow(/日付形式/);
  });

  // SCEN-1199: エラー境界 - 開始日が終了日より後
  test("開始日が終了日より後の場合、エラーが発生する", () => {
    const input = {
      start_date: "2024-01-31",
      end_date: "2024-01-01",
      customer_id: "CUST001",
      source_data: [
        {
          id: "DATA001",
          customer_id: "CUST001",
          activity_date: "2024-01-15",
          activity_type: "appointment",
          count: 5,
        },
      ],
    };

    expect(() => validateReportSourceDataExists(input)).toThrow(/期間指定/);
  });
});