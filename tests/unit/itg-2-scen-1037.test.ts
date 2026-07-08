import { recordNegotiationResultsForLearning } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1037: [error] 交渉結果学習データ蓄積機能 - 交渉結果の記録操作中にシステム障害が発生した場合、部分的な蓄積は行われず全件ロールバックされる
  test("システム障害時にロールバックメカニズムが動作し、すべてのデータが蓄積されず、トランザクション前の状態に復帰する", () => {
    const negotiationResults = [
      {
        negotiation_id: "NEG20240115001",
        original_amount: 5000000,
        agreed_amount: 4800000,
        deviation_rate: 4.0,
        negotiation_reason: "市場相場より高い判断",
        agreement_date: "2024-01-15",
        recorded_by: "assessor_001",
        learning_data_type: "price_adjustment",
      },
      {
        negotiation_id: "NEG20240115002",
        original_amount: 3200000,
        agreed_amount: 3100000,
        deviation_rate: 3.125,
        negotiation_reason: "施工工期の短縮による削減",
        agreement_date: "2024-01-15",
        recorded_by: "assessor_002",
        learning_data_type: "schedule_optimization",
      },
      {
        negotiation_id: "NEG20240115003",
        original_amount: 7500000,
        agreed_amount: 7200000,
        deviation_rate: 4.0,
        negotiation_reason: "既存取引先としての交渉",
        agreement_date: "2024-01-15",
        recorded_by: "assessor_003",
        learning_data_type: "vendor_relationship",
      },
    ];

    const systemFailureConfig = {
      fail_after_record_count: 2,
      failure_type: "database_connection_lost",
      trigger_point: "mid_transaction",
    };

    const result = recordNegotiationResultsForLearning(
      negotiationResults,
      systemFailureConfig
    );

    expect(result.transaction_status).toBe("rolled_back");
    expect(result.recorded_count).toBe(0);
    expect(result.rollback_executed).toBe(true);
    expect(result.data_integrity_maintained).toBe(true);
    expect(result.database_state).toBe("pre_transaction");
    expect(result.error_log).toMatch(/ロールバック実行/);
    expect(result.error_log).toMatch(/トランザクション/);
    expect(result.recovery_status).toBe("awaiting_system_recovery");
  });
});