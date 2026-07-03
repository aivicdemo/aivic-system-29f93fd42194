import { describe, test, expect } from "@jest/globals";
import { structureVerificationResultsAndEvidence } from "../../src/logic/it-1781935279444-2-2-1";

describe("検証結果と根拠資料の構造化整理機能", () => {
  test("SCEN-1181: 複数の根拠資料が存在する場合、全て漏れなく構造化される", () => {
    // テストデータ: 5件以上の異なるタイプの根拠資料を含む検証結果
    const verification_result_id = "VR-001";
    const verification_completed_at = new Date("2024-01-15T11:00:00Z");
    const verification_status = "completed";
    const total_issues = 3;

    const evidence_materials = [
      {
        evidence_id: "EV-001",
        evidence_type: "contract",
        file_name: "contract_20240101.pdf",
        reference_id: "CTR-2024-001",
        created_at: new Date("2024-01-01T09:00:00Z"),
        mime_type: "application/pdf",
        file_size: 512000,
      },
      {
        evidence_id: "EV-002",
        evidence_type: "invoice",
        file_name: "invoice_20240110.xlsx",
        reference_id: "INV-2024-001",
        created_at: new Date("2024-01-10T10:30:00Z"),
        mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        file_size: 256000,
      },
      {
        evidence_id: "EV-003",
        evidence_type: "delivery_note",
        file_name: "delivery_20240112.pdf",
        reference_id: "DEL-2024-001",
        created_at: new Date("2024-01-12T14:15:00Z"),
        mime_type: "application/pdf",
        file_size: 384000,
      },
      {
        evidence_id: "EV-004",
        evidence_type: "receipt",
        file_name: "receipt_20240113.pdf",
        reference_id: "RCP-2024-001",
        created_at: new Date("2024-01-13T16:45:00Z"),
        mime_type: "application/pdf",
        file_size: 204800,
      },
      {
        evidence_id: "EV-005",
        evidence_type: "email",
        file_name: "email_exchange_20240114.eml",
        reference_id: "EMAIL-2024-001",
        created_at: new Date("2024-01-14T08:20:00Z"),
        mime_type: "message/rfc822",
        file_size: 102400,
      },
      {
        evidence_id: "EV-006",
        evidence_type: "contract",
        file_name: "amendment_20240115.pdf",
        reference_id: "CTR-2024-002",
        created_at: new Date("2024-01-15T09:30:00Z"),
        mime_type: "application/pdf",
        file_size: 307200,
      },
    ];

    // 構造化整理機能を実行
    const structured_result = structureVerificationResultsAndEvidence({
      verification_result_id: verification_result_id,
      verification_completed_at: verification_completed_at,
      verification_status: verification_status,
      total_issues: total_issues,
      evidence_materials: evidence_materials,
    });

    // 期待値: 入力件数と出力件数の一致確認
    expect(structured_result.evidence_materials.length).toBe(6);

    // 入力データの件数と戻り値の件数が完全に一致
    expect(structured_result.evidence_materials.length).toBe(
      evidence_materials.length
    );

    // 各根拠資料のメタデータが正確に構造化されていることを確認
    for (let i = 0; i < structured_result.evidence_materials.length; i++) {
      const original = evidence_materials[i];
      const structured = structured_result.evidence_materials[i];

      expect(structured.evidence_id).toBe(original.evidence_id);
      expect(structured.evidence_type).toBe(original.evidence_type);
      expect(structured.file_name).toBe(original.file_name);
      expect(structured.reference_id).toBe(original.reference_id);
      expect(structured.created_at).toBe(original.created_at.toISOString());
      expect(structured.mime_type).toBe(original.mime_type);
      expect(structured.file_size).toBe(original.file_size);
    }

    // 配列順序が入力順序と一致していることを確認
    for (let i = 0; i < structured_result.evidence_materials.length; i++) {
      expect(structured_result.evidence_materials[i].evidence_id).toBe(
        evidence_materials[i].evidence_id
      );
    }

    // 重複する根拠資料がないことを確認
    const evidence_ids = structured_result.evidence_materials.map(
      (item: any) => item.evidence_id
    );
    const unique_evidence_ids = new Set(evidence_ids);
    expect(unique_evidence_ids.size).toBe(evidence_ids.length);

    // null値やundefinedが含まれていないことを確認
    for (const item of structured_result.evidence_materials) {
      expect(item.evidence_id).not.toBeNull();
      expect(item.evidence_id).not.toBeUndefined();
      expect(item.evidence_type).not.toBeNull();
      expect(item.evidence_type).not.toBeUndefined();
      expect(item.file_name).not.toBeNull();
      expect(item.file_name).not.toBeUndefined();
      expect(item.reference_id).not.toBeNull();
      expect(item.reference_id).not.toBeUndefined();
      expect(item.created_at).not.toBeNull();
      expect(item.created_at).not.toBeUndefined();
      expect(item.mime_type).not.toBeNull();
      expect(item.mime_type).not.toBeUndefined();
      expect(item.file_size).not.toBeNull();
      expect(item.file_size).not.toBeUndefined();
    }

    // 検証結果の親要素も正しく構造化されていることを確認
    expect(structured_result.verification_result_id).toBe(
      verification_result_id
    );
    expect(structured_result.verification_completed_at).toBe(
      verification_completed_at.toISOString()
    );
    expect(structured_result.verification_status).toBe(verification_status);
    expect(structured_result.total_issues).toBe(total_issues);
  });
});