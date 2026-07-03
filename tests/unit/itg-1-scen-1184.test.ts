import { saveInquiryRecord } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1184
  test("問い合わせ対応記録の構造化保存機能 - 顧客確認済みの問い合わせ内容、検証プロセス、回答内容、根拠資料が構造化形式で正常に保存される", () => {
    const inquiryRecord = {
      customer_id: "CUST-2024-001",
      customer_name: "テスト顧客A株式会社",
      inquiry_content: {
        category: "請求額確認",
        detail: "2024年1月の請求額が前月比で30%増加している理由を確認したい",
        received_at: "2024-01-15T09:30:00Z",
      },
      verification_process: {
        method: "営業データ遡及検索と契約内容確認",
        verifier: "営業オペレーター太郎",
        verified_at: "2024-01-15T10:45:00Z",
        findings:
          "契約変更により1月から単価が20%引き上げられており、アポ数も15%増加したため妥当性を確認",
      },
      response_content: {
        classification: "正確",
        detail: "1月の請求額は契約変更と営業成果実績に基づき正確に計算されている",
        resolution_method: "説明対応",
        response_date: "2024-01-15T14:00:00Z",
      },
      supporting_documents: [
        {
          document_type: "契約書",
          title: "2024年1月契約変更版",
          storage_path: "/contracts/CUST-2024-001/change_2024-01.pdf",
          uploaded_at: "2024-01-15T10:50:00Z",
        },
        {
          document_type: "営業データ抽出レポート",
          title: "1月成果指標集計",
          storage_path: "/reports/CUST-2024-001/summary_2024-01.xlsx",
          uploaded_at: "2024-01-15T10:55:00Z",
        },
      ],
      created_at: "2024-01-15T14:05:00Z",
      saved_status: "saved",
    };

    const result = saveInquiryRecord(inquiryRecord);

    expect(result.success).toBe(true);
    expect(result.record_id).toBeDefined();
    expect(typeof result.record_id).toBe("string");
    expect(result.record_id.length).toBeGreaterThan(0);

    expect(result.saved_data.customer_id).toBe("CUST-2024-001");
    expect(result.saved_data.customer_name).toBe("テスト顧客A株式会社");

    expect(result.saved_data.inquiry_content.category).toBe("請求額確認");
    expect(result.saved_data.inquiry_content.detail).toBe(
      "2024年1月の請求額が前月比で30%増加している理由を確認したい"
    );
    expect(result.saved_data.inquiry_content.received_at).toBe(
      "2024-01-15T09:30:00Z"
    );

    expect(result.saved_data.verification_process.method).toBe(
      "営業データ遡及検索と契約内容確認"
    );
    expect(result.saved_data.verification_process.verifier).toBe(
      "営業オペレーター太郎"
    );
    expect(result.saved_data.verification_process.verified_at).toBe(
      "2024-01-15T10:45:00Z"
    );
    expect(result.saved_data.verification_process.findings).toContain("契約変更");
    expect(result.saved_data.verification_process.findings).toContain("妥当性");

    expect(result.saved_data.response_content.classification).toBe("正確");
    expect(result.saved_data.response_content.detail).toContain(
      "契約変更と営業成果実績"
    );
    expect(result.saved_data.response_content.resolution_method).toBe(
      "説明対応"
    );
    expect(result.saved_data.response_content.response_date).toBe(
      "2024-01-15T14:00:00Z"
    );

    expect(result.saved_data.supporting_documents).toHaveLength(2);
    expect(result.saved_data.supporting_documents[0].document_type).toBe(
      "契約書"
    );
    expect(result.saved_data.supporting_documents[0].title).toBe(
      "2024年1月契約変更版"
    );
    expect(result.saved_data.supporting_documents[0].storage_path).toContain(
      "contracts"
    );
    expect(
      result.saved_data.supporting_documents[0].storage_path
    ).toContain(".pdf");

    expect(result.saved_data.supporting_documents[1].document_type).toBe(
      "営業データ抽出レポート"
    );
    expect(result.saved_data.supporting_documents[1].title).toBe(
      "1月成果指標集計"
    );
    expect(result.saved_data.supporting_documents[1].storage_path).toContain(
      "reports"
    );
    expect(
      result.saved_data.supporting_documents[1].storage_path
    ).toContain(".xlsx");

    expect(result.saved_data.created_at).toBe("2024-01-15T14:05:00Z");
    expect(result.saved_data.saved_status).toBe("saved");

    expect(result.schema_valid).toBe(true);
    expect(result.schema_errors).toHaveLength(0);

    expect(result.display_fields).toEqual({
      customer_confirmed: true,
      inquiry_summary: "請求額確認：2024年1月の請求額が前月比で30%増加している理由を確認したい",
      verification_summary:
        "営業データ遡及検索と契約内容確認により検証完了",
      response_summary: "正確：1月の請求額は契約変更と営業成果実績に基づき正確に計算されている",
      documents_count: 2,
    });
  });
});