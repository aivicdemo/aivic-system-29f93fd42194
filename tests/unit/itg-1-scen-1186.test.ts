import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  saveInquiryResponseRecord,
  validateSupportingDocuments,
  retrieveInquiryResponseRecord,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1186: 複数の根拠資料（3件以上）を含む問い合わせ対応記録が正常に保存される
  test("should save inquiry response record with 4 supporting documents and verify metadata integrity", async () => {
    const inquiryResponseRecord = {
      customer_id: "CUST-001",
      customer_name: "テスト顧客A",
      inquiry_content: "請求額の計算根拠について確認したい",
      inquiry_date: new Date("2024-01-15T10:30:00Z"),
      response_date: new Date("2024-01-15T14:00:00Z"),
      responder_id: "USR-001",
      responder_name: "営業オペレーター太郎",
      response_content:
        "契約条件に基づいて計算されています。詳細は根拠資料を参照してください。",
      supporting_documents: [
        {
          doc_id: "DOC-001",
          document_type: "sales_data",
          file_name: "sales_activity_202401.csv",
          upload_date: new Date("2024-01-15T13:45:00Z"),
          file_size: 2048,
          document_content_hash: "hash_001_abc123def456",
          metadata: {
            period: "2024-01",
            record_count: 45,
            data_fields: ["customer_id", "activity_date", "achievement_type"],
          },
        },
        {
          doc_id: "DOC-002",
          document_type: "contract",
          file_name: "contract_CUST-001_v2.pdf",
          upload_date: new Date("2024-01-15T13:50:00Z"),
          file_size: 4096,
          document_content_hash: "hash_002_xyz789uvw012",
          metadata: {
            contract_version: "2",
            effective_date: "2024-01-01",
            pricing_model: "performance_based",
          },
        },
        {
          doc_id: "DOC-003",
          document_type: "calculation_sheet",
          file_name: "billing_calculation_CUST-001_202401.xlsx",
          upload_date: new Date("2024-01-15T13:55:00Z"),
          file_size: 3072,
          document_content_hash: "hash_003_pqr345stu678",
          metadata: {
            base_amount: 100000,
            discount_rate: 0.1,
            final_amount: 90000,
            calculation_method: "contract_based",
          },
        },
        {
          doc_id: "DOC-004",
          document_type: "communication_history",
          file_name: "email_thread_CUST-001_inquiry.eml",
          upload_date: new Date("2024-01-15T14:00:00Z"),
          file_size: 1536,
          document_content_hash: "hash_004_klm901nop234",
          metadata: {
            email_count: 3,
            conversation_start_date: "2024-01-15T09:00:00Z",
            conversation_end_date: "2024-01-15T14:00:00Z",
            sender_count: 2,
          },
        },
      ],
    };

    const validation_result = validateSupportingDocuments(
      inquiryResponseRecord.supporting_documents
    );
    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.document_count).toBe(4);
    expect(validation_result.meets_minimum_requirement).toBe(true);

    const saved_record = await saveInquiryResponseRecord(
      inquiryResponseRecord
    );
    expect(saved_record.record_id).toBeDefined();
    expect(saved_record.record_id).toMatch(/^REC-\d{4}-\d{6}$/);
    expect(saved_record.customer_id).toBe("CUST-001");
    expect(saved_record.customer_name).toBe("テスト顧客A");
    expect(saved_record.inquiry_content).toBe("請求額の計算根拠について確認したい");
    expect(saved_record.response_content).toBe(
      "契約条件に基づいて計算されています。詳細は根拠資料を参照してください。"
    );
    expect(saved_record.status).toBe("saved");
    expect(saved_record.created_at).toBeDefined();

    expect(saved_record.supporting_documents).toHaveLength(4);

    expect(saved_record.supporting_documents[0]).toEqual({
      doc_id: "DOC-001",
      document_type: "sales_data",
      file_name: "sales_activity_202401.csv",
      upload_date: new Date("2024-01-15T13:45:00Z"),
      file_size: 2048,
      document_content_hash: "hash_001_abc123def456",
      metadata: {
        period: "2024-01",
        record_count: 45,
        data_fields: ["customer_id", "activity_date", "achievement_type"],
      },
    });

    expect(saved_record.supporting_documents[1]).toEqual({
      doc_id: "DOC-002",
      document_type: "contract",
      file_name: "contract_CUST-001_v2.pdf",
      upload_date: new Date("2024-01-15T13:50:00Z"),
      file_size: 4096,
      document_content_hash: "hash_002_xyz789uvw012",
      metadata: {
        contract_version: "2",
        effective_date: "2024-01-01",
        pricing_model: "performance_based",
      },
    });

    expect(saved_record.supporting_documents[2]).toEqual({
      doc_id: "DOC-003",
      document_type: "calculation_sheet",
      file_name: "billing_calculation_CUST-001_202401.xlsx",
      upload_date: new Date("2024-01-15T13:55:00Z"),
      file_size: 3072,
      document_content_hash: "hash_003_pqr345stu678",
      metadata: {
        base_amount: 100000,
        discount_rate: 0.1,
        final_amount: 90000,
        calculation_method: "contract_based",
      },
    });

    expect(saved_record.supporting_documents[3]).toEqual({
      doc_id: "DOC-004",
      document_type: "communication_history",
      file_name: "email_thread_CUST-001_inquiry.eml",
      upload_date: new Date("2024-01-15T14:00:00Z"),
      file_size: 1536,
      document_content_hash: "hash_004_klm901nop234",
      metadata: {
        email_count: 3,
        conversation_start_date: "2024-01-15T09:00:00Z",
        conversation_end_date: "2024-01-15T14:00:00Z",
        sender_count: 2,
      },
    });

    const retrieved_record = await retrieveInquiryResponseRecord(
      saved_record.record_id
    );
    expect(retrieved_record).toBeDefined();
    expect(retrieved_record.record_id).toBe(saved_record.record_id);
    expect(retrieved_record.supporting_documents).toHaveLength(4);
    expect(retrieved_record.supporting_documents.every((doc: any) => doc.document_content_hash)).toBe(true);

    const doc_integrity_check = retrieved_record.supporting_documents.reduce(
      (acc: any, doc: any) => {
        acc.total_file_size += doc.file_size;
        acc.doc_types.add(doc.document_type);
        acc.metadata_fields += Object.keys(doc.metadata).length;
        return acc;
      },
      { total_file_size: 0, doc_types: new Set(), metadata_fields: 0 }
    );

    expect(doc_integrity_check.total_file_size).toBe(10752);
    expect(doc_integrity_check.doc_types.size).toBe(4);
    expect(doc_integrity_check.metadata_fields).toBeGreaterThanOrEqual(13);

    expect(retrieved_record.data_consistency).toBe(true);
  });
});