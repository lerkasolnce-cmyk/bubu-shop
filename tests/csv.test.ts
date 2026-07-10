import { describe, it, expect } from "vitest";
import { parseProductsCsv, productsToCsv, CSV_COLUMNS, type ProductCsvRow } from "@/lib/csv";

const HEADER = CSV_COLUMNS.join(",");

function csv(...lines: string[]): string {
  return [HEADER, ...lines].join("\r\n");
}

describe("parseProductsCsv", () => {
  it("parses a valid 3-row file, including quoted commas and cyrillic text", () => {
    const text = csv(
      `krisla-1,"Крісло, дитяче",Кресло детское,Bubu,mebli,1500,,in_stock,1,0,Опис укр,Опис рус`,
      `stil-2,Стіл,Стол,Anex,mebli,2500,3000,preorder,0,1,,`,
      `lampa-3,Лампа,Лампа,Cybex,svitlo,100,,out_of_stock,,,,`
    );

    const { rows, errors } = parseProductsCsv(text);

    expect(errors).toEqual([]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual<ProductCsvRow>({
      slug: "krisla-1",
      name_ua: "Крісло, дитяче",
      name_ru: "Кресло детское",
      brand: "Bubu",
      category_slug: "mebli",
      price: 1500,
      old_price: null,
      stock_status: "in_stock",
      is_hit: true,
      is_sale: false,
      description_ua: "Опис укр",
      description_ru: "Опис рус",
    });
    expect(rows[1]).toMatchObject({ slug: "stil-2", old_price: 3000, stock_status: "preorder", is_hit: false, is_sale: true });
    expect(rows[2]).toMatchObject({ slug: "lampa-3", old_price: null, stock_status: "out_of_stock", is_hit: false, is_sale: false });
  });

  it("handles a UTF-8 BOM at the start of the file", () => {
    const text = "﻿" + csv(`slug-1,Назва,Название,Bubu,mebli,100,,in_stock,,,,`);
    const { rows, errors } = parseProductsCsv(text);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe("slug-1");
  });

  it("handles CRLF line endings", () => {
    const text =
      HEADER +
      "\r\n" +
      "slug-a,A ua,A ru,Bubu,mebli,100,,in_stock,,,,\r\n" +
      "slug-b,B ua,B ru,Bubu,mebli,200,,in_stock,,,,\r\n";
    const { rows, errors } = parseProductsCsv(text);
    expect(errors).toEqual([]);
    expect(rows.map((r) => r.slug)).toEqual(["slug-a", "slug-b"]);
  });

  it("reports a single header error and no rows when a required column is missing", () => {
    const badHeader = CSV_COLUMNS.filter((c) => c !== "price").join(",");
    const text = [badHeader, `slug-1,A ua,A ru,Bubu,mebli,in_stock,,,,`].join("\r\n");
    const { rows, errors } = parseProductsCsv(text);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/price/);
  });

  it("reports row errors with correct 1-based row numbers for bad prices", () => {
    const text = csv(
      `ok-1,A ua,A ru,Bubu,mebli,100,,in_stock,,,,`,
      `bad-2,B ua,B ru,Bubu,mebli,abc,,in_stock,,,,`,
      `bad-3,C ua,C ru,Bubu,mebli,-5,,in_stock,,,,`,
      `bad-4,D ua,D ru,Bubu,mebli,10.5,,in_stock,,,,`
    );
    const { rows, errors } = parseProductsCsv(text);
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe("ok-1");
    expect(errors).toHaveLength(3);
    expect(errors[0]).toContain("2");
    expect(errors[1]).toContain("3");
    expect(errors[2]).toContain("4");
  });

  it("rejects an unknown stock_status and defaults an empty one to in_stock", () => {
    const text = csv(
      `ok-1,A ua,A ru,Bubu,mebli,100,,,,,,`,
      `bad-2,B ua,B ru,Bubu,mebli,100,,discontinued,,,,`
    );
    const { rows, errors } = parseProductsCsv(text);
    expect(rows).toHaveLength(1);
    expect(rows[0].stock_status).toBe("in_stock");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("2");
  });

  it("accepts is_hit/is_sale variants (1/true/yes/TRUE -> true; 0/false/no/'' -> false)", () => {
    const text = csv(
      `a,A ua,A ru,Bubu,mebli,100,,in_stock,1,0,,`,
      `b,B ua,B ru,Bubu,mebli,100,,in_stock,true,false,,`,
      `c,C ua,C ru,Bubu,mebli,100,,in_stock,yes,no,,`,
      `d,D ua,D ru,Bubu,mebli,100,,in_stock,TRUE,FALSE,,`,
      `e,E ua,E ru,Bubu,mebli,100,,in_stock,,,,`
    );
    const { rows, errors } = parseProductsCsv(text);
    expect(errors).toEqual([]);
    expect(rows.map((r) => r.is_hit)).toEqual([true, true, true, true, false]);
    expect(rows.map((r) => r.is_sale)).toEqual([false, false, false, false, false]);
  });

  it("flags a duplicate slug on the later row, keeping the first", () => {
    const text = csv(
      `dup,A ua,A ru,Bubu,mebli,100,,in_stock,,,,`,
      `other,B ua,B ru,Bubu,mebli,200,,in_stock,,,,`,
      `dup,C ua,C ru,Bubu,mebli,300,,in_stock,,,,`
    );
    const { rows, errors } = parseProductsCsv(text);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.slug)).toEqual(["dup", "other"]);
    expect(rows[0].price).toBe(100);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("3");
  });

  it("caps errors at 100 with a summary line for the rest", () => {
    const lines = Array.from({ length: 120 }, (_, i) => `slug-${i},A ua,A ru,Bubu,mebli,abc,,in_stock,,,,`);
    const text = csv(...lines);
    const { rows, errors } = parseProductsCsv(text);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(101);
    expect(errors[100]).toContain("20");
  });
});

describe("productsToCsv", () => {
  it("round-trips through parseProductsCsv", () => {
    const input: ProductCsvRow[] = [
      {
        slug: "a-1",
        name_ua: "Назва, з комою",
        name_ru: 'Название "в кавычках"',
        brand: "Bubu",
        category_slug: "mebli",
        price: 1234,
        old_price: null,
        stock_status: "in_stock",
        is_hit: true,
        is_sale: false,
        description_ua: "Опис\nз новим рядком",
        description_ru: "",
      },
      {
        slug: "b-2",
        name_ua: "Другий",
        name_ru: "Второй",
        brand: "Anex",
        category_slug: "svitlo",
        price: 500,
        old_price: 700,
        stock_status: "preorder",
        is_hit: false,
        is_sale: true,
        description_ua: "",
        description_ru: "",
      },
    ];

    const out = productsToCsv(input);
    expect(out.startsWith("﻿")).toBe(true);

    const { rows, errors } = parseProductsCsv(out);
    expect(errors).toEqual([]);
    expect(rows).toEqual(input);
  });
});
