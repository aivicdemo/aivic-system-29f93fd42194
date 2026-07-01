import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { structureVerificationReferenceMaterials } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ検証結果根拠資料構造化機能", () => {
  // SCEN-1206: [normal] 検証結果根拠資料構造化機能 - 検証結果『要確認』の場合、参照すべき契約書・提案資料・営業活動記録が優先度順に構造化される
  test("検証結果が『要確認』の場合、参照資料が優先度順（契約書 > 提案資料 > 営業活動記録）に構造化される", () => {
    // Arrange
    const input = {
      verification_status: "要確認",
      contract_id: "CTR-001",
      proposal_id: "PRP-001",
      business_activity_id: "BIZ-001",
      customer_id: "CUST-001",
      service_id: "SVC-001",
    };

    const contractData = {
      contract_id: "CTR-001",
      contract_name: "基本契約書 2024年度版",
      contract_type: "基本契約",
      reference_url: "https://system.example.com/contracts/CTR-001",
      last_updated: "2024-01-15T10:30:00Z",
      priority_level: 1,
      material_type: "contract",
    };

    const proposalData = {
      proposal_id: "PRP-001",
      proposal_name: "営業提案資料 Q1キャンペーン",
      proposal_type: "提案資料",
      reference_url: "https://system.example.com/proposals/PRP-001",
      last_updated: "2024-01-20T14:15:00Z",
      priority_level: 2,
      material_type: "proposal",
    };

    const businessActivityData = {
      business_activity_id: "BIZ-001",
      activity_date: "2024-01-18T09:00:00Z",
      activity_type: "訪問",
      summary: "顧客との契約内容確認ミーティング",
      reference_url: "https://system.example.com/activities/BIZ-001",
      priority_level: 3,
      material_type: "activity",
    };

    // Act
    const result = structureVerificationReferenceMaterials({
      verification_status: input.verification_status,
      contract_id: input.contract_id,
      proposal_id: input.proposal_id,
      business_activity_id: input.business_activity_id,
      customer_id: input.customer_id,
      service_id: input.service_id,
      contract_data: contractData,
      proposal_data: proposalData,
      business_activity_data: businessActivityData,
    });

    // Assert
    expect(result).toEqual({
      verification_status: "要確認",
      structured_materials: [
        {
          rank: 1,
          material_type: "contract",
          priority_level: 1,
          name: "基本契約書 2024年度版",
          material_id: "CTR-001",
          reference_url: "https://system.example.com/contracts/CTR-001",
          last_updated: "2024-01-15T10:30:00Z",
          description: "基本契約",
        },
        {
          rank: 2,
          material_type: "proposal",
          priority_level: 2,
          name: "営業提案資料 Q1キャンペーン",
          material_id: "PRP-001",
          reference_url: "https://system.example.com/proposals/PRP-001",
          last_updated: "2024-01-20T14:15:00Z",
          description: "提案資料",
        },
        {
          rank: 3,
          material_type: "activity",
          priority_level: 3,
          name: "顧客との契約内容確認ミーティング",
          material_id: "BIZ-001",
          reference_url: "https://system.example.com/activities/BIZ-001",
          last_updated: "2024-01-18T09:00:00Z",
          description: "訪問",
        },
      ],
      total_materials: 3,
      display_order: "priority_descending",
      customer_id: "CUST-001",
      service_id: "SVC-001",
    });

    // Assert: 優先度が最も高い資料が最上部に配置されていることを確認
    expect(result.structured_materials[0].rank).toBe(1);
    expect(result.structured_materials[0].priority_level).toBe(1);
    expect(result.structured_materials[0].material_type).toBe("contract");

    // Assert: 提案資料が中優先度で配置されていることを確認
    expect(result.structured_materials[1].rank).toBe(2);
    expect(result.structured_materials[1].priority_level).toBe(2);
    expect(result.structured_materials[1].material_type).toBe("proposal");

    // Assert: 営業活動記録が低優先度で配置されていることを確認
    expect(result.structured_materials[2].rank).toBe(3);
    expect(result.structured_materials[2].priority_level).toBe(3);
    expect(result.structured_materials[2].material_type).toBe("activity");

    // Assert: 各資料の詳細情報が正しく表示されていることを検証
    expect(result.structured_materials[0].name).toBe("基本契約書 2024年度版");
    expect(result.structured_materials[0].reference_url).toBe(
      "https://system.example.com/contracts/CTR-001"
    );
    expect(result.structured_materials[0].material_id).toBe("CTR-001");

    expect(result.structured_materials[1].name).toBe(
      "営業提案資料 Q1キャンペーン"
    );
    expect(result.structured_materials[1].reference_url).toBe(
      "https://system.example.com/proposals/PRP-001"
    );
    expect(result.structured_materials[1].material_id).toBe("PRP-001");

    expect(result.structured_materials[2].name).toBe(
      "顧客との契約内容確認ミーティング"
    );
    expect(result.structured_materials[2].reference_url).toBe(
      "https://system.example.com/activities/BIZ-001"
    );
    expect(result.structured_materials[2].material_id).toBe("BIZ-001");

    // Assert: 構造化されたデータの総数が正確であることを確認
    expect(result.total_materials).toBe(3);

    // Assert: 表示順序が優先度降順であることを確認
    expect(result.display_order).toBe("priority_descending");
  });
});