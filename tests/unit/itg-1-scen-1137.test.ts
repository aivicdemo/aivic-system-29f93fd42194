import { validateCustomerAggregation } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1137: [normal] 顧客別成果指標集計ロジック検証 - 契約内容に基づいた集計ルールが正しく適用され、顧客別の成約数・アポ数が正確に計算される
  test("契約内容に基づいた集計ルールが各顧客に対して正しく適用され、顧客別の成約数とアポ数が期待値と一致して計算されること", () => {
    const testData = {
      customers: [
        {
          customer_id: "CUST001",
          customer_name: "顧客A",
          contract_type: "成功報酬型",
          contract_period_start: "2024-01-01",
          contract_period_end: "2024-12-31",
          contract_agreement_details: {
            commission_per_deal: 50000,
            min_appointment_count: 5,
            deal_qualification: "クロージング完了"
          },
          sales_activities: [
            {
              activity_id: "ACT001",
              activity_type: "appointment",
              activity_date: "2024-02-10",
              status: "completed"
            },
            {
              activity_id: "ACT002",
              activity_type: "appointment",
              activity_date: "2024-02-15",
              status: "completed"
            },
            {
              activity_id: "ACT003",
              activity_type: "deal",
              activity_date: "2024-02-20",
              deal_status: "closed",
              deal_amount: 100000
            },
            {
              activity_id: "ACT004",
              activity_type: "appointment",
              activity_date: "2024-03-05",
              status: "completed"
            },
            {
              activity_id: "ACT005",
              activity_type: "deal",
              activity_date: "2024-03-10",
              deal_status: "closed",
              deal_amount: 150000
            }
          ]
        },
        {
          customer_id: "CUST002",
          customer_name: "顧客B",
          contract_type: "固定報酬型",
          contract_period_start: "2024-01-01",
          contract_period_end: "2024-12-31",
          contract_agreement_details: {
            fixed_monthly_fee: 100000,
            target_appointment_count: 10,
            deal_qualification: "見込み客獲得"
          },
          sales_activities: [
            {
              activity_id: "ACT006",
              activity_type: "appointment",
              activity_date: "2024-02-12",
              status: "completed"
            },
            {
              activity_id: "ACT007",
              activity_type: "appointment",
              activity_date: "2024-02-18",
              status: "completed"
            },
            {
              activity_id: "ACT008",
              activity_type: "appointment",
              activity_date: "2024-02-25",
              status: "completed"
            },
            {
              activity_id: "ACT009",
              activity_type: "deal",
              activity_date: "2024-03-01",
              deal_status: "prospect",
              deal_amount: 80000
            }
          ]
        },
        {
          customer_id: "CUST003",
          customer_name: "顧客C",
          contract_type: "成功報酬型",
          contract_period_start: "2024-03-01",
          contract_period_end: "2024-12-31",
          contract_agreement_details: {
            commission_per_deal: 75000,
            min_appointment_count: 8,
            deal_qualification: "クロージング完了"
          },
          sales_activities: [
            {
              activity_id: "ACT010",
              activity_type: "appointment",
              activity_date: "2024-03-15",
              status: "completed"
            },
            {
              activity_id: "ACT011",
              activity_type: "appointment",
              activity_date: "2024-03-20",
              status: "completed"
            }
          ]
        }
      ],
      aggregation_period_start: "2024-02-01",
      aggregation_period_end: "2024-03-31"
    };

    const result = validateCustomerAggregation(testData);

    // 顧客A: 成約数2件、アポ数3件、契約ルール適用確認
    expect(result.customers[0].customer_id).toBe("CUST001");
    expect(result.customers[0].aggregated_deal_count).toBe(2);
    expect(result.customers[0].aggregated_appointment_count).toBe(3);
    expect(result.customers[0].contract_type).toBe("成功報酬型");
    expect(result.customers[0].meets_minimum_appointment_threshold).toBe(false);
    expect(result.customers[0].calculated_commission_amount).toBe(100000);

    // 顧客B: 成約数1件（見込み客のみカウント）、アポ数3件、固定報酬適用
    expect(result.customers[1].customer_id).toBe("CUST002");
    expect(result.customers[1].aggregated_deal_count).toBe(1);
    expect(result.customers[1].aggregated_appointment_count).toBe(3);
    expect(result.customers[1].contract_type).toBe("固定報酬型");
    expect(result.customers[1].applied_fixed_fee).toBe(100000);

    // 顧客C: 集計期間内はアポ数2件、成約数0件、最小アポ数未満
    expect(result.customers[2].customer_id).toBe("CUST003");
    expect(result.customers[2].aggregated_deal_count).toBe(0);
    expect(result.customers[2].aggregated_appointment_count).toBe(2);
    expect(result.customers[2].contract_type).toBe("成功報酬型");
    expect(result.customers[2].meets_minimum_appointment_threshold).toBe(false);
    expect(result.customers[2].calculated_commission_amount).toBe(0);

    // 顧客間のデータ独立性確認
    expect(result.customers[0].aggregated_deal_count).not.toBe(
      result.customers[1].aggregated_deal_count
    );
    expect(result.customers[1].aggregated_deal_count).not.toBe(
      result.customers[2].aggregated_deal_count
    );

    // 集計期間内のデータのみ対象であることを確認
    expect(result.aggregation_period_start).toBe("2024-02-01");
    expect(result.aggregation_period_end).toBe("2024-03-31");

    // 全体集計結果の統計情報
    expect(result.total_customers_processed).toBe(3);
    expect(result.total_aggregated_deals).toBe(3);
    expect(result.total_aggregated_appointments).toBe(8);
    expect(result.validation_status).toBe("success");
  });
});