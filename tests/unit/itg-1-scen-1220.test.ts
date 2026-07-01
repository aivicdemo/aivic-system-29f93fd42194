import { validateFinalApprovalAndReturnMissingDocuments } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1220
  test("根拠資料が1件でも不足している場合、承認を拒否して不足資料リストが返される", async () => {
    const required_documents = [
      { document_id: "doc_001", document_name: "営業活動記録", required_count: 1 },
      { document_id: "doc_002", document_name: "契約書", required_count: 1 },
      { document_id: "doc_003", document_name: "提案資料", required_count: 1 },
      { document_id: "doc_004", document_name: "請求根拠明細", required_count: 1 },
      { document_id: "doc_005", document_name: "顧客承認メール", required_count: 1 }
    ];

    const submitted_documents = [
      { document_id: "doc_001", document_name: "営業活動記録", submitted_count: 1 },
      { document_id: "doc_002", document_name: "契約書", submitted_count: 1 },
      { document_id: "doc_003", document_name: "提案資料", submitted_count: 1 },
      { document_id: "doc_004", document_name: "請求根拠明細", submitted_count: 1 }
    ];

    const approval_request_data = {
      approval_request_id: "approval_req_12345",
      customer_id: "cust_001",
      response_content: "営業データの内容を確認し、請求額計算に誤りがないことを検証しました。",
      response_created_at: "2024-12-15T10:30:00Z",
      response_created_by: "user_representative_001",
      required_documents: required_documents,
      submitted_documents: submitted_documents,
      approval_status: "pending"
    };

    const response = await validateFinalApprovalAndReturnMissingDocuments(approval_request_data);

    expect(response.status_code).toBe(422);
    expect(response.approval_status).toBe("rejected");
    expect(response.approval_flag).toBe(false);

    const missing_docs = response.missing_documents;
    expect(missing_docs).toHaveLength(1);
    expect(missing_docs[0]).toEqual({
      document_id: "doc_005",
      document_name: "顧客承認メール",
      required_count: 1,
      submitted_count: 0,
      shortage_count: 1
    });

    expect(response.error_message).toMatch(/顧客承認メール/);
    expect(response.error_message).toMatch(/不足/);

    expect(response.reason).toBe("insufficient_supporting_documents");
  });
});