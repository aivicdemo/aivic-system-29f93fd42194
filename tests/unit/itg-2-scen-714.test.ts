import { validateEstimateFileUpload } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-714: [normal] 見積書ファイル形式・サイズ検証 - PDF形式の見積書が正常に受け入れられる
  test('PDF形式の見積書ファイル（サイズ限度内）がアップロード検証に合格する', () => {
    // 入力値: PDF形式、サイズ10MB（システム上限20MB以下）
    const file_name = 'estimate_2024_01_15.pdf';
    const file_mime_type = 'application/pdf';
    const file_size_bytes = 10485760; // 10MB
    const system_max_file_size_bytes = 20971520; // 20MB
    const allowed_mime_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    const result = validateEstimateFileUpload({
      file_name,
      file_mime_type,
      file_size_bytes,
      system_max_file_size_bytes,
      allowed_mime_types,
    });

    // 期待結果: 検証合格、ファイルシステムに登録可能な状態
    expect(result).toEqual({
      is_valid: true,
      validation_status: 'accepted',
      file_name: 'estimate_2024_01_15.pdf',
      file_size_mb: 10.0,
      mime_type_verified: true,
      size_verified: true,
      error_message: null,
      system_message: 'ファイル形式とサイズの検証に合格しました。ファイルをシステムに登録します。',
      can_proceed_to_registration: true,
    });

    expect(result.is_valid).toBe(true);
    expect(result.validation_status).toBe('accepted');
    expect(result.mime_type_verified).toBe(true);
    expect(result.size_verified).toBe(true);
    expect(result.can_proceed_to_registration).toBe(true);
    expect(result.error_message).toBeNull();
  });
});