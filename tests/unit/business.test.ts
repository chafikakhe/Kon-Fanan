import { describe, it, expect } from "vitest";
import { formatInTimeZone } from "date-fns-tz";
import { videoURL, validateFiles, localToISO } from "../../src/lib/utils";
import { seedDemo, scopeDemo, demoUser, demoID } from "../../src/lib/demo";
describe("Entrées du navigateur", () => {
  it("normalise uniquement les fournisseurs vidéo autorisés", () => {
    expect(videoURL("https://youtu.be/abcdefghijk")).toEqual({
      provider: "youtube",
      id: "abcdefghijk",
    });
    expect(videoURL("https://vimeo.com/123456789")).toEqual({
      provider: "vimeo",
      id: "123456789",
    });
    for (const url of [
      "javascript:alert(1)",
      "http://youtube.com/watch?v=abcdefghijk",
      "https://youtube.com.evil.test/watch?v=abcdefghijk",
      '<iframe src="x"></iframe>',
      "https://youtu.be/invalid",
    ])
      expect(videoURL(url)).toBeNull();
  });
  it("refuse les formats et les quotas invalides avant envoi", () => {
    const f = (type: string, size: number) =>
      ({ type, size, name: "fixture" }) as File;
    expect(validateFiles([f("text/html", 200)])).toContain("JPEG");
    expect(validateFiles([f("image/png", 11 * 1024 * 1024)])).toContain(
      "taille",
    );
    expect(
      validateFiles(Array.from({ length: 6 }, () => f("image/jpeg", 100))),
    ).toContain("5 fichiers");
    expect(
      validateFiles([
        f("application/pdf", 20 * 1024 * 1024),
        f("image/png", 10 * 1024 * 1024),
        f("image/jpeg", 1),
      ]),
    ).toContain("30 Mo");
    expect(validateFiles([f("application/pdf", 100)])).toBeNull();
  });
  it("préserve le fuseau Casablanca pendant les changements de décalage", () => {
    for (const local of [
      "2026-01-10T17:30",
      "2026-03-01T17:30",
      "2026-04-10T17:30",
    ])
      expect(
        formatInTimeZone(
          localToISO(local),
          "Africa/Casablanca",
          "yyyy-MM-dd'T'HH:mm",
        ),
      ).toBe(local);
    expect(localToISO("2026-01-10T17:30").slice(11, 16)).not.toBe(
      localToISO("2026-03-01T17:30").slice(11, 16),
    );
  });
});
describe("Démonstration explicitement isolée", () => {
  it("limite Salma aux mathématiques de sa classe et masque les brouillons", () => {
    const d = seedDemo(),
      scoped = scopeDemo(d, demoUser("student", d));
    expect(scoped.class_subjects.map((x) => x.subject_id)).toEqual([
      demoID(40),
    ]);
    expect(scoped.courses.every((c) => c.status === "published")).toBe(true);
    expect(scoped.meetings).toHaveLength(0);
    expect(scoped.submissions.every((s) => s.student_id === demoID(1))).toBe(
      true,
    );
  });
  it("garde les copies du second professeur séparées", () => {
    const d = seedDemo(),
      scoped = scopeDemo(d, demoUser("teacher", d));
    expect(scoped.submissions.some((s) => s.exercise_id === demoID(121))).toBe(
      false,
    );
    expect(
      scoped.teaching_spaces.every((s) => s.teacher_id === demoID(2)),
    ).toBe(true);
  });
});
