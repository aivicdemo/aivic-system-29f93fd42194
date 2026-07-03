import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  searchSalesActivityByOutcomeType,
  type SalesActivitySearchParams,
  type SalesActivityRecord,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業活動データ検索・抽出機能 - 成果種別フィルタ", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1155
  test("成果種別フィルタで該当データのみが素早く正確に抽出される", () => {
    // ========== Precondition: 営業データが営業システムに記録され、複数の成果種別を持つデータが存在している状態 ==========
    const test_sales_activities: SalesActivityRecord[] = [
      {
        activity_id: "ACT001",
        customer_id: "CUST001",
        outcome_type: "受注",
        activity_date: "2024-01-15",
        amount: 50000,
        status: "completed",
      },
      {
        activity_id: "ACT002",
        customer_id: "CUST002",
        outcome_type: "提案",
        activity_date: "2024-01-16",
        amount: 30000,
        status: "completed",
      },
      {
        activity_id: "ACT003",
        customer_id: "CUST001",
        outcome_type: "商談",
        activity_date: "2024-01-17",
        amount: 20000,
        status: "completed",
      },
      {
        activity_id: "ACT004",
        customer_id: "CUST003",
        outcome_type: "受注",
        activity_date: "2024-01-18",
        amount: 75000,
        status: "completed",
      },
      {
        activity_id: "ACT005",
        customer_id: "CUST002",
        outcome_type: "商談",
        activity_date: "2024-01-19",
        amount: 15000,
        status: "completed",
      },
    ];

    // ========== Trigger: 営業担当者が成果種別フィルタで「受注」を選択し、検索・抽出を実行した ==========
    const search_params_single: SalesActivitySearchParams = {
      outcome_type: "受注",
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    };

    const start_time_single = Date.now();
    const result_single = searchSalesActivityByOutcomeType(
      test_sales_activities,
      search_params_single
    );
    const response_time_single = Date.now() - start_time_single;

    // ========== Outcome: 成果種別「受注」に該当するデータのみが素早く正確に抽出されている ==========
    // 期待: 受注データは ACT001 (50000), ACT004 (75000) の2件
    expect(result_single).toHaveLength(2);
    expect(result_single.every((rec) => rec.outcome_type === "受注")).toBe(
      true
    );

    const extracted_activity_ids = result_single.map((r) => r.activity_id);
    expect(extracted_activity_ids).toEqual(["ACT001", "ACT004"]);

    const extracted_amounts = result_single.map((r) => r.amount);
    expect(extracted_amounts).toEqual([50000, 75000]);

    // 応答時間が1秒以内であることを確認
    expect(response_time_single).toBeLessThan(1000);

    // ========== Trigger: 複数の成果種別「受注」と「商談」を組み合わせて検索・抽出を実行した ==========
    const search_params_multiple: SalesActivitySearchParams = {
      outcome_types: ["受注", "商談"],
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    };

    const start_time_multiple = Date.now();
    const result_multiple = searchSalesActivityByOutcomeType(
      test_sales_activities,
      search_params_multiple
    );
    const response_time_multiple = Date.now() - start_time_multiple;

    // ========== Outcome: 複数条件「受注」「商談」に該当するデータのみが正確に抽出されている ==========
    // 期待: 受注+商談データは ACT001, ACT003, ACT004, ACT005 の4件
    expect(result_multiple).toHaveLength(4);
    expect(
      result_multiple.every((rec) =>
        ["受注", "商談"].includes(rec.outcome_type)
      )
    ).toBe(true);

    const extracted_activity_ids_multiple = result_multiple.map(
      (r) => r.activity_id
    );
    expect(extracted_activity_ids_multiple).toEqual([
      "ACT001",
      "ACT003",
      "ACT004",
      "ACT005",
    ]);

    // 複数条件での応答時間も1秒以内であることを確認
    expect(response_time_multiple).toBeLessThan(1000);

    // 複数条件での応答速度が単一条件と同等以上であることを確認（性能維持）
    expect(response_time_multiple).toBeLessThanOrEqual(
      response_time_single + 100
    );

    // ========== Outcome: 成果種別「提案」のみの検索でも正確に抽出される ==========
    const search_params_proposal: SalesActivitySearchParams = {
      outcome_type: "提案",
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    };

    const result_proposal = searchSalesActivityByOutcomeType(
      test_sales_activities,
      search_params_proposal
    );

    // 期待: 提案データは ACT002 の1件
    expect(result_proposal).toHaveLength(1);
    expect(result_proposal[0].activity_id).toBe("ACT002");
    expect(result_proposal[0].outcome_type).toBe("提案");
    expect(result_proposal[0].amount).toBe(30000);

    // ========== Outcome: 存在しない成果種別を検索すると空配列が返される ==========
    const search_params_nonexistent: SalesActivitySearchParams = {
      outcome_type: "その他",
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    };

    const result_nonexistent = searchSalesActivityByOutcomeType(
      test_sales_activities,
      search_params_nonexistent
    );

    expect(result_nonexistent).toHaveLength(0);
    expect(result_nonexistent).toEqual([]);

    // ========== Outcome: 日付範囲外のデータは除外される ==========
    const search_params_date_range: SalesActivitySearchParams = {
      outcome_type: "受注",
      start_date: "2024-01-18",
      end_date: "2024-01-31",
    };

    const result_date_range = searchSalesActivityByOutcomeType(
      test_sales_activities,
      search_params_date_range
    );

    // 期待: 日付範囲内の受注データは ACT004 のみ
    expect(result_date_range).toHaveLength(1);
    expect(result_date_range[0].activity_id).toBe("ACT004");
    expect(result_date_range[0].activity_date).toBe("2024-01-18");

    // ========== Outcome: 空のデータセットを渡すと空配列が返される ==========
    const empty_activities: SalesActivityRecord[] = [];
    const result_empty = searchSalesActivityByOutcomeType(empty_activities, {
      outcome_type: "受注",
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    });

    expect(result_empty).toHaveLength(0);
    expect(result_empty).toEqual([]);
  });
});