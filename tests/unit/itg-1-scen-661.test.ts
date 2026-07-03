import {
  extractBillingItemsByCustomerService,
  AggregationResult,
  AggregationParams,
} from "../../src/logic/it-1-2-1";

describe("顧客・サービス別請求額集計機能", () => {
  test("SCEN-661: 集計対象データが存在しない場合、空の集計結果が適切に返される", () => {
    // Arrange: 集計対象期間を指定（2024年1月1日～2024年1月31日）
    const aggregation_params: AggregationParams = {
      period_start: new Date("2024-01-01T00:00:00Z"),
      period_end: new Date("2024-01-31T23:59:59Z"),
      customer_id_list: [],
      service_id_list: [],
      include_metadata: true,
    };

    // Act: 顧客・サービス別集計ルール検証機能を実行
    // 集計対象となるデータが存在しない状態で実行
    const result: AggregationResult =
      extractBillingItemsByCustomerService(aggregation_params);

    // Assert: 返却される集計結果のデータ構造を検証
    // 集計結果が空であることを確認
    expect(result.aggregation_records).toEqual([]);
    expect(result.aggregation_records.length).toBe(0);

    // メタデータが正しく格納されていることを確認
    expect(result.metadata).toBeDefined();
    expect(result.metadata.aggregation_period_start).toEqual(
      new Date("2024-01-01T00:00:00Z")
    );
    expect(result.metadata.aggregation_period_end).toEqual(
      new Date("2024-01-31T23:59:59Z")
    );
    expect(result.metadata.target_record_count).toBe(0);
    expect(result.metadata.aggregation_timestamp).toBeDefined();

    // エラーログやエラーメッセージが出力されていないことを確認
    expect(result.error_log).toEqual([]);
    expect(result.has_error).toBe(false);

    // 集計結果が正常に処理されたことを示すステータスコードを確認
    expect(result.status_code).toBe(200);
    expect(result.status_message).toBe("成功");
  });
});