import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  detectObsoleteDocumentVersion,
  lockObsoleteDocumentEditing,
  promptLatestVersionSwitchDialog,
  convertDocumentToLatestVersion,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 旧バージョン資料の自動検出・警告", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-777: [normal] 旧バージョン資料の自動検出・警告機能
  test("旧バージョン資料をアップロードしたときに、自動検出、警告、ロック、最新版切り替えが実行される", () => {
    // ============================================
    // 前提条件
    // ============================================
    // - 営業データ品質管理・請求自動化システムにログイン済み
    // - 最新版リソース: document_id=1001, version=3, version_name="2024-12-01_v3.0_latest"
    // - 旧バージョン: 同じdocument_idで、version=1, version_name="2024-10-15_v1.0_old"
    // - 旧バージョン検出ロジック: version < current_version である場合に検出
    // - 警告・ロック: 検出時にロック状態(is_locked=true)に遷移
    // - 最新版切り替え: ユーザーが[最新版に切り替える]ボタンをクリック後、document_versionを最新版に更新

    const current_version = 3;
    const uploaded_document = {
      document_id: 1001,
      version: 1,
      version_name: "2024-10-15_v1.0_old",
      file_name: "proposal_old.pdf",
      upload_timestamp: new Date("2024-10-15T10:30:00Z"),
      uploaded_by_user_id: 101,
      is_locked: false,
    };

    const latest_document_metadata = {
      document_id: 1001,
      current_version: 3,
      latest_version_name: "2024-12-01_v3.0_latest",
      latest_file_name: "proposal_latest.pdf",
      latest_upload_timestamp: new Date("2024-12-01T09:00:00Z"),
      latest_uploaded_by_user_id: 200,
    };

    // ============================================
    // Step 1: 旧バージョン検出機能が実行される
    // ============================================
    // 入力: uploaded_document (version=1)と current_version (3)
    // 期待値: detection_result.is_obsolete = true
    // 期待値: detection_result.obsolete_reason = "バージョン番号が古い（アップロード版:1, 最新版:3）"

    const detection_result = detectObsoleteDocumentVersion({
      uploaded_version: uploaded_document.version,
      current_version: latest_document_metadata.current_version,
      uploaded_version_name: uploaded_document.version_name,
      latest_version_name: latest_document_metadata.latest_version_name,
    });

    expect(detection_result.is_obsolete).toBe(true);
    expect(detection_result.obsolete_reason).toMatch(/バージョン/);
    expect(detection_result.version_gap).toBe(2); // 3 - 1 = 2

    // ============================================
    // Step 2: 警告メッセージが表示される
    // ============================================
    // 期待値: warning_message は業務的な警告文を返す
    // 期待値: warning_level = "warning" (or "alert")

    expect(detection_result.warning_message).toMatch(/旧バージョン|最新版/);
    expect(detection_result.warning_level).toMatch(/warning|alert/);

    // ============================================
    // Step 3: 旧バージョン資料のロック状態を設定
    // ============================================
    // 入力: document_id=1001, is_obsolete=true
    // 期待値: lock_result.is_locked = true
    // 期待値: lock_result.locked_reason = "旧バージョンのため編集・実行がロックされています"
    // 期待値: lock_result.edit_button_enabled = false
    // 期待値: lock_result.execute_button_enabled = false

    const lock_result = lockObsoleteDocumentEditing({
      document_id: uploaded_document.document_id,
      is_obsolete: detection_result.is_obsolete,
      locked_timestamp: new Date("2024-12-01T14:30:00Z"),
    });

    expect(lock_result.is_locked).toBe(true);
    expect(lock_result.locked_reason).toMatch(/旧バージョン|ロック/);
    expect(lock_result.edit_button_enabled).toBe(false);
    expect(lock_result.execute_button_enabled).toBe(false);

    // ============================================
    // Step 4: 最新版への切り替えダイアログを表示
    // ============================================
    // 入力: document_id, current_version, latest_version, is_locked
    // 期待値: dialog_result.should_display_dialog = true
    // 期待値: dialog_result.dialog_title = "旧バージョン検出"
    // 期待値: dialog_result.switch_button_label = "最新版に切り替える"
    // 期待値: dialog_result.cancel_button_label = "キャンセル"

    const dialog_result = promptLatestVersionSwitchDialog({
      document_id: uploaded_document.document_id,
      current_version: uploaded_document.version,
      latest_version: latest_document_metadata.current_version,
      is_locked: lock_result.is_locked,
      version_gap: detection_result.version_gap,
    });

    expect(dialog_result.should_display_dialog).toBe(true);
    expect(dialog_result.dialog_title).toMatch(/旧バージョン/);
    expect(dialog_result.switch_button_label).toMatch(/最新版/);
    expect(dialog_result.cancel_button_label).toMatch(/キャンセル/);

    // ============================================
    // Step 5: ユーザーが「最新版に切り替える」ボタンをクリック
    // ============================================
    // 入力: document_id=1001, user_choice="switch_to_latest"
    // 期待値: conversion_process.conversion_started = true
    // 期待値: conversion_process.conversion_status = "processing"

    const user_action = {
      user_choice: "switch_to_latest",
      action_timestamp: new Date("2024-12-01T14:31:00Z"),
      user_id: 101,
    };

    const conversion_process = convertDocumentToLatestVersion({
      document_id: uploaded_document.document_id,
      old_version: uploaded_document.version,
      target_version: latest_document_metadata.current_version,
      user_id: user_action.user_id,
      conversion_triggered_at: user_action.action_timestamp,
    });

    expect(conversion_process.conversion_started).toBe(true);
    expect(conversion_process.conversion_status).toMatch(/processing|initiated/);

    // ============================================
    // Step 6: 変換処理が完了
    // ============================================
    // 期待値: conversion_result.conversion_completed = true
    // 期待値: conversion_result.conversion_status = "completed"
    // 期待値: conversion_result.new_document_version = 3 (latest_version)
    // 期待値: conversion_result.converted_file_name = "proposal_latest.pdf"
    // 期待値: conversion_result.is_locked = false (ロック解除)
    // 期待値: conversion_result.edit_button_enabled = true (編集ボタン再有効化)
    // 期待値: conversion_result.execute_button_enabled = true (実行ボタン再有効化)

    expect(conversion_process.conversion_completed).toBe(true);
    expect(conversion_process.new_document_version).toBe(3);
    expect(conversion_process.new_version_name).toBe(
      latest_document_metadata.latest_version_name
    );
    expect(conversion_process.is_locked_after_conversion).toBe(false);
    expect(conversion_process.edit_button_enabled_after_conversion).toBe(true);
    expect(conversion_process.execute_button_enabled_after_conversion).toBe(
      true
    );

    // ============================================
    // Step 7: リソースが最新版として登録されたことを確認
    // ============================================
    // 期待値: final_document_state.document_id = 1001
    // 期待値: final_document_state.version = 3
    // 期待値: final_document_state.is_locked = false
    // 期待値: final_document_state.conversion_timestamp is recorded

    expect(conversion_process.document_id).toBe(1001);
    expect(conversion_process.conversion_completed).toBe(true);
    expect(conversion_process.new_document_version).toBe(3);

    // ============================================
    // Step 8: 変換完了後のシステム状態を検証
    // ============================================
    // 期待値: 全体フロー完了
    // 期待値: 最初は is_locked=false, version=1 → 最終的に is_locked=false, version=3
    // 期待値: ユーザー操作による中断なく自動完了

    expect(conversion_process.conversion_status).toMatch(
      /completed|success|finish/
    );
    expect(lock_result.is_locked).toBe(true); // 検出時点ではロック
    expect(conversion_process.is_locked_after_conversion).toBe(false); // 変換後はアンロック
  });
});