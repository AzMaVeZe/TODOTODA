// ניסוח המכתב מתוך הפרטים שהמשתמש מילא. הכול רץ בדפדפן, בלי שרת.
(function () {
  // תכונות שאפשר לבחור, והביטוי שנכנס למכתב (בלי ו' פנימית, כדי שהרשימה תהיה קריאה)
  var QUALITIES = [
    { id: "patience", label: "סבלנות", phrase: "בסבלנות רבה" },
    { id: "kindness", label: "אדיבות", phrase: "באדיבות רבה" },
    { id: "professional", label: "מקצועיות", phrase: "במקצועיות רבה" },
    { id: "personal", label: "יחס אישי", phrase: "ביחס אישי וחם" },
    { id: "listening", label: "הקשבה", phrase: "בהקשבה אמיתית" },
    { id: "clarity", label: "הסבר ברור", phrase: "בהסברים ברורים" },
    { id: "efficiency", label: "יעילות", phrase: "ביעילות רבה" },
    { id: "extra", label: "מעבר לנדרש" } // נכנס כמשפט נפרד
  ];

  var CHANNELS = {
    front: "בקבלת הקהל",
    phone: "בשיחת טלפון",
    chat: "בצ'אט",
    email: "בהתכתבות"
  };

  var DEDICATION =
    "המכתב נשלח במסגרת \"תודה תודה\", לזכרה של שושנה כהנא ז\"ל, " +
    "שנהגה להודות בכתב על כל שירות טוב שקיבלה.";

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

  // אות שימוש לפני מילה: "ל-Dana" עם מקף כשהמילה לא מתחילה באות עברית
  function pre(letter, word) {
    return letter + (/^[\u05d0-\u05ea]/.test(word) ? "" : "-") + word;
  }

  // "ב" + שם הארגון. ה' הידיעה נבלעת רק בשמות מהמאגר ("במוסד לביטוח לאומי"),
  // כי בשם שהמשתמש הקליד ה' יכולה להיות חלק מהשם ("בהדסה").
  function inPlace(name, fromList) {
    if (fromList && name.charAt(0) === "ה") return "ב" + name.slice(1);
    return pre("ב", name);
  }

  function formatDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    if (p.length !== 3) return "";
    return Number(p[2]) + "." + Number(p[1]) + "." + p[0];
  }

  // איך פונים לפקיד/ה: בפעם הראשונה (toFirst כולל ל'), ובהמשך המכתב
  function names(d, f) {
    var full = d.clerkName.trim().replace(/\s+/g, " ");
    if (!full) {
      var who = g(f, "הפקיד", "הפקידה");
      var desc = who + " " + g(f, "שקיבל", "שקיבלה") + " אותי";
      return { first: desc, toFirst: "ל" + desc.slice(1), later: who, known: false };
    }
    var parts = full.split(" ");
    if (parts.length === 1) {
      // שם פרטי בלבד: "לפקידה רונית", בלי "גב'"
      return { first: g(f, "הפקיד", "הפקידה") + " " + full, toFirst: g(f, "לפקיד", "לפקידה") + " " + full, later: full, known: true };
    }
    var honor = g(f, "מר", "גב'");
    return { first: honor + " " + full, toFirst: "ל" + honor + " " + full, later: honor + " " + parts[parts.length - 1], known: true };
  }

  // פרטים שעוזרים ליחידה לזהות את העובד/ת
  function details(d) {
    var bits = [];
    if (d.branch.trim()) bits.push(d.branch.trim());
    if (d.station.trim()) bits.push(d.station.trim());
    return bits.join(", ");
  }

  function when(d) {
    var date = formatDate(d.serviceDate);
    var s = date ? "ביום " + date : "לאחרונה";
    if (date && d.serviceTime) s += " בשעה " + d.serviceTime;
    return s;
  }

  function build(d) {
    var f = d.clerkGender === "f";
    var n = names(d, f);
    var office = d.officeName.trim();
    var chosen = QUALITIES.filter(function (q) { return d.qualities.indexOf(q.id) !== -1; });
    var phrases = chosen.filter(function (q) { return q.phrase; }).map(function (q) { return q.phrase; });
    var extra = d.qualities.indexOf("extra") !== -1;
    var how = phrases.length ? joinHe(phrases) : "במסירות ובמקצועיות";
    var channel = CHANNELS[d.channel] || "";

    // "גב' רונית לוי, פקידת קבלת קהל (סניף באר שבע, עמדה 4)"
    var who = n.toFirst;
    if (d.role.trim()) who += ", " + d.role.trim();
    var det = details(d);
    if (det) who += " (" + det + ")";

    var subject = "מחמאה ומכתב הוקרה " + n.toFirst + (office ? " – " + office : "");
    var her = g(f, "אליו", "אליה");
    var onHer = g(f, "עליו", "עליה");
    var fileLine = g(f, "בתיק האישי שלו", "בתיק האישי שלה");
    var lines = [];

    lines.push("לכבוד");
    lines.push("יחידת פניות הציבור");
    if (office) lines.push(office);
    lines.push("");
    lines.push("הנדון: " + subject);
    lines.push("");
    lines.push("שלום רב,");
    lines.push("");

    if (d.tone === "short") {
      var short = [
        "ברצוני לומר תודה גדולה " + who + ", " + g(f, "שטיפל", "שטיפלה") + " בפנייתי " +
        when(d) + (channel ? " " + channel : "") + " " + how + "."
      ];
      if (d.topic.trim()) short.push("פניתי בנושא " + sentence(d.topic));
      if (extra) short.push(g(f, "הוא אף עשה", "היא אף עשתה") + " הרבה מעבר לנדרש.");
      if (d.story.trim()) short.push(sentence(d.story));
      if (d.impact.trim()) short.push(sentence(d.impact));
      lines.push(short.join(" "));
      lines.push("");
      lines.push(
        "אודה אם תעבירו את התודה " + her + " ואל הממונים " + onHer +
        ", ותתייקו את המכתב " + fileLine + "."
      );
    } else {
      lines.push(
        "ברצוני להודות מקרב לב " + who + ", על השירות המצוין שקיבלתי " + when(d) +
        (channel ? " " + channel : "") + "."
      );
      lines.push("");
      var para = [];
      if (d.topic.trim()) para.push("פניתי בנושא " + sentence(d.topic));
      var subj = n.known ? n.later : g(f, "הוא", "היא");
      para.push(subj + " " + g(f, "טיפל", "טיפלה") + " בפנייתי " + how +
        (extra ? ", " + g(f, "ואף עשה", "ואף עשתה") + " הרבה מעבר לנדרש" : "") + ".");
      if (d.story.trim()) para.push(sentence(d.story));
      if (d.impact.trim()) para.push(sentence(d.impact));
      lines.push(para.join(" "));
      lines.push("");
      lines.push(
        "לא פעם כותבים רק כשמשהו משתבש, ולכן חשוב לי לכתוב גם כשמקבלים שירות טוב. " +
        (n.known ? n.later + " " + g(f, "הוא", "היא") : g(f, "הוא", "היא")) +
        " דוגמה לשירות במיטבו, ושירות כזה מחזק את אמון הציבור" +
        (office ? " " + inPlace(office, d.officeFromList) : "") + "."
      );
      lines.push("");
      lines.push(
        "אודה לכם אם תעבירו מכתב זה " + her + ", לממונה הישיר ולמנהל/ת היחידה, " +
        "ותתייקו אותו " + fileLine + ". אשמח לאישור קצר על העברתו."
      );
    }

    lines.push("");
    lines.push(d.tone === "short" ? "בתודה," : "בברכה ובהוקרה,");
    lines.push(d.writerName.trim());
    if (d.city.trim()) lines.push(d.city.trim());
    // טלפון או מייל נשמרים בכיוון שמאל-לימין גם בתוך טקסט עברי (+972… לא יתהפך)
    if (d.contact.trim()) lines.push("\u2066" + d.contact.trim() + "\u2069");

    if (d.dedication) {
      lines.push("");
      lines.push("―――");
      lines.push(DEDICATION);
    }

    return { subject: subject, body: lines.join("\n") };
  }

  window.Letter = { QUALITIES: QUALITIES, build: build, formatDate: formatDate };
})();
