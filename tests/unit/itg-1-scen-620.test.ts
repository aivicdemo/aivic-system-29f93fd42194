import { describe, test, expect, beforeEach } from "@jest/globals";
import { branching_objection_handling_by_deadline } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-620: [edge] 異議対応ルート分岐 - 確認期限超過後の異議申し立てが適切にハンドリングされる
  test("確認期限超過後の異議申し立てが期限超過ケースとして適切に識別され、異なる処理ルートに振り分けられ、対応ステータスと監査ログが正確に記録される", () => {
    // 確認期限を過去の日付に設定した請求レコード（期限超過）
    const billing_record_expired = {
      billing_id: "BILL-20240115-001",
      customer_id: "CUST-A001",
      billing_amount: 500000,
      confirmation_deadline: new Date("2024-01-10T23:59:59Z"),
      confirmation_status: "pending",
      objection_route: null,
      audit_log: []
    };

    // 期限内の請求レコード（参照用）
    const billing_record_valid = {
      billing_id: "BILL-20240120-002",
      customer_id: "CUST-B002",
      billing_amount: 300000,
      confirmation_deadline: new Date("2024-02-10T23:59:59Z"),
      confirmation_status: "pending",
      objection_route: null,
      audit_log: []
    };

    // テスト実行日時（期限超過を判定するための基準時刻）
    const current_time = new Date("2024-01-15T10:00:00Z");

    // 期限超過後に異議申し立てを実行
    const objection_data_expired = {
      objection_id: "OBJ-20240115-001",
      billing_id: billing_record_expired.billing_id,
      objection_type: "price_dispute",
      objection_reason: "請求額が契約条件に合致していない",
      objection_timestamp: current_time,
      requester_id: "RESP-A001",
      supporting_docs: ["contract_doc_001.pdf", "receipt_001.pdf"]
    };

    // 期限内に異議申し立てを実行（参照用）
    const objection_data_valid = {
      objection_id: "OBJ-20240115-002",
      billing_id: billing_record_valid.billing_id,
      objection_type: "delivery_delay",
      objection_reason: "成果物納期の遅延",
      objection_timestamp: current_time,
      requester_id: "RESP-B002",
      supporting_docs: ["timeline_doc_001.pdf"]
    };

    // 期限超過ケースの分岐ロジック実行
    const result_expired = branching_objection_handling_by_deadline({
      billing_record: billing_record_expired,
      objection_data: objection_data_expired,
      current_time: current_time
    });

    // 期限内ケースの分岐ロジック実行（参照用）
    const result_valid = branching_objection_handling_by_deadline({
      billing_record: billing_record_valid,
      objection_data: objection_data_valid,
      current_time: current_time
    });

    // 【期限超過ケースの検証】
    // 期限超過ケースとして適切に識別されているか確認
    expect(result_expired.is_deadline_exceeded).toBe(true);

    // 期限内申し立てとは異なる処理ルートに振り分けられているか確認
    expect(result_expired.routing_path).toBe("deadline_exceeded");

    // 対応ステータスが期限超過として記録されているか確認
    expect(result_expired.objection_status).toBe("rejected_deadline_exceeded");

    // 異議レコードのステータスが期限超過を示す値で記録されているか確認
    expect(result_expired.recorded_objection.status).toBe("expired");

    // 監査ログエントリが正確に記録されているか確認
    expect(result_expired.recorded_objection.audit_log).toHaveLength(1);
    expect(result_expired.recorded_objection.audit_log[0].event_type).toBe("objection_rejected_deadline_exceeded");
    expect(result_expired.recorded_objection.audit_log[0].timestamp).toEqual(current_time);
    expect(result_expired.recorded_objection.audit_log[0].reason).toBe("確認期限を超過した異議申し立てのため不受理");
    expect(result_expired.recorded_objection.audit_log[0].recorded_by).toBe("SYSTEM");

    // 期限超過異議の対応フロー分岐が「拒否」で確定しているか確認
    expect(result_expired.response_action).toBe("reject");
    expect(result_expired.escalation_required).toBe(false);

    // 【期限内ケースの検証】
    // 期限内申し立てが期限超過と判定されていないか確認
    expect(result_valid.is_deadline_exceeded).toBe(false);

    // 期限内申し立てが異なる処理ルート（通常フロー）に振り分けられているか確認
    expect(result_valid.routing_path).toBe("normal_routing");

    // 期限内申し立てのステータスが異なる値で記録されているか確認
    expect(result_valid.objection_status).toBe("pending_review");

    // 期限内異議レコードのステータスが「受理」で記録されているか確認
    expect(result_valid.recorded_objection.status).toBe("accepted");

    // 期限内異議の監査ログが異なるイベントタイプで記録されているか確認
    expect(result_valid.recorded_objection.audit_log).toHaveLength(1);
    expect(result_valid.recorded_objection.audit_log[0].event_type).toBe("objection_accepted");
    expect(result_valid.recorded_objection.audit_log[0].reason).toBe("確認期限内の異議申し立てのため受理");

    // 期限内異議の対応フロー分岐が「通常レビュー」で確定しているか確認
    expect(result_valid.response_action).toBe("review");
    expect(result_valid.escalation_required).toBe(false);

    // 【境界値テスト】確認期限と異議申し立て時刻が同一の場合
    const billing_record_boundary = {
      billing_id: "BILL-20240110-003",
      customer_id: "CUST-C003",
      billing_amount: 250000,
      confirmation_deadline: new Date("2024-01-15T10:00:00Z"),
      confirmation_status: "pending",
      objection_route: null,
      audit_log: []
    };

    const objection_data_boundary = {
      objection_id: "OBJ-20240115-003",
      billing_id: billing_record_boundary.billing_id,
      objection_type: "amount_discrepancy",
      objection_reason: "請求額の計算に誤りがある可能性",
      objection_timestamp: new Date("2024-01-15T10:00:00Z"),
      requester_id: "RESP-C003",
      supporting_docs: ["calculation_sheet_001.pdf"]
    };

    const result_boundary = branching_objection_handling_by_deadline({
      billing_record: billing_record_boundary,
      objection_data: objection_data_boundary,
      current_time: new Date("2024-01-15T10:00:01Z")
    });

    // 1秒の差で期限超過と判定されるか確認
    expect(result_boundary.is_deadline_exceeded).toBe(true);
    expect(result_boundary.objection_status).toBe("rejected_deadline_exceeded");

    // 【エラーケース検証】必須フィールドが欠落している場合
    expect(() =>
      branching_objection_handling_by_deadline({
        billing_record: null as any,
        objection_data: objection_data_expired,
        current_time: current_time
      })
    ).toThrow(/請求レコード/);

    expect(() =>
      branching_objection_handling_by_deadline({
        billing_record: billing_record_expired,
        objection_data: null as any,
        current_time: current_time
      })
    ).toThrow(/異議申立/);

    expect(() =>
      branching_objection_handling_by_deadline({
        billing_record: billing_record_expired,
        objection_data: objection_data_expired,
        current_time: null as any
      })
    ).toThrow(/基準時刻/);

    // 【確認期限フィールド欠落エラー】
    expect(() =>
      branching_objection_handling_by_deadline({
        billing_record: {
          ...billing_record_expired,
          confirmation_deadline: null as any
        },
        objection_data: objection_data_expired,
        current_time: current_time
      })
    ).toThrow(/期限/);

    // 【請求IDとビリング記録のIDが不一致の場合】
    expect(() =>
      branching_objection_handling_by_deadline({
        billing_record: {
          ...billing_record_expired,
          billing_id: "BILL-MISMATCH-001"
        },
        objection_data: objection_data_expired,
        current_time: current_time
      })
    ).toThrow(/一致/);
  });
});