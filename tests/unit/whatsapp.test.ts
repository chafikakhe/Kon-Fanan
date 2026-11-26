import { describe, expect, it } from "vitest";
import { normalizeWhatsApp, whatsappURL } from "../../src/lib/whatsapp";
import { seedDemo, scopeDemo, demoUser } from "../../src/lib/demo";

describe("Contact WhatsApp privé", () => {
  it("accepte les mobiles marocains et les formats internationaux", () => {
    for (const number of [
      "06 12 34 56 78",
      "+212 612345678",
      "00212-612345678",
    ])
      expect(normalizeWhatsApp(number)).toBe("+212612345678");
    expect(normalizeWhatsApp("+33 6 12 34 56 78")).toBe("+33612345678");
    for (const bad of [
      "",
      "123",
      "javascript:alert(1)",
      "+00012345678",
      "+212<script>",
    ])
      expect(() => normalizeWhatsApp(bad)).toThrow();
  });
  it("encode les messages et ne partage pas les contacts avec les professeurs", () => {
    expect(whatsappURL("0612345678", "Bonjour & bienvenue")).toBe(
      "https://wa.me/212612345678?text=Bonjour%20%26%20bienvenue",
    );
    const data = seedDemo();
    expect(scopeDemo(data, demoUser("teacher", data)).student_contacts).toEqual(
      [],
    );
    expect(
      scopeDemo(data, demoUser("student", data)).student_contacts.every(
        (c) => c.student_id === demoUser("student", data).id,
      ),
    ).toBe(true);
  });
});
