import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSitemapXml } from "../utils/seo.js";
import {
  BUSINESS_EMAIL,
  BUSINESS_ADDRESS,
  GRIEVANCE_OFFICER_NAME,
} from "../../frontend/src/constants/businessInfo.js";

const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");
const frontend = (file) => read(`../../frontend/src/${file}`);

test("sitemap lists both legal pages exactly once", () => {
  const xml = buildSitemapXml({ siteUrl: "https://alyonabags.com" });
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locations.filter((url) => url === "https://alyonabags.com/privacy").length, 1);
  assert.equal(locations.filter((url) => url === "https://alyonabags.com/terms-and-conditions").length, 1);
});

test("verified business details match what the owner supplied", () => {
  assert.equal(BUSINESS_EMAIL, "alyonabagspvt@gmail.com");
  assert.match(BUSINESS_ADDRESS, /Harsukh Block, A-41, Street Number 2/);
  assert.match(BUSINESS_ADDRESS, /Delhi – 110086, India$/);
  // No invented officer name: stays empty until the owner confirms one.
  assert.equal(GRIEVANCE_OFFICER_NAME, "");
});

test("terms route is wired into the app, route SEO, and server-rendered metadata", () => {
  assert.match(frontend("App.jsx"), /path="\/terms-and-conditions"/);
  assert.match(frontend("components/RouteSeo.jsx"), /"\/terms-and-conditions"/);
  const server = read("../server.js");
  assert.match(server, /"\/terms-and-conditions": \{ title: "Terms & Conditions \| Alyona Bags"/);
  assert.match(server, /"\/privacy": \{ title: "Privacy Policy \| Alyona Bags"/);
});

test("legal pages do not contain invented phone numbers or the old unverified email", () => {
  for (const file of ["pages/Privacy.jsx", "pages/Terms.jsx", "constants/businessInfo.js"]) {
    const source = frontend(file);
    assert.doesNotMatch(source, /hello@alyonabags/, file);
    assert.doesNotMatch(source, /(?:\+91[\s-]?)?[6-9]\d{9}\b/, file);
  }
});

test("terms keep the 24-hour rule from becoming an absolute bar and avoid force majeure", () => {
  const terms = frontend("pages/Terms.jsx");
  assert.match(terms, /within 24 hours of delivery/);
  assert.match(terms, /not a bar to a genuine claim/);
  assert.match(terms, /Nothing in these terms\s+limits any right you have as a consumer/);
  assert.doesNotMatch(terms, /force majeure/i);
});

test("every enquiry form shows the privacy notice component with a Privacy Policy link", () => {
  for (const file of ["pages/Contact.jsx", "components/QuoteModal.jsx"]) {
    assert.match(frontend(file), /<PrivacyNotice \/>/, file);
  }
  const notice = frontend("components/PrivacyNotice.jsx");
  assert.match(notice, /We’ll use the information you provide to respond to your enquiry and provide customer support\./);
  assert.match(notice, /to="\/privacy"/);
});

test("footer links to both legal pages and the grievance section without duplicating them", () => {
  const footer = frontend("components/Footer.jsx");
  assert.equal((footer.match(/to="\/privacy"/g) || []).length, 1);
  assert.equal((footer.match(/to="\/terms-and-conditions"/g) || []).length, 1);
  assert.match(footer, /\/contact#grievance/);
});
