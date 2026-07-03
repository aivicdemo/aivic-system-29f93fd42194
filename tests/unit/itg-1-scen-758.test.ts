import { recordDocumentVersionHistory } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - 契約書・提案資料バージョン履歴", () => {
  test("SCEN-758: 新版登録時に更新者・日時・変更内容・有効期限が正確に記録される", () => {
    // Precondition: 既存の契約書・提案資料が登録されている状態
    // Trigger: 新版をアップロード/登録し、バージョン履歴に情報が記録される
    // Expected: 更新者名、更新日時、変更内容、有効期限がすべて正確に記録される

    // ===== Setup: テスト用入力データ =====
    const current_user_id = "user_001";
    const current_user_name = "山田太郎";
    const document_id = "doc_contract_2024_001";
    const document_type = "contract"; // "contract" | "proposal"
    const previous_version = "v1.0";
    const new_version = "v2.0";
    const change_description = "表示価格から消費税を除外し、別途請求に変更";
    const valid_from_date = new Date("2024-02-01T00:00:00Z");
    const valid_until_date = new Date("2024-12-31T23:59:59Z");
    const registration_timestamp = new Date("2024-01-31T14:30:45Z");

    const input_payload = {
      user_id: current_user_id,
      user_name: current_user_name,
      document_id: document_id,
      document_type: document_type,
      previous_version: previous_version,
      new_version: new_version,
      change_description: change_description,
      valid_from_date: valid_from_date,
      valid_until_date: valid_until_date,
      registration_timestamp: registration_timestamp,
    };

    // ===== Execution =====
    const result = recordDocumentVersionHistory(input_payload);

    // ===== Assertion: 更新者名が記録されたか =====
    expect(result.recorded_version.updater_name).toBe(current_user_name);
    expect(result.recorded_version.updater_user_id).toBe(current_user_id);

    // ===== Assertion: 更新日時が記録されたか =====
    expect(result.recorded_version.updated_at).toEqual(registration_timestamp);

    // ===== Assertion: 変更内容が完全に記録されたか =====
    expect(result.recorded_version.change_description).toBe(change_description);
    expect(result.recorded_version.change_description.length).toBe(
      change_description.length
    );

    // ===== Assertion: 有効期限が正確に記録されたか =====
    expect(result.recorded_version.valid_from_date).toEqual(valid_from_date);
    expect(result.recorded_version.valid_until_date).toEqual(valid_until_date);

    // ===== Assertion: 新版情報が記録されたか =====
    expect(result.recorded_version.version_number).toBe(new_version);
    expect(result.recorded_version.document_id).toBe(document_id);
    expect(result.recorded_version.document_type).toBe(document_type);

    // ===== Assertion: 複数版が存在する場合、時系列順に並んでいるか =====
    expect(Array.isArray(result.version_history)).toBe(true);
    expect(result.version_history.length).toBeGreaterThanOrEqual(2);

    // 時系列順の確認（新しい順に並んでいる）
    for (let i = 0; i < result.version_history.length - 1; i++) {
      const current_updated_at = new Date(
        result.version_history[i].updated_at
      ).getTime();
      const next_updated_at = new Date(
        result.version_history[i + 1].updated_at
      ).getTime();
      expect(current_updated_at).toBeGreaterThanOrEqual(next_updated_at);
    }

    // ===== Assertion: 各版のメタデータが改ざんされていないか =====
    const latest_version_in_history = result.version_history.find(
      (v: any) => v.version_number === new_version
    );
    expect(latest_version_in_history).toBeDefined();
    expect(latest_version_in_history.updater_name).toBe(current_user_name);
    expect(latest_version_in_history.updated_at).toEqual(registration_timestamp);
    expect(latest_version_in_history.change_description).toBe(
      change_description
    );
    expect(latest_version_in_history.valid_until_date).toEqual(
      valid_until_date
    );

    // ===== Assertion: 前バージョンのメタデータも保持されているか =====
    const previous_version_in_history = result.version_history.find(
      (v: any) => v.version_number === previous_version
    );
    expect(previous_version_in_history).toBeDefined();

    // ===== Assertion: 戻り値の構造が正しいか =====
    expect(result).toHaveProperty("recorded_version");
    expect(result).toHaveProperty("version_history");
    expect(result).toHaveProperty("total_versions");
    expect(result.total_versions).toBe(result.version_history.length);

    // ===== Assertion: 記録がシステムで一貫性を持つか =====
    expect(result.recorded_version.version_number).toBe(
      result.version_history[0].version_number
    );
    expect(result.recorded_version.updated_at).toEqual(
      result.version_history[0].updated_at
    );
  });
});