// ניסוח המכתב מתוך הפרטים שהמשתמש מילא. הכול רץ בדפדפן, בלי שרת.
(function () {
  // תכונות שאפשר לבחור, והביטוי שנכנס למכתב
  var QUALITIES = [
    { id: "patience", label: "סבלנות", phrase: "בסבלנות רבה" },
    { id: "kindness", label: "אדיבות", phrase: "באדיבות ובחיוך" },
    { id: "professional", label: "מקצועיות", phrase: "במקצועיות ובידע רב" },
    { id: "personal", label: "יחס אישי", phrase: "ביחס אישי וחם" },
    { id: "listening", label: "הקשבה", phrase: "בהקשבה אמיתית" },
    { id: "clarity", label: "הסבר ברור", phrase: "בהסבר ברור ומפורט" },
    { id: "efficiency", label: "יעילות ומהירות", phrase: "ביעילות ובמהירות" },
    { id: "extra", label: "מעבר לנדרש", phrase: "במאמץ שחרג הרבה מעבר לנדרש" }
  ];

  var DEDICATION =
    "מכתב זה נכתב באמצעות \"תודה תודה\", מיזם לזכרה של שושנה כהנא ז\"ל, " +
    "שהקפידה לשלוח מכתבי תודה והערכה לכל מי שנתן לה שירות טוב.";

  // בחירת צורת זכר/נקבה לפי מגדר הפקיד/ה
  function g(isF, m, f) { return isF ? f : m; }

  // "א, ב וג"
  function joinHe(list) {
    if (list.length === 0) return "";
    if (list.length === 1) return list[0];
    return list.slice(0, -1).join(", ") + " ו" + list[list.length - 1];
  }

  // מוסיף נקודה בסוף משפט אם חסר סימן פיסוק
  function sentence(text) {
    text = (text || "").trim();
    if (!text) return "";
    return /[.!?…]$/.test(text) ? text : text + ".";
  }

  // "ב" + "המוסד" → "במוסד" (הה' הידיעה נבלעת)
  function inPlace(word) {
    return "ב" + (word.charAt(0) === "ה" ? word.slice(1) : word);
  }

  function formatDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    if (p.length !== 3) return "";
    return Number(p[2]) + "." + Number(p[1]) + "." + p[0];
  }

  function build(d) {
    var f = d.clerkGender === "f";
    var name = d.clerkName.trim();
    var honor = g(f, "מר", "גב'");
    var office = d.officeName.trim();
    var date = formatDate(d.serviceDate);
    var phrases = QUALITIES
      .filter(function (q) { return d.qualities.indexOf(q.id) !== -1; })
      .map(function (q) { return q.phrase; });
    var how = phrases.length ? joinHe(phrases) : "במסירות ובמקצועיות";

    // שורת התיאור של הפקיד/ה: שם, תפקיד, סניף
    var who = honor + " " + name;
    if (d.role.trim()) who += ", " + d.role.trim();
    if (d.branch.trim()) who += ", " + d.branch.trim();

    var subject = "מכתב הוקרה ותודה ל" + honor + " " + name + (office ? " – " + office : "");
    var lines = [];

    if (d.tone === "short") {
      lines.push("לכבוד " + (office || "הממונים"));
      lines.push("");
      lines.push("שלום רב,");
      lines.push("");
      var short = [
        "ברצוני לומר תודה גדולה ל" + who + ", " + g(f, "שטיפל", "שטיפלה") + " בי" +
        (date ? " ב-" + date : "") + " " + how + "."
      ];
      if (d.story.trim()) short.push(sentence(d.story));
      if (d.impact.trim()) short.push(sentence(d.impact));
      lines.push(short.join(" "));
      lines.push("");
      lines.push(
        name + " " + g(f, "הוא", "היא") + " דוגמה לשירות במיטבו. אודה אם תעבירו את התודה " +
        g(f, "אליו", "אליה") + " ולממונים " + g(f, "עליו", "עליה") + "."
      );
    } else {
      lines.push("לכבוד");
      lines.push("יחידת פניות הציבור");
      if (office) lines.push(office);
      lines.push("");
      lines.push("הנדון: " + subject);
      lines.push("");
      lines.push("שלום רב,");
      lines.push("");
      lines.push(
        "ברצוני להביע את הוקרתי ואת תודתי העמוקה ל" + who +
        ", על השירות המצוין שקיבלתי " + (date ? "ביום " + date : "לאחרונה") + "."
      );
      lines.push("");
      var para = [];
      if (d.topic.trim()) para.push("פניתי בנושא " + sentence(d.topic));
      para.push(name + " " + g(f, "טיפל", "טיפלה") + " בפנייתי " + how + ".");
      if (d.story.trim()) para.push(sentence(d.story));
      if (d.impact.trim()) para.push(sentence(d.impact));
      lines.push(para.join(" "));
      lines.push("");
      lines.push(
        "פעמים רבות כותבים רק כשמשהו משתבש, ולכן חשוב לי לכתוב גם כשהדברים נעשים כראוי. " +
        name + " " + g(f, "הוא", "היא") + " דוגמה לשירות ציבורי במיטבו, " +
        "ושירות כזה מחזק את אמון הציבור" + (office ? " " + inPlace(office) : "") + "."
      );
      lines.push("");
      lines.push(
        "אבקש להעביר מכתב זה ל" + name + " ולממונים " + g(f, "עליו", "עליה") +
        ", ולתייק אותו " + g(f, "בתיקו", "בתיקה") + " האישי."
      );
    }

    lines.push("");
    lines.push(d.tone === "short" ? "בתודה," : "בברכה ובהוקרה,");
    lines.push(d.writerName.trim());
    if (d.city.trim()) lines.push(d.city.trim());
    if (d.contact.trim()) lines.push(d.contact.trim());

    if (d.dedication) {
      lines.push("");
      lines.push("―――");
      lines.push(DEDICATION);
    }

    return { subject: subject, body: lines.join("\n") };
  }

  window.Letter = { QUALITIES: QUALITIES, build: build, formatDate: formatDate };
})();
