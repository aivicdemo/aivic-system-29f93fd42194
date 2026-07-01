import { describe, test, expect } from "@jest/globals";
import {
  routeConsultationByPriority,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-825: 相談内容の優先度ベース自動ルーティング機能", () => {
    // 高優先度の相談内容: 即時対応が必要
    const high_priority_consultation = {
      consultation_id: "CONS-2024-001",
      customer_id: "CUST-A001",
      title: "契約変更に伴う請求額の緊急確認",
      description: "月次請求額が前月比50%増加している。契約内容の確認が必要。",
      priority_level: "high",
      requires_representative_review: true,
      submitted_at: new Date("2024-02-15T09:30:00Z"),
      created_by: "sales_staff_001",
    };

    // 高優先度: 代表へ即座にルーティング、対応期限1営業日
    const high_result = routeConsultationByPriority(high_priority_consultation);
    expect(high_result).toEqual({
      consultation_id: "CONS-2024-001",
      routing_destination: "representative",
      priority_level: "high",
      response_deadline_business_days: 1,
      routed_at: expect.any(Date),
      routing_status: "routed",
      assigned_to_representative: true,
    });

    // 中優先度の相談内容: 1営業日以内の確認が必要
    const medium_priority_consultation = {
      consultation_id: "CONS-2024-002",
      customer_id: "CUST-B002",
      title: "営業成果レポートの数値確認",
      description: "先月のアポ数集計について、営業担当者の報告と異なる数値が記載されている。",
      priority_level: "medium",
      requires_representative_review: true,
      submitted_at: new Date("2024-02-15T10:00:00Z"),
      created_by: "sales_staff_002",
    };

    const medium_result = routeConsultationByPriority(
      medium_priority_consultation
    );
    expect(medium_result).toEqual({
      consultation_id: "CONS-2024-002",
      routing_destination: "data_quality_team",
      priority_level: "medium",
      response_deadline_business_days: 1,
      routed_at: expect.any(Date),
      routing_status: "routed",
      assigned_to_representative: false,
    });

    // 低優先度の相談内容: 3営業日以内の確認が可能
    const low_priority_consultation = {
      consultation_id: "CONS-2024-003",
      customer_id: "CUST-C003",
      title: "過去月のレポートフォーマット確認",
      description: "3ヶ月前のレポートについて、項目の配置順序に関する質問。",
      priority_level: "low",
      requires_representative_review: true,
      submitted_at: new Date("2024-02-15T11:00:00Z"),
      created_by: "sales_staff_003",
    };

    const low_result = routeConsultationByPriority(low_priority_consultation);
    expect(low_result).toEqual({
      consultation_id: "CONS-2024-003",
      routing_destination: "support_team",
      priority_level: "low",
      response_deadline_business_days: 3,
      routed_at: expect.any(Date),
      routing_status: "routed",
      assigned_to_representative: false,
    });

    // ルーティング履歴が記録されていることを検証
    expect(high_result.routed_at).toBeInstanceOf(Date);
    expect(medium_result.routed_at).toBeInstanceOf(Date);
    expect(low_result.routed_at).toBeInstanceOf(Date);

    // ルーティング先が優先度に基づいて正しく割り当てられていることを検証
    expect(high_result.routing_destination).toBe("representative");
    expect(medium_result.routing_destination).toBe("data_quality_team");
    expect(low_result.routing_destination).toBe("support_team");

    // 対応期限が優先度に基づいて正しく設定されていることを検証
    expect(high_result.response_deadline_business_days).toBe(1);
    expect(medium_result.response_deadline_business_days).toBe(1);
    expect(low_result.response_deadline_business_days).toBe(3);

    // ルーティング成功ステータスを検証
    expect(high_result.routing_status).toBe("routed");
    expect(medium_result.routing_status).toBe("routed");
    expect(low_result.routing_status).toBe("routed");

    // 代表へのルーティング判定を検証
    expect(high_result.assigned_to_representative).toBe(true);
    expect(medium_result.assigned_to_representative).toBe(false);
    expect(low_result.assigned_to_representative).toBe(false);

    // エラーケース: 必須フィールド欠落
    const invalid_consultation = {
      consultation_id: "CONS-2024-004",
      customer_id: "CUST-D004",
      title: "テスト相談",
      description: "",
      // priority_levelが欠落
      requires_representative_review: true,
      submitted_at: new Date("2024-02-15T12:00:00Z"),
      created_by: "sales_staff_004",
    };

    expect(() => routeConsultationByPriority(invalid_consultation as any)).toThrow(
      /優先度レベル/
    );

    // エラーケース: 不正な優先度レベル
    const invalid_priority_consultation = {
      consultation_id: "CONS-2024-005",
      customer_id: "CUST-E005",
      title: "テスト相談",
      description: "テスト説明",
      priority_level: "urgent", // 不正な値
      requires_representative_review: true,
      submitted_at: new Date("2024-02-15T13:00:00Z"),
      created_by: "sales_staff_005",
    };

    expect(() =>
      routeConsultationByPriority(invalid_priority_consultation as any)
    ).toThrow(/優先度レベル/);

    // エラーケース: consultation_idが空文字列
    const empty_id_consultation = {
      consultation_id: "",
      customer_id: "CUST-F006",
      title: "テスト相談",
      description: "テスト説明",
      priority_level: "high",
      requires_representative_review: true,
      submitted_at: new Date("2024-02-15T14:00:00Z"),
      created_by: "sales_staff_006",
    };

    expect(() =>
      routeConsultationByPriority(empty_id_consultation as any)
    ).toThrow(/相談ID/);
  });
});