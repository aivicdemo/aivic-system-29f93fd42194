import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証機能", () => {
  // SCEN-697: [edge] アポ確定状況が定義済みの選択肢のいずれかの場合に検証が合格する
  test("アポ確定状況が定義済み選択肢（確定・検討中・未定）のいずれかの場合に検証結果を返す", () => {
    // テストデータ準備：アポ確定状況が「確定」「検討中」「未定」のいずれかを含むレコードを複数件作成
    const salesDataRecords = [
      {
        recordId: "REC001",
        customerName: "顧客A",
        contactDate: "2024-01-15",
        appointmentStatus: "確定",
        contactContent: "商談内容1",
      },
      {
        recordId: "REC002",
        customerName: "顧客B",
        contactDate: "2024-01-16",
        appointmentStatus: "検討中",
        contactContent: "商談内容2",
      },
      {
        recordId: "REC003",
        customerName: "顧客C",
        contactDate: "2024-01-17",
        appointmentStatus: "未定",
        contactContent: "商談内容3",
      },
      {
        recordId: "REC004",
        customerName: "顧客D",
        contactDate: "2024-01-18",
        appointmentStatus: "",
        contactContent: "商談内容4",
      },
      {
        recordId: "REC005",
        customerName: "顧客E",
        contactDate: "2024-01-19",
        appointmentStatus: null,
        contactContent: "商談内容5",
      },
      {
        recordId: "REC006",
        customerName: "顧客F",
        contactDate: "2024-01-20",
        appointmentStatus: "無効な選択肢",
        contactContent: "商談内容6",
      },
    ];

    // 営業データの完全性・正確性自動検証機能を実行
    const validationResult = validateSalesDataCompleteness(salesDataRecords);

    // アポ確定状況が「確定」のレコードに対して検証を実行し、結果を確認
    expect(validationResult).toEqual(
      expect.objectContaining({
        totalRecords: 6,
        passedRecords: 3,
        failedRecords: 3,
        validRecords: [
          expect.objectContaining({
            recordId: "REC001",
            appointmentStatus: "確定",
            validationStatus: "合格",
          }),
          expect.objectContaining({
            recordId: "REC002",
            appointmentStatus: "検討中",
            validationStatus: "合格",
          }),
          expect.objectContaining({
            recordId: "REC003",
            appointmentStatus: "未定",
            validationStatus: "合格",
          }),
        ],
        invalidRecords: [
          expect.objectContaining({
            recordId: "REC004",
            appointmentStatus: "",
            validationStatus: "不合格",
            errorReason: expect.stringMatching(/アポ確定状況/),
          }),
          expect.objectContaining({
            recordId: "REC005",
            appointmentStatus: null,
            validationStatus: "不合格",
            errorReason: expect.stringMatching(/アポ確定状況/),
          }),
          expect.objectContaining({
            recordId: "REC006",
            appointmentStatus: "無効な選択肢",
            validationStatus: "不合格",
            errorReason: expect.stringMatching(/アポ確定状況/),
          }),
        ],
      })
    );

    // 全てのテストケースの検証結果を集計
    expect(validationResult.passedRecords).toBe(3);
    expect(validationResult.failedRecords).toBe(3);
    expect(validationResult.totalRecords).toBe(6);
    expect(validationResult.passRate).toBe(0.5);

    // アポ確定状況が「確定」「検討中」「未定」のいずれかである全てのレコードについて検証が合格
    expect(validationResult.validRecords).toHaveLength(3);
    expect(validationResult.validRecords.every((r) => r.validationStatus === "合格")).toBe(true);

    // 定義済みの選択肢以外の値を含むレコードについては検証が不合格
    expect(validationResult.invalidRecords).toHaveLength(3);
    expect(validationResult.invalidRecords.every((r) => r.validationStatus === "不合格")).toBe(true);
  });
});