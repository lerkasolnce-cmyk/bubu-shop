import { describe, expect, it } from "vitest";
import manifest from "../src/app/manifest";
import ua from "../src/lib/i18n/dict.ua.json";
import ru from "../src/lib/i18n/dict.ru.json";
import it_ from "../src/lib/i18n/dict.it.json";
import en from "../src/lib/i18n/dict.en.json";

describe("PWA manifest", () => {
  const m = manifest();

  it("устанавливаемый: standalone + start_url + имя", () => {
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBe("bu-bu");
  });

  it("иконки: 192, 512 и maskable 512", () => {
    const bySrc = new Map(m.icons?.map((i) => [i.src, i]));
    expect(bySrc.get("/icons/icon-192.png")?.sizes).toBe("192x192");
    expect(bySrc.get("/icons/icon-512.png")?.sizes).toBe("512x512");
    expect(bySrc.get("/icons/icon-512-maskable.png")?.purpose).toBe("maskable");
  });
});

describe("словари i18n", () => {
  // Конвенция проекта: плоские ключи, наборы идентичны во всех 4 локалях.
  it("наборы ключей идентичны во всех локалях", () => {
    const keys = Object.keys(ua).sort();
    expect(Object.keys(ru).sort()).toEqual(keys);
    expect(Object.keys(it_).sort()).toEqual(keys);
    expect(Object.keys(en).sort()).toEqual(keys);
  });

  it("ключи install.* присутствуют", () => {
    for (const dict of [ua, ru, it_, en] as Record<string, string>[]) {
      expect(dict["install.app"]).toBeTruthy();
      expect(dict["install.ios"]).toBeTruthy();
    }
  });
});
