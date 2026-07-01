import { structureValidationEvidenceData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1204: [normal] 検証結果根拠資料構造化機能 - 検証結果『正確』の場合、営業活動記録が根拠資料として構造化される
  test('検証結果が正確の場合、営業活動記録が正しく構造化され検証根拠資料として保存される', () => {
    // テストデータ: 営業活動記録
    const sales_activity_record = {
      customer_name: '株式会社テストコーポレーション',
      activity_datetime: '2024-01-15T10:30:00Z',
      activity_content: '営業提案会議',
      amount: 500000,
      service_type: 'クラウドサービス',
      status: '成約',
      sales_rep_name: '営業太郎',
      contact_method: 'オンライン会議',
      notes: '契約内容について合意'
    };

    const validation_result = {
      validation_status: '正確',
      check_timestamp: '2024-01-15T11:00:00Z',
      validated_by: 'システム自動検証'
    };

    // 構造化処理を実行
    const structured_evidence = structureValidationEvidenceData({
      activity_record: sales_activity_record,
      validation_result: validation_result
    });

    // 構造化データの形式を確認（JSON形式）
    expect(typeof structured_evidence).toBe('object');
    expect(structured_evidence).not.toBeNull();

    // 構造化データに営業活動記録の各項目が正しく抽出・配置されていることを確認
    expect(structured_evidence.evidence_format).toBe('JSON');
    expect(structured_evidence.validation_status).toBe('正確');
    
    // 営業活動記録の各項目が含まれていることを確認
    expect(structured_evidence.activity_details).toBeDefined();
    expect(structured_evidence.activity_details.customer_name).toBe('株式会社テストコーポレーション');
    expect(structured_evidence.activity_details.activity_datetime).toBe('2024-01-15T10:30:00Z');
    expect(structured_evidence.activity_details.activity_content).toBe('営業提案会議');
    expect(structured_evidence.activity_details.amount).toBe(500000);
    expect(structured_evidence.activity_details.service_type).toBe('クラウドサービス');
    expect(structured_evidence.activity_details.status).toBe('成約');

    // 根拠資料として必要なメタデータ（トレーサビリティ、タイムスタンプ等）が含まれていることを確認
    expect(structured_evidence.metadata).toBeDefined();
    expect(structured_evidence.metadata.validation_timestamp).toBe('2024-01-15T11:00:00Z');
    expect(structured_evidence.metadata.validated_by).toBe('システム自動検証');
    expect(structured_evidence.metadata.evidence_created_at).toBeDefined();
    expect(typeof structured_evidence.metadata.evidence_id).toBe('string');

    // 構造化データが根拠資料として保存・参照可能な状態にあることを確認
    expect(structured_evidence.is_referenceable).toBe(true);
    expect(structured_evidence.storage_status).toBe('保存可能');
    expect(structured_evidence.reference_path).toBeDefined();
    expect(structured_evidence.reference_path.length).toBeGreaterThan(0);

    // 構造化データが後続プロセスで参照可能な状態であることを確認
    expect(structured_evidence.can_be_referenced_by_billing_process).toBe(true);
    expect(structured_evidence.can_be_referenced_by_report_process).toBe(true);
    expect(structured_evidence.audit_trail).toBeDefined();
    expect(Array.isArray(structured_evidence.audit_trail)).toBe(true);
  });
});