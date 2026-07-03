import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import {
  structureValidationResultsWithEvidence,
} from "../../src/logic/it-1781935279444-2-2-1";

fetchMock.enableMocks();

describe("営業データ品質検証 - 検証結果と根拠資料の構造化整理", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1178
  test("検証結果と複数の根拠資料が階層的・関連付け的に構造化され、画面表示・エクスポート時に構造が保持される", async () => {
    // ========== 入力準備 ==========
    const validation_result_id = "VR-20240115-001";
    const sales_activity_record_id = "SAR-2024-001";
    const contract_id = "CT-2024-001";
    const proposal_material_id = "PM-2024-001";
    const user_id = "USR-001";
    const organization_id = "ORG-001";
    const timestamp = new Date("2024-01-15T11:00:00Z").toISOString();

    // 営業活動記録
    const sales_activity_record = {
      id: sales_activity_record_id,
      customer_id: "CUST-001",
      contact_date: "2024-01-15",
      contact_type: "初回提案",
      contact_outcome: "資料配布",
      appointment_status: "未確定",
      sales_staff_id: "STAFF-001",
      notes: "顧客から好反応を得た",
      created_at: timestamp,
    };

    // 契約書
    const contract = {
      id: contract_id,
      customer_id: "CUST-001",
      contract_type: "基本契約",
      service_type: "営業代行",
      contract_amount: 500000,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      terms_and_conditions:
        "月額成功報酬型。アポ成約数×単価",
      version: "1.0",
      created_at: timestamp,
    };

    // 提案資料
    const proposal_material = {
      id: proposal_material_id,
      customer_id: "CUST-001",
      material_title: "営業代行サービス提案資料",
      material_content: "当社サービスの機能・価格・導入事例を記載",
      version: "1.0",
      created_date: "2024-01-15",
      created_at: timestamp,
    };

    // 検証ルール実行結果（事前に実行完了と仮定）
    const validation_execution_result = {
      validation_rule_id: "VR-RULE-001",
      sales_data_id: "SD-2024-001",
      execution_status: "完了",
      validation_passed: true,
      detected_issues: [],
      execution_timestamp: timestamp,
    };

    // 検証エラー（なし想定：正常系）
    const validation_errors = [];

    // ========== API モック設定 ==========
    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: sales_activity_record_id,
        ...sales_activity_record,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: contract_id,
        ...contract,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: proposal_material_id,
        ...proposal_material,
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        validation_result_id: validation_result_id,
        sales_activity_record_id: sales_activity_record_id,
        contract_id: contract_id,
        proposal_material_id: proposal_material_id,
        validation_execution_result: validation_execution_result,
        validation_errors: validation_errors,
        structured_output: {
          hierarchy_level: "root",
          validation_result: {
            id: validation_result_id,
            status: "合格",
            summary: "営業データの品質基準をすべて満たしています",
            checked_at: timestamp,
          },
          evidence_materials: [
            {
              type: "sales_activity_record",
              id: sales_activity_record_id,
              title: "営業活動記録",
              related_items: [
                {
                  field: "contact_outcome",
                  value: "資料配布",
                  validation_status: "OK",
                },
                {
                  field: "appointment_status",
                  value: "未確定",
                  validation_status: "OK",
                },
              ],
            },
            {
              type: "contract",
              id: contract_id,
              title: "契約書",
              related_items: [
                {
                  field: "contract_amount",
                  value: 500000,
                  validation_status: "OK",
                },
                {
                  field: "service_type",
                  value: "営業代行",
                  validation_status: "OK",
                },
              ],
            },
            {
              type: "proposal_material",
              id: proposal_material_id,
              title: "提案資料",
              related_items: [
                {
                  field: "material_version",
                  value: "1.0",
                  validation_status: "OK",
                },
              ],
            },
          ],
          export_status: "準備完了",
        },
      }),
      { status: 200 }
    );

    // ========== 関数実行 ==========
    const result = await structureValidationResultsWithEvidence({
      validation_result_id: validation_result_id,
      sales_activity_record_id: sales_activity_record_id,
      contract_id: contract_id,
      proposal_material_id: proposal_material_id,
      user_id: user_id,
      organization_id: organization_id,
      timestamp: timestamp,
    });

    // ========== Assertion: 構造化されたデータが正しく返される ==========
    expect(result).toBeDefined();
    expect(result.validation_result_id).toBe(validation_result_id);
    expect(result.sales_activity_record_id).toBe(sales_activity_record_id);
    expect(result.contract_id).toBe(contract_id);
    expect(result.proposal_material_id).toBe(proposal_material_id);

    // ========== Assertion: 構造化出力が階層的・関連付け的に整理されている ==========
    expect(result.structured_output).toBeDefined();
    expect(result.structured_output.hierarchy_level).toBe("root");

    // ========== Assertion: 検証結果が含まれている ==========
    expect(result.structured_output.validation_result).toBeDefined();
    expect(result.structured_output.validation_result.id).toBe(
      validation_result_id
    );
    expect(result.structured_output.validation_result.status).toBe("合格");
    expect(result.structured_output.validation_result.summary).toBe(
      "営業データの品質基準をすべて満たしています"
    );
    expect(result.structured_output.validation_result.checked_at).toBe(
      timestamp
    );

    // ========== Assertion: 根拠資料が配列で含まれている ==========
    expect(result.structured_output.evidence_materials).toBeDefined();
    expect(Array.isArray(result.structured_output.evidence_materials)).toBe(
      true
    );
    expect(result.structured_output.evidence_materials.length).toBe(3);

    // ========== Assertion: 営業活動記録が正しく紐付いている ==========
    const sales_activity_evidence =
      result.structured_output.evidence_materials[0];
    expect(sales_activity_evidence.type).toBe("sales_activity_record");
    expect(sales_activity_evidence.id).toBe(sales_activity_record_id);
    expect(sales_activity_evidence.title).toBe("営業活動記録");
    expect(Array.isArray(sales_activity_evidence.related_items)).toBe(true);
    expect(sales_activity_evidence.related_items.length).toBe(2);
    expect(sales_activity_evidence.related_items[0]).toEqual({
      field: "contact_outcome",
      value: "資料配布",
      validation_status: "OK",
    });
    expect(sales_activity_evidence.related_items[1]).toEqual({
      field: "appointment_status",
      value: "未確定",
      validation_status: "OK",
    });

    // ========== Assertion: 契約書が正しく紐付いている ==========
    const contract_evidence = result.structured_output.evidence_materials[1];
    expect(contract_evidence.type).toBe("contract");
    expect(contract_evidence.id).toBe(contract_id);
    expect(contract_evidence.title).toBe("契約書");
    expect(Array.isArray(contract_evidence.related_items)).toBe(true);
    expect(contract_evidence.related_items.length).toBe(2);
    expect(contract_evidence.related_items[0]).toEqual({
      field: "contract_amount",
      value: 500000,
      validation_status: "OK",
    });
    expect(contract_evidence.related_items[1]).toEqual({
      field: "service_type",
      value: "営業代行",
      validation_status: "OK",
    });

    // ========== Assertion: 提案資料が正しく紐付いている ==========
    const proposal_evidence = result.structured_output.evidence_materials[2];
    expect(proposal_evidence.type).toBe("proposal_material");
    expect(proposal_evidence.id).toBe(proposal_material_id);
    expect(proposal_evidence.title).toBe("提案資料");
    expect(Array.isArray(proposal_evidence.related_items)).toBe(true);
    expect(proposal_evidence.related_items.length).toBe(1);
    expect(proposal_evidence.related_items[0]).toEqual({
      field: "material_version",
      value: "1.0",
      validation_status: "OK",
    });

    // ========== Assertion: エクスポート状態が「準備完了」 ==========
    expect(result.structured_output.export_status).toBe("準備完了");

    // ========== Assertion: 検証エラーがない（正常系） ==========
    expect(result.validation_errors).toBeDefined();
    expect(Array.isArray(result.validation_errors)).toBe(true);
    expect(result.validation_errors.length).toBe(0);

    // ========== Assertion: API 呼び出し回数の確認 ==========
    expect(fetchMock.mock.calls.length).toBe(4);
  });
});