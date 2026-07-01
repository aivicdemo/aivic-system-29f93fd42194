import { validateContractChange } from "../../src/logic/it-1781935279444-2-1-1";

describe("契約変更内容の必須項目検証機能", () => {
  test("SCEN-1231: 変更内容の必須項目がすべて空文字列の場合、検証エラーが発生する", () => {
    const contractChangeData = {
      contractorName: "",
      changeDescription: "",
      changeDate: "",
      changeReason: "",
      effectiveDate: "",
    };

    const result = validateContractChange(contractChangeData);

    expect(result.hasError).toBe(true);
    expect(result.errorCode).toBe("VALIDATION_ERROR");
    expect(result.statusCode).toBe(400);
    expect(result.errors).toHaveLength(5);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "contractorName",
          message: expect.stringContaining("契約者名"),
        }),
        expect.objectContaining({
          field: "changeDescription",
          message: expect.stringContaining("変更内容"),
        }),
        expect.objectContaining({
          field: "changeDate",
          message: expect.stringContaining("変更日付"),
        }),
        expect.objectContaining({
          field: "changeReason",
          message: expect.stringContaining("変更理由"),
        }),
        expect.objectContaining({
          field: "effectiveDate",
          message: expect.stringContaining("有効日"),
        }),
      ])
    );
  });
});