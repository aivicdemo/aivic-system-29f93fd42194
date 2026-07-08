import { evaluateManualReviewAndGenerateImprovementList } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1552
  test("運用マニュアルの査定部署長レビュー評価 - 複数セクションで修正指示が発生した場合、優先度付けされた改善リストが正しく出力される", () => {
    const input = {
      manual_id: "manual_20240115_001",
      sections: [
        {
          section_id: "sec_1",
          section_name: "OCR精度基準",
          review_instructions: [
            {
              instruction_id: "inst_1_1",
              priority: "高",
              content: "OCR精度の許容誤差率を明記する必要があります",
            },
          ],
        },
        {
          section_id: "sec_2",
          section_name: "判定ロジック",
          review_instructions: [
            {
              instruction_id: "inst_2_1",
              priority: "中",
              content: "判定ロジックのフローチャートを追加してください",
            },
            {
              instruction_id: "inst_2_2",
              priority: "低",
              content: "判定ロジック説明文の句読点を統一してください",
            },
          ],
        },
        {
          section_id: "sec_3",
          section_name: "データ更新手順",
          review_instructions: [
            {
              instruction_id: "inst_3_1",
              priority: "高",
              content: "過去案件データ更新の際の検証手順を追記する必要があります",
            },
          ],
        },
      ],
    };

    const result = evaluateManualReviewAndGenerateImprovementList(input);

    expect(result).toBeDefined();
    expect(result.improvement_list).toBeDefined();
    expect(Array.isArray(result.improvement_list)).toBe(true);
    expect(result.improvement_list.length).toBe(4);

    expect(result.improvement_list[0].instruction_id).toBe("inst_1_1");
    expect(result.improvement_list[0].priority).toBe("高");
    expect(result.improvement_list[0].section_name).toBe("OCR精度基準");
    expect(result.improvement_list[0].content).toBe(
      "OCR精度の許容誤差率を明記する必要があります"
    );
    expect(result.improvement_list[0].priority_rank).toBe(1);

    expect(result.improvement_list[1].instruction_id).toBe("inst_3_1");
    expect(result.improvement_list[1].priority).toBe("高");
    expect(result.improvement_list[1].section_name).toBe("データ更新手順");
    expect(result.improvement_list[1].content).toBe(
      "過去案件データ更新の際の検証手順を追記する必要があります"
    );
    expect(result.improvement_list[1].priority_rank).toBe(2);

    expect(result.improvement_list[2].instruction_id).toBe("inst_2_1");
    expect(result.improvement_list[2].priority).toBe("中");
    expect(result.improvement_list[2].section_name).toBe("判定ロジック");
    expect(result.improvement_list[2].content).toBe(
      "判定ロジックのフローチャートを追加してください"
    );
    expect(result.improvement_list[2].priority_rank).toBe(3);

    expect(result.improvement_list[3].instruction_id).toBe("inst_2_2");
    expect(result.improvement_list[3].priority).toBe("低");
    expect(result.improvement_list[3].section_name).toBe("判定ロジック");
    expect(result.improvement_list[3].content).toBe(
      "判定ロジック説明文の句読点を統一してください"
    );
    expect(result.improvement_list[3].priority_rank).toBe(4);

    expect(result.status).toBe("completed");
    expect(result.total_instructions).toBe(4);
    expect(result.instructions_by_priority).toEqual({
      高: 2,
      中: 1,
      低: 1,
    });
  });
});