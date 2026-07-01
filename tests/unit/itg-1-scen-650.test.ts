import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  aggregateBillingByCustomerAndService,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 顧客別・サービス別請求対象抽出集計", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-650: 集計対象が1件のみの場合に単一レコード集計が正しく実行される
  test("集計対象が1件のみの請求レコードに対して、単一レコード集計を正常に実行し、すべての項目が正確に集計される", () => {
    // Arrange: テストデータ準備 - 集計対象が1件のみの請求レコード
    const input_billing_records = [
      {
        id: "billing_001",
        customer_id: "cust_001",
        service_id: "svc_001",
        amount: 50000,
        quantity: 1,
        unit_price: 50000,
        description: "営業成果報酬_成約",
        billing_date: "2024-01-15",
        status: "valid",
      },
    ];

    // Act: 顧客IDとサービスIDを指定して集計処理を実行
    const result = aggregateBillingByCustomerAndService({
      billing_records: input_billing_records,
      customer_id: "cust_001",
      service_id: "svc_001",
    });

    // Assert1: 集計処理が正常に完了し、結果オブジェクトが返される
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // Assert2: 集計結果に含まれる顧客IDが正確に反映される
    expect(result.customer_id).toBe("cust_001");

    // Assert3: 集計結果に含まれるサービスIDが正確に反映される
    expect(result.service_id).toBe("svc_001");

    // Assert4: 集計金額が正確に計算される（単一レコード: 50000）
    expect(result.total_amount).toBe(50000);

    // Assert5: 集計件数が正確に計算される（1件）
    expect(result.record_count).toBe(1);

    // Assert6: 集計対象レコードの詳細情報が保持される
    expect(result.records).toBeDefined();
    expect(result.records.length).toBe(1);
    expect(result.records[0].id).toBe("billing_001");
    expect(result.records[0].amount).toBe(50000);

    // Assert7: 集計結果にエラーフラグが存在しない（正常完了）
    expect(result.error).toBeUndefined();
    expect(result.is_valid).toBe(true);

    // Assert8: 集計結果が請求書生成に必要な最小限の情報をすべて含む
    expect(result.billing_period_start).toBeDefined();
    expect(result.billing_period_end).toBeDefined();
    expect(result.aggregation_status).toBe("completed");

    // Assert9: 単一レコード集計であることが識別できる
    expect(result.record_count).toBe(1);
    expect(Array.isArray(result.records)).toBe(true);

    // Assert10: 集計結果が請求書生成処理への遷移に適切な形式である
    expect(typeof result.total_amount).toBe("number");
    expect(typeof result.record_count).toBe("number");
    expect(result.total_amount).toBeGreaterThan(0);
  });
});