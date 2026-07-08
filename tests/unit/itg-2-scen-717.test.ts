import { validateEstimateFileUpload } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-717: [error] 見積書ファイル形式・サイズ検証 - サイズ上限超過のファイルがエラーメッセージとともに拒否される
  test("should reject file upload when file size exceeds the maximum limit and display appropriate error message", () => {
    const file_name = "estimate_oversized.pdf";
    const file_size_bytes = 150 * 1024 * 1024; // 150 MB
    const max_allowed_size_mb = 100; // 100 MB上限
    const max_allowed_size_bytes = max_allowed_size_mb * 1024 * 1024;

    const upload_result = validateEstimateFileUpload({
      file_name: file_name,
      file_size_bytes: file_size_bytes,
      max_file_size_mb: max_allowed_size_mb,
    });

    expect(upload_result.is_valid).toBe(false);
    expect(upload_result.error_message).toMatch(/ファイルサイズ/);
    expect(upload_result.error_message).toMatch(/上限/);
    expect(upload_result.should_reject_upload).toBe(true);
    expect(upload_result.max_allowed_size_mb).toBe(100);
    expect(upload_result.file_size_mb).toBe(150);
    expect(upload_result.file_saved).toBe(false);
  });
});