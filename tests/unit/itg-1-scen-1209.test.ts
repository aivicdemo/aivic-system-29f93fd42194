import { saveInquiryResponseRecord } from "../../src/logic/it-1-2-1";

describe("問い合わせ対応記録の構造化保存機能", () => {
  test("SCEN-1209: 顧客確認済みの問い合わせ対応記録が正しく構造化されて保存される", () => {
    // 入力: 問い合わせ対応記録の構造化データ
    const inquiryResponseData = {
      inquiry_id: "INQ-20240115-001",
      customer_id: "CUST-0001",
      inquiry_content: "2024年1月の請求額が前月比150%増加した理由について",
      inquiry_date: "2024-01-15T10:30:00Z",
      verification_process: {
        step_1: {
          description: "営業システムから2024年1月の営業データを抽出",
          result: "アポ数: 25件、成約数: 8件（前月比+40%）",
          timestamp: "2024-01-15T10:45:00Z",
        },
        step_2: {
          description: "契約書の請求ルールを確認",
          result: "成約1件あたり基本単価5,000円、成約数×5,000円+成果報酬（アポ数×500円）",
          timestamp: "2024-01-15T11:00:00Z",
        },
        step_3: {
          description: "請求額を再計算",
          result: "基本料金: 40,000円（8件×5,000円）、成果報酬: 12,500円（25件×500円）、合計: 52,500円",
          timestamp: "2024-01-15T11:15:00Z",
        },
      },
      response_content: "ご指摘ありがとうございます。請求額の増加理由は成約数の増加（前月比+40%）と成果報酬の計算ルール適用によるものです。詳細な営業データと計算根拠をご確認いただき、ご納得いただければ幸いです。",
      response_date: "2024-01-15T11:30:00Z",
      evidence_materials: {
        sales_data_file: "sales_data_2024_01.csv",
        contract_document: "contract_20231101_CUST0001.pdf",
        calculation_sheet: "billing_calculation_2024_01_CUST0001.xlsx",
      },
      processed_by: "operator_001",
      required_fields_complete: true,
    };

    // 実行: 問い合わせ対応記録を保存
    const saved_record = saveInquiryResponseRecord(inquiryResponseData);

    // 検証: 保存されたレコードの構造と値
    expect(saved_record.record_id).toBeDefined();
    expect(saved_record.record_id).toMatch(/^REC-\d{14}-[A-Z0-9]{6}$/);

    expect(saved_record.inquiry_id).toBe("INQ-20240115-001");
    expect(saved_record.customer_id).toBe("CUST-0001");

    expect(saved_record.inquiry_content).toBe(
      "2024年1月の請求額が前月比150%増加した理由について"
    );
    expect(saved_record.inquiry_date).toBe("2024-01-15T10:30:00Z");

    expect(saved_record.verification_process).toBeDefined();
    expect(saved_record.verification_process.step_1.description).toBe(
      "営業システムから2024年1月の営業データを抽出"
    );
    expect(saved_record.verification_process.step_1.result).toBe(
      "アポ数: 25件、成約数: 8件（前月比+40%）"
    );
    expect(saved_record.verification_process.step_1.timestamp).toBe(
      "2024-01-15T10:45:00Z"
    );

    expect(saved_record.verification_process.step_2.description).toBe(
      "契約書の請求ルールを確認"
    );
    expect(
      saved_record.verification_process.step_2.result
    ).toBe(
      "成約1件あたり基本単価5,000円、成約数×5,000円+成果報酬（アポ数×500円）"
    );
    expect(saved_record.verification_process.step_2.timestamp).toBe(
      "2024-01-15T11:00:00Z"
    );

    expect(saved_record.verification_process.step_3.description).toBe(
      "請求額を再計算"
    );
    expect(saved_record.verification_process.step_3.result).toBe(
      "基本料金: 40,000円（8件×5,000円）、成果報酬: 12,500円（25件×500円）、合計: 52,500円"
    );
    expect(saved_record.verification_process.step_3.timestamp).toBe(
      "2024-01-15T11:15:00Z"
    );

    expect(saved_record.response_content).toBe(
      "ご指摘ありがとうございます。請求額の増加理由は成約数の増加（前月比+40%）と成果報酬の計算ルール適用によるものです。詳細な営業データと計算根拠をご確認いただき、ご納得いただければ幸いです。"
    );
    expect(saved_record.response_date).toBe("2024-01-15T11:30:00Z");

    expect(saved_record.evidence_materials).toBeDefined();
    expect(saved_record.evidence_materials.sales_data_file).toBe(
      "sales_data_2024_01.csv"
    );
    expect(saved_record.evidence_materials.contract_document).toBe(
      "contract_20231101_CUST0001.pdf"
    );
    expect(saved_record.evidence_materials.calculation_sheet).toBe(
      "billing_calculation_2024_01_CUST0001.xlsx"
    );

    expect(saved_record.processed_by).toBe("operator_001");
    expect(saved_record.created_at).toBeDefined();
    expect(saved_record.created_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(saved_record.status).toBe("saved");
  });
});