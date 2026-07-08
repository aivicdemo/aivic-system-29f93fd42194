import { describe, test, expect } from "@jest/globals";
import {
  validateLearningDataQuality,
  removeDuplicatesFromDataset,
} from "../../src/logic/it-6-2-2-1";

describe("学習データ品質検証機能 - 重複データ検出と除外", () => {
  test("SCEN-1215: 重複データを検出して除外し、一意な学習データセットを構築する", () => {
    // === Arrange ===
    // テスト対象の学習データセット（重複を含む）を準備
    const original_dataset = [
      {
        past_project_id: "proj_001",
        work_type: "土工",
        region: "東京都",
        base_amount: 1500000,
        unit_price: 15000,
        recorded_date: "2024-01-15",
      },
      {
        past_project_id: "proj_002",
        work_type: "鉄筋工",
        region: "大阪府",
        base_amount: 2000000,
        unit_price: 20000,
        recorded_date: "2024-01-20",
      },
      {
        past_project_id: "proj_001",
        work_type: "土工",
        region: "東京都",
        base_amount: 1500000,
        unit_price: 15000,
        recorded_date: "2024-01-15",
      },
      {
        past_project_id: "proj_003",
        work_type: "コンクリート工",
        region: "愛知県",
        base_amount: 2500000,
        unit_price: 25000,
        recorded_date: "2024-02-10",
      },
      {
        past_project_id: "proj_002",
        work_type: "鉄筋工",
        region: "大阪府",
        base_amount: 2000000,
        unit_price: 20000,
        recorded_date: "2024-01-20",
      },
    ];

    const original_record_count = original_dataset.length; // 5件
    const expected_duplicate_count = 2; // proj_001 と proj_002 の重複 2件

    // === Act ===
    // 査定品質管理・標準化システムの学習データ品質検証機能を起動
    const validation_result = validateLearningDataQuality(original_dataset);

    // 検出された重複レコードの件数と内容を確認
    const detected_duplicate_count = validation_result.duplicate_count;
    const duplicate_records = validation_result.duplicates;

    // 重複データを除外する処理を実行
    const cleaned_dataset = removeDuplicatesFromDataset(original_dataset);

    // 除外後のデータセットを取得
    const cleaned_record_count = cleaned_dataset.length;
    const expected_cleaned_count = 3; // 5件 - 2件の重複 = 3件

    // === Assert ===
    // 重複データが正確に検出されたことを確認
    expect(detected_duplicate_count).toBe(expected_duplicate_count);

    // 検出された重複レコードのIDが正確に特定されていることを確認
    expect(duplicate_records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          past_project_id: "proj_001",
          work_type: "土工",
          region: "東京都",
        }),
        expect.objectContaining({
          past_project_id: "proj_002",
          work_type: "鉄筋工",
          region: "大阪府",
        }),
      ])
    );

    // 除外後のデータセットのレコード数を確認
    expect(cleaned_record_count).toBe(expected_cleaned_count);

    // 元のデータセット内の全重複レコードが特定されていることを確認
    expect(detected_duplicate_count).toBeLessThanOrEqual(original_record_count);

    // 除外後のデータセットには重複が存在しないことを確認
    const unique_ids = new Set(
      cleaned_dataset.map((record) => record.past_project_id)
    );
    expect(unique_ids.size).toBe(cleaned_record_count);

    // データの一意性が保証されていることを確認
    // （各 past_project_id は1回のみ出現）
    const id_counts = cleaned_dataset.reduce(
      (acc, record) => {
        acc[record.past_project_id] = (acc[record.past_project_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.values(id_counts).forEach((count) => {
      expect(count).toBe(1);
    });

    // 処理ログおよび除外されたレコードの詳細情報を確認
    expect(validation_result).toHaveProperty("duplicate_count");
    expect(validation_result).toHaveProperty("duplicates");
    expect(validation_result).toHaveProperty("processing_timestamp");

    // 除外後のデータセットが一意なレコードのみで構成されていることを確認
    const all_unique =
      cleaned_dataset.length ===
      new Set(
        cleaned_dataset.map(
          (r) =>
            `${r.past_project_id}_${r.work_type}_${r.region}_${r.base_amount}`
        )
      ).size;
    expect(all_unique).toBe(true);

    // 元のデータセットと除外後のデータセットのレコード数の差が
    // 検出された重複件数と一致することを確認
    const removed_count = original_record_count - cleaned_record_count;
    expect(removed_count).toBe(expected_duplicate_count);
  });
});