#!/usr/bin/env node
// בונה את גרסאות השפה של האתר (למשל /ar/ ו-/ru/) מתוך הדף העברי.
// הדף העברי הוא המקור היחיד: כל משפט עברי מוחלף בתרגום מתוך i18n/<lang>/strings.json.
// משפט שאין לו תרגום נשאר בעברית, והסקריפט מדפיס אזהרה.
//
// שימוש:
//   node tools/build-i18n.js            בונה את כל השפות לתיקיות ar/ ו-ru/
//   node tools/build-i18n.js --extract  כותב את i18n/catalog.json: כל המשפטים העבריים לתרגום
//
// רץ אוטומטית בפרסום (‎.github/workflows/pages.yml), ולכן התיקיות ar/ ו-ru/ לא נשמרות במאגר.
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var SITE = "https://todotoda.azma.app/";
var HEB = /[֐-׿]/;
var ATTRS = ["placeholder", "aria-label", "title", "alt", "content", "data-ph-clerk", "data-ph-medical"];
var JS_FILES = ["js/app.js", "js/contact.js"];

function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }
function write(p, s) {
  var full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, s);
}

// --- איסוף המשפטים העבריים ---

// טקסט בין תגיות, בלי תוכן של <script> (את ה-JSON-LD מטפלים בנפרד)
function eachTextNode(html, fn) {
  return html.replace(/(<script\b[^>]*>[\s\S]*?<\/script>)|>([^<]+)(?=<)/g, function (m, script, text) {
    if (script) return script;
    var t = text.trim();
    if (!t || !HEB.test(t)) return m;
    var out = fn(t);
    return ">" + text.replace(t, function () { return out; });
  });
}

function eachAttr(html, fn) {
  var re = new RegExp('(\\s(?:' + ATTRS.join("|") + ')=")([^"]*)"', "g");
  return html.replace(re, function (m, pre, val) {
    if (!HEB.test(val)) return m;
    return pre + fn(val) + '"';
  });
}

function eachJsonLd(html, fn) {
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, function (m, a, json, b) {
    var data = JSON.parse(json);
    (function walk(o) {
      Object.keys(o).forEach(function (k) {
        if (typeof o[k] === "string" && HEB.test(o[k])) o[k] = fn(o[k]);
        else if (o[k] && typeof o[k] === "object") walk(o[k]);
      });
    })(data);
    return a + "\n" + JSON.stringify(data, null, 1) + "\n  " + b;
  });
}

// מחרוזות בקוד: "..." עם עברית. הערות לא נוגעות (רק מחרוזות במירכאות כפולות).
function eachJsString(src, fn) {
  return src.replace(/"((?:[^"\\\n]|\\.)*)"/g, function (m, body) {
    var value;
    try { value = JSON.parse(m); } catch (e) { return m; }
    if (!HEB.test(value)) return m;
    var out = fn(value);
    return out === value ? m : JSON.stringify(out);
  });
}

function extract() {
  var seen = {};
  var list = [];
  function add(s, where) {
    if (seen[s]) { if (seen[s].where.indexOf(where) === -1) seen[s].where.push(where); return s; }
    seen[s] = { he: s, where: [where] };
    list.push(seen[s]);
    return s;
  }
  var html = read("index.html");
  eachTextNode(html, function (t) { return add(t, "index.html"); });
  eachAttr(html, function (t) { return add(t, "index.html (attr)"); });
  eachJsonLd(html, function (t) { return add(t, "index.html (json-ld)"); });
  JS_FILES.forEach(function (f) { eachJsString(read(f), function (t) { return add(t, f); }); });
  write("i18n/catalog.json", JSON.stringify(list, null, 1) + "\n");
  console.log("catalog: " + list.length + " strings -> i18n/catalog.json");
}

// --- בנייה ---

function build(lang) {
  var dir = "i18n/" + lang;
  var cfg = JSON.parse(read(dir + "/config.json"));
  var dict = JSON.parse(read(dir + "/strings.json"));
  var missing = {};
  function t(s) {
    if (Object.prototype.hasOwnProperty.call(dict, s) && dict[s]) return dict[s];
    missing[s] = true;
    return s;
  }
  var url = SITE + lang + "/";

  var html = read("index.html");
  html = eachJsonLd(eachAttr(eachTextNode(html, t), t), t);

  html = html
    .replace('<html lang="he" dir="rtl">', '<html lang="' + lang + '" dir="' + cfg.dir + '">')
    .replace('<link rel="canonical" href="' + SITE + '">', '<link rel="canonical" href="' + url + '">')
    .replace('<meta property="og:url" content="' + SITE + '">', '<meta property="og:url" content="' + url + '">')
    .replace('<meta property="og:locale" content="he_IL">', '<meta property="og:locale" content="' + cfg.ogLocale + '">')
    // קבצים משותפים נמצאים תיקייה אחת למעלה; app.js ו-contact.js מתורגמים ונמצאים בתיקיית השפה
    .replace(/(href|src)="(css\/|fonts\/|favicon\.svg|apple-touch-icon\.png|js\/(?:stats|offices|letter)\.js)/g, '$1="../$2')
    .replace('<script src="js/app.js"></script>',
      '<script src="js/offices-i18n.js"></script>\n  <script src="js/letter-local.js"></script>\n  <script src="js/app.js"></script>')
    .replace(/href="https:\/\/todotoda\.azma\.app\/"(\s+dir="ltr")?>todotoda\.azma\.app</g,
      'href="' + url + '"$1>todotoda.azma.app/' + lang + '<')
    // מעבר לעברית בתפריט העליון
    .replace(/(<nav aria-label="[^"]*">)/, '$1\n        <a href="../" lang="he" class="lang-switch">עברית</a>');

  html = html
    .replace(/"inLanguage": "he"/g, '"inLanguage": "' + lang + '"')
    .replace(/"(url|@id)": "https:\/\/todotoda\.azma\.app\/(#[a-z]+)?"/g, '"$1": "' + url + '$2"');

  if (!cfg.public) {
    // עד לבדיקה של דובר/ת שפת אם: הדף לא מופיע בגוגל
    html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta name="robots" content="noindex">');
  }
  write(lang + "/index.html", html);

  JS_FILES.forEach(function (f) {
    write(lang + "/" + f, eachJsString(read(f), function (s) {
      return (cfg.keepHebrew || []).indexOf(s) !== -1 ? s : t(s);
    }));
  });
  write(lang + "/js/offices-i18n.js", read(dir + "/offices.js"));
  write(lang + "/js/letter-local.js", read(dir + "/letter.js"));

  var miss = Object.keys(missing);
  console.log(lang + ": built" + (cfg.public ? "" : " (noindex)") +
    (miss.length ? ", " + miss.length + " strings without translation (kept in Hebrew):" : ", all strings translated"));
  miss.forEach(function (s) { console.log("  - " + s.slice(0, 80)); });
}

if (process.argv.indexOf("--extract") !== -1) {
  extract();
} else {
  fs.readdirSync(path.join(ROOT, "i18n")).forEach(function (name) {
    if (fs.existsSync(path.join(ROOT, "i18n", name, "config.json"))) build(name);
  });
}
