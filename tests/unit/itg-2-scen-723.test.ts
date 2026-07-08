import { detectDuplicateEstimate } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  test("SCEN-723: 見積書重複提出・既査定検出 - 同一見積書の重複提出時に警告メッセージが表示される", () => {
    // 初回提出のシミュレーション: 見積書ファイル estimate_001.pdf が初めて登録される
    const firstSubmissionResult = detectDuplicateEstimate({
      file_name: "estimate_001.pdf",
      file_hash: "abc123def456",
      submitted_at: "2024-06-15T10:30:00Z",
      existing_estimates: [],
    });

    // 初回提出は重複ではないので success フラグが true
    expect(firstSubmissionResult.is_duplicate).toBe(false);
    expect(firstSubmissionResult.warning_message).toBe("");

    // 既登録見積書データベースにファイルが追加される
    const registered_estimate = {
      file_name: "estimate_001.pdf",
      file_hash: "abc123def456",
      first_submitted_at: "2024-06-15T10:30:00Z",
      assessment_status: "pending",
      assessment_date: null,
    };

    // 重複提出のシミュレーション: 同じファイル estimate_001.pdf を再度提出
    const duplicateSubmissionResult = detectDuplicateEstimate({
      file_name: "estimate_001.pdf",
      file_hash: "abc123def456",
      submitted_at: "2024-06-15T11:00:00Z",
      existing_estimates: [registered_estimate],
    });

    // 重複検出: is_duplicate フラグが true、警告メッセージが表示される
    expect(duplicateSubmissionResult.is_duplicate).toBe(true);
    expect(duplicateSubmissionResult.warning_message).toContain("既に登録されています");
    expect(duplicateSubmissionResult.first_submission_datetime).toBe(
      "2024-06-15T10:30:00Z"
    );
    expect(duplicateSubmissionResult.assessment_status).toBe("pending");

    // エラーハンドリング: ファイルハッシュ値が同じ場合、重複と判定
    const hashBasedDuplicateResult = detectDuplicateEstimate({
      file_name: "estimate_001_copy.pdf",
      file_hash: "abc123def456", // ハッシュ値が同じ
      submitted_at: "2024-06-15T11:30:00Z",
      existing_estimates: [registered_estimate],
    });

    expect(hashBasedDuplicateResult.is_duplicate).toBe(true);
    expect(hashBasedDuplicateResult.warning_message).toContain("同一の見積書");

    // バリデーション: 既に査定済みの見積書を再度提出
    const assessedEstimate = {
      file_name: "estimate_002.pdf",
      file_hash: "xyz789uvw012",
      first_submitted_at: "2024-06-14T09:00:00Z",
      assessment_status: "approved",
      assessment_date: "2024-06-14T14:30:00Z",
    };

    const alreadyAssessedResult = detectDuplicateEstimate({
      file_name: "estimate_002.pdf",
      file_hash: "xyz789uvw012",
      submitted_at: "2024-06-15T10:00:00Z",
      existing_estimates: [assessedEstimate],
    });

    expect(alreadyAssessedResult.is_duplicate).toBe(true);
    expect(alreadyAssessedResult.assessment_status).toBe("approved");
    expect(alreadyAssessedResult.warning_message).toContain("査定済み");

    // エラーケース: 必須フィールド（file_hash）が空の場合は throw
    expect(() =>
      detectDuplicateEstimate({
        file_name: "estimate_003.pdf",
        file_hash: "",
        submitted_at: "2024-06-15T11:00:00Z",
        existing_estimates: [],
      })
    ).toThrow(/ファイルハッシュ/);

    // エラーケース: submitted_at が不正な ISO 形式の場合は throw
    expect(() =>
      detectDuplicateEstimate({
        file_name: "estimate_004.pdf",
        file_hash: "qwe456rty789",
        submitted_at: "2024-06-15 11:00:00", // 不正な形式
        existing_estimates: [],
      })
    ).toThrow(/日時形式/);

    // 複数の既登録見積書がある場合、最初にマッチしたものを返す
    const multipleEstimates = [
      {
        file_name: "estimate_005.pdf",
        file_hash: "hash1",
        first_submitted_at: "2024-06-10T08:00:00Z",
        assessment_status: "rejected",
        assessment_date: "2024-06-10T16:00:00Z",
      },
      {
        file_name: "estimate_006.pdf",
        file_hash: "hash2",
        first_submitted_at: "2024-06-12T09:00:00Z",
        assessment_status: "pending",
        assessment_date: null,
      },
    ];

    const multiDuplicateResult = detectDuplicateEstimate({
      file_name: "estimate_006.pdf",
      file_hash: "hash2",
      submitted_at: "2024-06-15T10:45:00Z",
      existing_estimates: multipleEstimates,
    });

    expect(multiDuplicateResult.is_duplicate).toBe(true);
    expect(multiDuplicateResult.first_submission_datetime).toBe(
      "2024-06-12T09:00:00Z"
    );
    expect(multiDuplicateResult.assessment_status).toBe("pending");

    // 重複でない場合、warning_message は空文字列
    const noDuplicateResult = detectDuplicateEstimate({
      file_name: "estimate_new.pdf",
      file_hash: "newhash999",
      submitted_at: "2024-06-15T12:00:00Z",
      existing_estimates: multipleEstimates,
    });

    expect(noDuplicateResult.is_duplicate).toBe(false);
    expect(noDuplicateResult.warning_message).toBe("");
    expect(noDuplicateResult.first_submission_datetime).toBeNull();
  });
});