// ניהול הטופס: מעבר בין שלבים, בניית המכתב ואפשרויות השליחה.
(function () {
  // כתובת הדף הנוכחי (בעברית או בשפה אחרת), לקישורי שיתוף
  var canonical = document.querySelector('link[rel="canonical"]');
  var SITE_URL = canonical ? canonical.href : "https://todotoda.azma.app/";
  // בדפים בשפות אחרות: שמות הגופים בשפת הדף, ומכתב נוסף בשפת הכותב אחרי המכתב העברי
  var LANG = document.documentElement.lang || "he";
  var L10N = window.OFFICE_I18N || null;
  var MAILTO_SAFE_LENGTH = 1900; // מעבר לזה תוכנות מייל במחשב עלולות לקטוע את המכתב

  var form = document.getElementById("letter-form");
  var officeSel = document.getElementById("office");
  var officeNameWrap = document.getElementById("office-name-wrap");
  var officeNameInput = document.getElementById("officeName");
  var clerkNameInput = document.getElementById("clerkName");
  var noName = document.getElementById("noName");
  var panels = form.querySelectorAll(".step-panel");
  var stepItems = document.querySelectorAll(".steps li");
  var caption = document.getElementById("step-caption");
  var toast = document.getElementById("toast");
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = 1;

  // הטופס לא נשלח לשום מקום: Enter לא יעשה כלום
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  // --- מילוי רשימת המשרדים ---
  var officeById = {};
  var placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "בחרו משרד או ארגון";
  officeSel.appendChild(placeholder);
  window.OFFICES.forEach(function (group) {
    var og = document.createElement("optgroup");
    og.label = (L10N && L10N.groups[group.group]) || group.group;
    group.items.forEach(function (o) {
      if (group.medical) o.medical = true;
      officeById[o.id] = o;
      var opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = (L10N && L10N.names[o.id]) || o.name;
      og.appendChild(opt);
    });
    officeSel.appendChild(og);
  });

  // קישור כמו ?office=btl בוחר מראש את הארגון
  var preset = new URLSearchParams(location.search).get("office");
  if (preset && officeById[preset]) officeSel.value = preset;

  // בבית חולים: "איש/אשת צוות" במקום "פקיד/ה"
  var TERMS = {
    clerk: { gq: "פקיד או פקידה?", f: "פקידה", m: "פקיד", nm: "שם הפקיד/ה" },
    medical: { gq: "איש או אשת צוות?", f: "אשת צוות", m: "איש צוות", nm: "שם איש/אשת הצוות" }
  };
  function syncOfficeName() {
    var o = officeById[officeSel.value];
    officeNameWrap.hidden = !(o && o.askName);
    var kind = o && o.medical ? "medical" : "clerk";
    form.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = TERMS[kind][el.dataset.t]; });
    var role = document.getElementById("role");
    role.placeholder = role.dataset[kind === "medical" ? "phMedical" : "phClerk"];
  }
  officeSel.addEventListener("change", syncOfficeName);
  syncOfficeName();

  // אי אפשר לבחור תאריך עתידי
  var today = new Date();
  document.getElementById("serviceDate").max = today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

  noName.addEventListener("change", function () {
    clerkNameInput.disabled = noName.checked;
    if (noName.checked) clearError(clerkNameInput);
  });

  // --- תיבות התכונות ---
  var qWrap = document.getElementById("qualities");
  window.Letter.QUALITIES.forEach(function (q) {
    var label = document.createElement("label");
    label.className = "chip";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = "qualities";
    input.value = q.id;
    var span = document.createElement("span");
    span.textContent = (window.LetterLocal && window.LetterLocal.qualityLabels[q.id]) || q.label;
    label.append(input, " ", span);
    qWrap.appendChild(label);
  });

  // --- איסוף הנתונים ---
  function val(name) {
    var el = form.elements[name];
    return el && el.value ? el.value : "";
  }

  function checked(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function data() {
    var o = officeById[val("office")];
    return {
      office: o,
      officeName: o ? (o.askName ? val("officeName") : o.name) : "",
      officeFromList: !!(o && !o.askName),
      medical: !!(o && o.medical),
      clerkName: noName.checked ? "" : val("clerkName"),
      clerkGender: checked("clerkGender"),
      branch: val("branch"),
      station: val("station"),
      role: val("role"),
      serviceDate: val("serviceDate"),
      serviceTime: val("serviceTime"),
      channel: checked("channel"),
      topic: val("topic"),
      qualities: Array.prototype.map.call(
        form.querySelectorAll('input[name="qualities"]:checked'),
        function (c) { return c.value; }
      ),
      story: val("story"),
      impact: val("impact"),
      tone: checked("tone") || "formal",
      writerName: val("writerName"),
      city: val("city"),
      contact: val("contact"),
      dedication: document.getElementById("dedication").checked
    };
  }

  // --- שגיאות ליד השדה ---
  function errorEl(el) { return document.getElementById(el.id.replace(/-group$/, "") + "-err"); }

  function showError(el) {
    el.setAttribute("aria-invalid", "true");
    var err = errorEl(el);
    if (err) err.hidden = false;
  }

  function clearError(el) {
    el.removeAttribute("aria-invalid");
    var err = errorEl(el);
    if (err) err.hidden = true;
  }

  form.addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid")) clearError(e.target);
    if (e.target.name === "clerkGender") clearError(document.getElementById("clerkGender-group"));
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "clerkGender") clearError(document.getElementById("clerkGender-group"));
    if (e.target === officeSel) clearError(officeSel);
  });

  function validate(step) {
    var bad = [];
    if (step === 1) {
      if (!officeSel.value) bad.push(officeSel);
      if (!officeNameWrap.hidden && !officeNameInput.value.trim()) bad.push(officeNameInput);
      if (!checked("clerkGender")) bad.push(document.getElementById("clerkGender-group"));
      if (!noName.checked && !clerkNameInput.value.trim()) bad.push(clerkNameInput);
    }
    if (step === 3 && !form.elements.writerName.value.trim()) bad.push(form.elements.writerName);
    bad.forEach(showError);
    if (bad.length) {
      var first = bad[0].matches("input, select, textarea") ? bad[0] : bad[0].querySelector("input");
      first.focus();
      return false;
    }
    return true;
  }

  // --- מעבר בין שלבים (כולל כפתור "חזרה" של הדפדפן) ---
  var STEP_NAMES = ["למי מודים", "מה קרה", "הפרטים שלכם", "המכתב מוכן"];

  // ספירה של כל שלב באשף (פעם אחת לכל טעינת דף), כדי לראות איפה אנשים עוזבים. בלי שום מידע אישי.
  var stepsCounted = {};
  function countStep(name, title) {
    if (stepsCounted[name]) return;
    stepsCounted[name] = true;
    window.track(name, title);
  }
  form.addEventListener("focusin", function () { countStep("step/1-start", "שלב 1: התחילו למלא"); });

  function go(step, fromHistory) {
    current = step;
    if (step === 2 || step === 3) countStep("step/" + step, "שלב " + step + ": " + STEP_NAMES[step - 1]);
    panels.forEach(function (p) { p.hidden = Number(p.dataset.panel) !== step; });
    var reqNote = form.querySelector(".req-note");
    if (reqNote) reqNote.hidden = step >= 4;
    stepItems.forEach(function (li) {
      var n = Number(li.dataset.step);
      li.classList.toggle("active", n === step);
      li.classList.toggle("done", n < step);
      if (n === step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    caption.textContent = step <= 4 ? "שלב " + step + " מתוך 4 · " + STEP_NAMES[step - 1] : "נשלח!";
    hideToast();
    if (step === 4) {
      prepareLetter();
      countReady();
    }
    if (!fromHistory) history.pushState({ step: step }, "");
    document.getElementById("write-title").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    var heading = panels[step - 1].querySelector("legend, h3");
    if (heading) heading.focus({ preventScroll: true });
  }

  history.replaceState({ step: 1 }, "");
  window.addEventListener("popstate", function (e) {
    if (e.state && e.state.step) go(e.state.step, true);
  });

  form.addEventListener("click", function (e) {
    if (e.target.matches("[data-next]")) {
      if (validate(current)) go(current + 1);
    } else if (e.target.matches("[data-prev]")) {
      history.back();
    }
  });

  // בדפים בשפות אחרות: קישור לתרגום הטקסט החופשי לעברית
  var translateHint = document.getElementById("translate-hint");
  if (window.LetterLocal && translateHint) {
    translateHint.hidden = false;
    document.getElementById("translate-link").addEventListener("click", function () {
      var text = [val("topic"), val("story"), val("impact")].filter(Boolean).join("\n\n");
      this.href = "https://translate.google.com/?sl=" + LANG + "&tl=iw&op=translate&text=" + encodeURIComponent(text);
    });
  }

  // --- הכנת המכתב ואפשרויות השליחה ---
  var subjectEl = document.getElementById("subject");
  var letterEl = document.getElementById("letter");
  var countEl = document.getElementById("letter-count");
  var mailBtn = document.getElementById("mail-btn");
  var toEmail = document.getElementById("toEmail");
  var emailHint = document.getElementById("email-hint");
  var cardForm = document.getElementById("card-form");
  var cardEmail = document.getElementById("card-email");
  var cardPrint = document.getElementById("card-print");
  var sendPrimary = document.getElementById("send-primary");
  var sendMore = document.getElementById("send-more");
  var moreWays = document.getElementById("more-ways");
  var copyOpen = document.getElementById("copy-open");
  var formTip = document.getElementById("form-tip");
  var officeLink = document.getElementById("office-link");
  var searchLink = document.getElementById("search-link");
  var postalEl = document.getElementById("postal");
  var sourceNote = document.getElementById("source-note");
  var lastBuilt = ""; // הנתונים שמהם נבנה המכתב, כדי לא למחוק עריכה ידנית בלי צורך

  function setLink(el, url) {
    var ok = /^https:\/\//.test(url || "");
    if (ok) el.href = url;
    el.hidden = !ok;
  }

  toEmail.addEventListener("input", function () { toEmail.dataset.userEdited = "1"; });
  letterEl.addEventListener("input", function () { letterEl.dataset.edited = "1"; });
  subjectEl.addEventListener("input", function () { letterEl.dataset.edited = "1"; });

  // ספירה: מכתב מוכן נספר פעם אחת לכל מכתב (ולא בכל חזרה לשלב 4), יחד עם המשרד מהרשימה
  var countedKey = "";
  function countReady() {
    if (lastBuilt === countedKey) return;
    countedKey = lastBuilt;
    var o = officeById[val("office")];
    window.track("letter-ready", "מכתב הוכן");
    if (LANG !== "he") window.track("letter-ready/" + LANG, "מכתב הוכן (" + LANG + ")");
    if (o) window.track("office/" + o.id, "מכתב: " + o.name);
  }

  function prepareLetter() {
    var d = data();
    var key = JSON.stringify(d);
    if (key !== lastBuilt) {
      var rebuild = !letterEl.dataset.edited ||
        confirm("שיניתם פרטים בטופס. לבנות את המכתב מחדש? (העריכות שעשיתם במכתב יימחקו)");
      if (rebuild) {
        var result = window.Letter.build(d);
        if (window.LetterLocal) {
          var local = window.LetterLocal.build(d, d.office && !d.office.askName && L10N ? L10N.names[d.office.id] : "");
          result.body += "\n\n――――――――\n" + window.LetterLocal.noteHe + "\n\n" + local.body;
        }
        subjectEl.value = result.subject;
        letterEl.value = result.body;
        delete letterEl.dataset.edited;
      }
      lastBuilt = key;
    }

    var o = d.office || {};
    if (!toEmail.dataset.userEdited) toEmail.value = o.email || "";

    setLink(copyOpen, o.form);
    cardForm.hidden = !o.form;
    setLink(officeLink, o.form === o.site ? "" : o.site);
    searchLink.href = "https://www.google.com/search?q=" +
      encodeURIComponent(d.officeName + " פניות הציבור");

    formTip.textContent = (L10N && L10N.tips[o.id]) || o.formTip || (o.askName
      ? "חפשו \"פניות הציבור\" באתר הארגון, או התקשרו למוקד ובקשו כתובת מייל. אפשר גם למסור מכתב מודפס."
      : "");
    formTip.hidden = !formTip.textContent;

    emailHint.textContent = o.email ? "כתובת פניות הציבור הרשמית כבר מולאה." :
      (o.askName ? "" : "לגוף זה לא פורסמה כתובת מייל לפניות הציבור. עדיף לשלוח בטופס או במכתב מודפס.");
    // הדרך המומלצת: טופס, אלא אם לגוף אין טופס או שעדיף אצלו מייל
    var emailFirst = !!(o.email && (!o.form || o.preferEmail));
    // דרך מומלצת אחת גלויה, והשאר מקופלות תחת «דרכים נוספות»
    var primary = o.askName ? cardEmail : emailFirst ? cardEmail : o.form ? cardForm : o.email ? cardEmail : cardPrint;
    cardEmail.hidden = !o.email && !o.askName; // בלי כתובת מייל רשמית אין טעם בכרטיס ריק
    [cardForm, cardEmail, cardPrint].forEach(function (card) {
      var isPrimary = card === primary;
      card.classList.toggle("primary", isPrimary);
      var rec = card.querySelector(".rec");
      if (rec) rec.hidden = !isPrimary;
      if (isPrimary) sendPrimary.appendChild(card); else sendMore.appendChild(card);
    });
    mailBtn.classList.toggle("btn-primary", primary === cardEmail);
    mailBtn.classList.toggle("btn-ghost", primary !== cardEmail);
    var hasMore = [cardForm, cardEmail, cardPrint].some(function (c) { return c !== primary && !c.hidden; });
    moreWays.hidden = !hasMore;

    if (o.postal) {
      postalEl.textContent = "כתובת למשלוח בדואר: " + o.postal;
      postalEl.hidden = false;
    } else {
      postalEl.hidden = true;
    }

    sourceNote.textContent = "";
    if (o.sources && o.sources.length) {
      sourceNote.append("פרטי הקשר נלקחו מפרסומים רשמיים ועשויים להשתנות. ");
      o.sources.forEach(function (url, i) {
        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "מקור" + (o.sources.length > 1 ? " " + (i + 1) : "");
        sourceNote.append(a, " ");
      });
    }
    sourceNote.hidden = !sourceNote.textContent;
    updateMailLink();
  }

  function safe(s) { return s.toWellFormed ? s.toWellFormed() : s; }

  function updateMailLink() {
    var body = letterEl.value.replace(/\r?\n/g, "\r\n");
    mailBtn.href = "mailto:" + encodeURIComponent(toEmail.value.trim()).replace(/%40/g, "@") +
      "?subject=" + encodeURIComponent(safe(subjectEl.value)) +
      "&body=" + encodeURIComponent(safe(body));
    countEl.textContent = letterEl.value.length + " תווים" +
      (letterEl.value.length > 1500 ? ". יש טפסים שמגבילים את האורך. אם המכתב לא נכנס, נסו את הסגנון \"קצר וחם\"." : "");
  }
  [subjectEl, letterEl, toEmail].forEach(function (el) { el.addEventListener("input", updateMailLink); });

  function showToast(msg, ms) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(hideToast, ms || 8000);
  }
  function hideToast() { toast.classList.remove("show"); }

  // העתקה: קודם בדרך הישנה והסינכרונית, שעובדת גם בתוך לחיצה בספארי
  function copyLetter() {
    var ok = false;
    letterEl.focus({ preventScroll: true });
    letterEl.setSelectionRange(0, letterEl.value.length);
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    if (!ok && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(letterEl.value).catch(function () {});
      ok = true;
    }
    showToast(ok ? "המכתב הועתק. עכשיו אפשר להדביק אותו (לחיצה ארוכה ← הדבק)."
                 : "המכתב מסומן. העתיקו אותו ידנית (לחיצה ארוכה ← העתק).");
    return ok;
  }

  document.getElementById("copy-btn").addEventListener("click", copyLetter);
  copyOpen.addEventListener("click", function () { // הקישור עצמו פותח את הטופס בחלון חדש
    copyLetter();
    window.track("send-form", "שליחה בטופס");
    awaitReturn();
  });

  // מי שיצא לטופס, למייל או להדפסה וחזר לאתר: "חזרתם? איך הלך?"
  var backCheck = document.getElementById("back-check");
  var awaiting = false;
  function awaitReturn() { awaiting = true; }
  function showBackCheck() {
    if (!awaiting || current !== 4) return;
    awaiting = false;
    backCheck.hidden = false;
    backCheck.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) showBackCheck(); });
  window.addEventListener("focus", showBackCheck);
  window.addEventListener("afterprint", function () { setTimeout(showBackCheck, 300); });
  document.getElementById("back-sent").addEventListener("click", markSent);
  document.getElementById("back-stuck").addEventListener("click", function () {
    window.track("stuck", "נתקעתי");
    backCheck.hidden = true;
    moreWays.hidden = false;
    moreWays.open = true;
    moreWays.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });

  // שמירת המכתב מחוץ לאתר: בוואטסאפ לעצמי, או לבן משפחה שיעזור לשלוח
  document.getElementById("save-letter-btn").addEventListener("click", function () {
    window.track("save-letter", "המכתב נשמר / נשלח לבן משפחה");
    var text = subjectEl.value + "\n\n" + letterEl.value;
    if (navigator.share) {
      navigator.share({ text: text }).catch(function () {});
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(safe(text)), "_blank", "noopener");
    }
  });

  mailBtn.addEventListener("click", function () {
    window.track("send-email", "שליחה במייל");
    awaitReturn();
    if (mailBtn.href.length > MAILTO_SAFE_LENGTH) {
      copyLetter();
      showToast("המכתב גם הועתק. אם הוא לא הופיע במלואו במייל, מחקו והדביקו אותו.");
    }
  });

  // בהדפסה (גם דרך תפריט הדפדפן) מודפס רק המכתב, אם כבר נוצר
  function fillPrintArea() {
    var area = document.getElementById("print-area");
    area.textContent = "";
    document.body.classList.toggle("print-letter-only", !!letterEl.value);
    if (!letterEl.value) return;
    var div = document.createElement("div");
    div.className = "print-letter";
    div.textContent = letterEl.value;
    area.appendChild(div);
  }
  window.addEventListener("beforeprint", fillPrintArea);
  document.getElementById("print-btn").addEventListener("click", function () {
    window.track("send-print", "הדפסה");
    awaitReturn();
    fillPrintArea();
    window.print();
  });

  // --- שיתוף (וואטסאפ, פייסבוק, לינקדאין ושיתוף מובנה בטלפון) ---
  // ?ref=... מראה ב-GoatCounter מאיזה ערוץ הגיעו המבקרים, וגם מבטיח לוואטסאפ תצוגה מקדימה עדכנית
  var SHARE_TEXT = {
    done: "שלחתי עכשיו מכתב תודה למי שעזר לי 💛\nדרך אתר שהוקם לזכרה של שוש כהנא ז״ל, שהקפידה להודות בכתב על כל שירות טוב.\nתלונות הם שומעים כל יום. הגיע הזמן לתודה.\nמישהו עזר לכם לאחרונה? 3 דקות, בחינם:",
    site: "תלונות הם שומעים כל יום. הגיע הזמן לתודה 🙏\nפקידה, אחות או נציג עזרו לכם? כאן כותבים להם מכתב תודה בשלוש דקות, בחינם. לזכרה של שוש כהנא ז״ל:"
  };

  function shareLink(source) { return SITE_URL + "?ref=" + source; }

  document.querySelectorAll(".share-row").forEach(function (row) {
    var text = SHARE_TEXT[row.dataset.context] || SHARE_TEXT.site;
    row.querySelectorAll("[data-share]").forEach(function (el) {
      var net = el.dataset.share;
      if (net === "whatsapp") el.href = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + shareLink("whatsapp"));
      if (net === "facebook") el.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareLink("facebook"));
      if (net === "linkedin") el.href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(shareLink("linkedin"));
      if (net === "native") {
        if (!navigator.share) return;
        el.hidden = false;
        el.addEventListener("click", function () {
          navigator.share({ title: "תודה תודה", text: text, url: shareLink("share") }).catch(function () {});
        });
      }
      el.addEventListener("click", function () {
        window.track("share-" + net, "שיתוף: " + net + " (" + row.dataset.context + ")");
      });
    });
  });

  function markSent() {
    window.track("sent", "שלחתי ✓");
    backCheck.hidden = true;
    awaiting = false;
    go(5);
  }
  document.getElementById("sent-btn").addEventListener("click", markSent);

  // --- "אין לי עכשיו למי להודות": שמירה לפעם הבאה ---
  var notNow = document.getElementById("not-now");
  notNow.addEventListener("toggle", function () { if (notNow.open) window.track("not-now", "אין לי עכשיו למי להודות"); });
  document.getElementById("nn-wa").href = "https://wa.me/?text=" + encodeURIComponent(
    "לשמור לפעם הבאה: כשמישהו יעזור לי, לכתוב לו מכתב תודה 💛\n" + shareLink("self"));
  document.getElementById("nn-wa").addEventListener("click", function () { window.track("not-now/wa", "לא עכשיו: קישור לעצמי"); });
  document.getElementById("nn-example").addEventListener("click", function () {
    window.track("not-now/example", "לא עכשיו: דוגמה למכתב");
    document.getElementById("example").open = true;
  });

  // תזכורת ביומן בעוד חודש: קישור ליומן גוגל, ובאייפון קובץ יומן שנוצר בדפדפן (בלי שרת)
  var REMINDERS = {
    later: { title: "תודה תודה: למי אני רוצה להודות החודש?", details: "מישהו נתן לכם שירות טוב? כתבו לו מכתב תודה בשלוש דקות: " + SITE_URL },
    check: { title: "תודה תודה: לבדוק אם מכתב התודה הועבר", details: "אם לא הגיעה תשובה מפניות הציבור, אפשר לפנות שוב ולשאול אם המכתב הועבר לעובד/ת ולממונים. " + SITE_URL }
  };
  function ymd(date) { return date.toISOString().slice(0, 10).replace(/-/g, ""); }
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  document.querySelectorAll(".reminder-link").forEach(function (link) {
    var r = REMINDERS[link.dataset.reminder];
    var day = new Date(Date.now() + 30 * 864e5);
    var next = new Date(day.getTime() + 864e5);
    if (isIOS) {
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//todotoda//he", "BEGIN:VEVENT",
        "UID:" + Date.now() + "@todotoda.azma.app", "DTSTAMP:" + ymd(new Date()) + "T000000Z",
        "DTSTART;VALUE=DATE:" + ymd(day), "DTEND;VALUE=DATE:" + ymd(next),
        "SUMMARY:" + r.title, "DESCRIPTION:" + r.details, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      link.download = "todotoda-reminder.ics";
      link.removeAttribute("target");
    } else {
      link.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(r.title) + "&details=" + encodeURIComponent(r.details) +
        "&dates=" + ymd(day) + "/" + ymd(next);
    }
    link.addEventListener("click", function () { window.track("reminder/" + link.dataset.reminder, "תזכורת ביומן"); });
  });

  // דוגמה למכתב ב"איך זה עובד", נבנית מאותו מחולל שבונה את המכתבים האמיתיים
  var example = document.getElementById("example-letter");
  if (example) {
    example.textContent = window.Letter.build({
      officeName: "המוסד לביטוח לאומי", officeFromList: true, medical: false,
      clerkName: "רונית לוי", clerkGender: "f", branch: "סניף באר שבע", station: "", role: "",
      serviceDate: "", serviceTime: "", channel: "front", topic: "הגשת בקשה לקצבת זקנה",
      qualities: ["patience", "clarity"], story: "הגעתי לחוץ ומבולבל. רונית ישבה איתי, עברה איתי על כל טופס ולא שחררה עד שהכול הסתדר.",
      impact: "יצאתי משם עם תחושת הקלה גדולה.", tone: "formal", writerName: "ישראל ישראלי", city: "", contact: "", dedication: true
    }).body;
  }


  document.getElementById("restart-btn").addEventListener("click", function () {
    form.reset();
    syncOfficeName();
    clerkNameInput.disabled = false;
    toEmail.value = "";
    delete toEmail.dataset.userEdited;
    delete letterEl.dataset.edited;
    lastBuilt = "";
    go(1);
  });
})();
