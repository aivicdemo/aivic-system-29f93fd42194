import { describe, test, expect } from '@jest/globals';
import { aggregateCustomerServiceMetrics } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 顧客別成果指標集計ロジック検証', () => {
  // SCEN-1139: [edge] 顧客別成果指標集計ロジック検証 - 複数のサービス契約を持つ顧客の場合、各サービスごとの集計ルール分岐が正確に適用される
  test('should correctly apply separate aggregation rules for each service and prevent cross-service interference', () => {
    // Arrange: テスト用データベースに複数のサービス契約を持つ顧客レコードを登録
    const customer_id = 'CUST-001';
    
    // サービスAの契約と集計ルール（例：アポ数×単価1000円）
    const service_a_contract = {
      customer_id: customer_id,
      service_id: 'SVC-A',
      service_name: 'Service A',
      aggregation_rule: 'apo_count * 1000',
      discount_rate: 0,
    };
    
    // サービスBの契約と集計ルール（例：成約数×単価5000円）
    const service_b_contract = {
      customer_id: customer_id,
      service_id: 'SVC-B',
      service_name: 'Service B',
      aggregation_rule: 'deal_count * 5000',
      discount_rate: 0,
    };
    
    // サービスCの契約と集計ルール（例：（アポ数×500 + 成約数×2000）×0.9割引）
    const service_c_contract = {
      customer_id: customer_id,
      service_id: 'SVC-C',
      service_name: 'Service C',
      aggregation_rule: '(apo_count * 500 + deal_count * 2000) * 0.9',
      discount_rate: 0.1,
    };
    
    // 営業成果データ（月次集計）
    const monthly_performance_data = {
      customer_id: customer_id,
      apo_count: 10,
      deal_count: 3,
      customer_response_score: 85,
    };
    
    // Act: 顧客別成果指標集計ロジックの集計処理を実行
    const result = aggregateCustomerServiceMetrics({
      customer_id: customer_id,
      service_contracts: [service_a_contract, service_b_contract, service_c_contract],
      monthly_performance: monthly_performance_data,
    });

    // Assert: サービスA用の集計ルール（ルールA）が正確に適用されて計算結果が得られることを検証
    // 期待値: アポ数10 × 単価1000 = 10000円
    expect(result.service_metrics).toHaveLength(3);
    
    const service_a_metric = result.service_metrics.find(m => m.service_id === 'SVC-A');
    expect(service_a_metric).toBeDefined();
    expect(service_a_metric?.billing_amount).toBe(10000);
    expect(service_a_metric?.apo_count).toBe(10);
    expect(service_a_metric?.deal_count).toBe(3);

    // Assert: サービスB用の集計ルール（ルールB）が正確に適用されて計算結果が得られることを検証
    // 期待値: 成約数3 × 単価5000 = 15000円
    const service_b_metric = result.service_metrics.find(m => m.service_id === 'SVC-B');
    expect(service_b_metric).toBeDefined();
    expect(service_b_metric?.billing_amount).toBe(15000);
    expect(service_b_metric?.apo_count).toBe(10);
    expect(service_b_metric?.deal_count).toBe(3);

    // Assert: サービスC用の集計ルール（ルールC）が正確に適用されて計算結果が得られることを検証
    // 期待値: (アポ数10 × 500 + 成約数3 × 2000) × 0.9 = (5000 + 6000) × 0.9 = 9900円
    const service_c_metric = result.service_metrics.find(m => m.service_id === 'SVC-C');
    expect(service_c_metric).toBeDefined();
    expect(service_c_metric?.billing_amount).toBe(9900);
    expect(service_c_metric?.apo_count).toBe(10);
    expect(service_c_metric?.deal_count).toBe(3);

    // Assert: 各サービスの成果指標が正しく分離されて集計されていることを確認
    expect(service_a_metric?.service_id).toBe('SVC-A');
    expect(service_b_metric?.service_id).toBe('SVC-B');
    expect(service_c_metric?.service_id).toBe('SVC-C');

    // Assert: 顧客全体の集計結果が各サービス別の集計結果の合算となっていることを検証
    // 期待値: 10000 + 15000 + 9900 = 34900円
    expect(result.total_billing_amount).toBe(34900);
    expect(result.customer_id).toBe(customer_id);

    // Assert: ルール分岐がサービス間で相互干渉していないことを確認（混在や誤適用がないこと）
    expect(result.service_metrics.every(m => m.customer_id === customer_id)).toBe(true);
    expect(result.service_metrics[0].service_id).not.toBe(result.service_metrics[1].service_id);
    expect(result.service_metrics[1].service_id).not.toBe(result.service_metrics[2].service_id);
    
    // Assert: 各サービス間で計算ルールが独立していることを検証
    // サービスAは 10 × 1000 = 10000
    // サービスBは 3 × 5000 = 15000（サービスAの計算ルールが適用されていない）
    // サービスCは (10 × 500 + 3 × 2000) × 0.9 = 9900（割引適用）
    expect(service_a_metric?.billing_amount).not.toBe(service_b_metric?.billing_amount);
    expect(service_b_metric?.billing_amount).not.toBe(service_c_metric?.billing_amount);
    expect(service_a_metric?.billing_amount).not.toBe(service_c_metric?.billing_amount);

    // Assert: 合計が各要素の和であることを確認
    const sum_of_services = (service_a_metric?.billing_amount ?? 0) + 
                            (service_b_metric?.billing_amount ?? 0) + 
                            (service_c_metric?.billing_amount ?? 0);
    expect(result.total_billing_amount).toBe(sum_of_services);
  });
});