import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import { generateAssessmentExplanationDocument } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  const outputDir = path.join(__dirname, "temp_output");

  beforeEach(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(outputDir, file));
      });
      fs.rmdirSync(outputDir);
    }
  });

  // SCEN-749
  test("査定結果確定時に相場乖離の数値・グラフ・判定根拠を含む説明資料が自動生成される", () => {
    // 準備: テストデータとして査定結果（相場価格との乖離あり）を定義
    const assessmentInput = {
      assessment_id: "ASS-20240115-001",
      project_name: "新築工事A",
      construction_type: "新築建築工事",
      submitted_amount: 5500000,
      market_reference_amount: 5000000,
      divergence_amount: 500000,
      divergence_rate_percent: 10.0,
      reference_past_project_count: 12,
      reference_data_source: "物価本2024年1月版",
      applied_correction_factor: 1.05,
      assessment_reason:
        "地域の労務費上昇（+5%）を反映。過去案件比較により相場範囲内と判定。",
      assessment_date: "2024-01-15T14:30:00Z",
      assessor_name: "査定員太郎",
      confidence_score: 85,
    };

    // 実行: 説明資料自動生成関数を呼び出す
    const result = generateAssessmentExplanationDocument(
      assessmentInput,
      outputDir
    );

    // 検証1: 返却値が正常なオブジェクトであること
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        document_id: expect.any(String),
        file_path: expect.any(String),
        generated_at: expect.any(String),
      })
    );

    // 検証2: 生成されたファイルが出力ディレクトリに存在すること
    expect(fs.existsSync(result.file_path)).toBe(true);

    // 検証3: ファイルの形式が正しいこと（PDF形式）
    const fileName = path.basename(result.file_path);
    expect(fileName).toMatch(/\.pdf$/);

    // 検証4: 生成ファイルのサイズが0より大きいこと
    const fileStats = fs.statSync(result.file_path);
    expect(fileStats.size).toBeGreaterThan(0);

    // 検証5: 返却オブジェクトに必須メタデータが含まれていること
    expect(result.document_id).toMatch(/^DOC-/);
    expect(new Date(result.generated_at).getTime()).toBeCloseTo(
      new Date("2024-01-15T14:30:00Z").getTime(),
      -3
    );

    // 検証6: 乖離額・乖離率が正確に計算・記録されていること
    expect(result.divergence_data).toEqual(
      expect.objectContaining({
        amount: 500000,
        rate_percent: 10.0,
        reference_count: 12,
      })
    );

    // 検証7: グラフデータが正常に生成されていること
    expect(result.graph_data).toEqual(
      expect.objectContaining({
        graph_type: "bar",
        title: "相場乖離分析",
        x_axis_label: "評価基準",
        y_axis_label: "金額（円）",
        data_points: expect.any(Array),
      })
    );

    // 検証8: グラフデータの具体値検証
    expect(result.graph_data.data_points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "市場参考額",
          value: 5000000,
        }),
        expect.objectContaining({
          label: "提出見積額",
          value: 5500000,
        }),
      ])
    );

    // 検証9: 判定根拠が論理的かつ明確に記載されていること
    expect(result.assessment_basis).toEqual(
      expect.objectContaining({
        reason_text: expect.stringContaining("地域の労務費上昇"),
        confidence_score: 85,
        data_source: "物価本2024年1月版",
      })
    );

    // 検証10: 補正係数が適切に記録されていること
    expect(result.correction_details).toEqual(
      expect.objectContaining({
        applied_factor: 1.05,
        factor_description: expect.stringContaining("5%"),
      })
    );

    // 検証11: フォーマット・レイアウト情報が含まれていること
    expect(result.formatting).toEqual(
      expect.objectContaining({
        template_version: expect.any(String),
        page_count: expect.any(Number),
        encoding: "UTF-8",
      })
    );

    // 検証12: ページ数が1以上であること
    expect(result.formatting.page_count).toBeGreaterThanOrEqual(1);

    // 検証13: 査定員情報が正確に記録されていること
    expect(result.assessor_info).toEqual(
      expect.objectContaining({
        assessor_name: "査定員太郎",
        assessment_date: "2024-01-15T14:30:00Z",
      })
    );

    // 検証14: プロジェクト情報が完全に記録されていること
    expect(result.project_info).toEqual(
      expect.objectContaining({
        project_name: "新築工事A",
        construction_type: "新築建築工事",
        assessment_id: "ASS-20240115-001",
      })
    );

    // 検証15: 生成完了時刻が妥当なISO8601形式であること
    expect(result.generated_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 検証16: ドキュメントIDの形式が正しいこと
    expect(result.document_id).toMatch(/^DOC-\d{14}-[A-Z0-9]{8}$/);

    // 検証17: ファイルパスが絶対パスであること
    expect(path.isAbsolute(result.file_path)).toBe(true);

    // 検証18: 返却オブジェクトにすべての必須キーが含まれていること
    const requiredKeys = [
      "success",
      "document_id",
      "file_path",
      "generated_at",
      "divergence_data",
      "graph_data",
      "assessment_basis",
      "correction_details",
      "formatting",
      "assessor_info",
      "project_info",
    ];
    requiredKeys.forEach((key) => {
      expect(result).toHaveProperty(key);
    });

    // 検証19: 相場参考額がnullまたはundefinedでないこと
    expect(result.divergence_data).not.toBeNull();
    expect(result.divergence_data).not.toBeUndefined();

    // 検証20: グラフの複数データポイントが存在すること
    expect(result.graph_data.data_points.length).toBeGreaterThanOrEqual(2);

    // 検証21: 乖離率が10.0%であることを確認
    expect(result.divergence_data.rate_percent).toBe(10.0);

    // 検証22: 乖離額が500000円であることを確認
    expect(result.divergence_data.amount).toBe(500000);

    // 検証23: 信頼度スコアが85であることを確認
    expect(result.assessment_basis.confidence_score).toBe(85);

    // 検証24: 補正係数が1.05であることを確認
    expect(result.correction_details.applied_factor).toBe(1.05);

    // 検証25: 参照案件数が12であることを確認
    expect(result.divergence_data.reference_count).toBe(12);
  });
});