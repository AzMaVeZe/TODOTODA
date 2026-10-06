// ניהול הטופס: מעבר בין שלבים, בניית המכתב ואפשרויות השליחה.
(function () {
  var SITE_URL = "https://todotoda.azma.app/";
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
    og.label = group.group;
    group.items.forEach(function (o) {
      officeById[o.id] = o;
      var opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = o.name;
      og.appendChild(opt);
    });
    officeSel.appendChild(og);
  });

  // קישור כמו ?office=btl בוחר מראש את הארגון
  var preset = new URLSearchParams(location.search).get("office");
  if (preset && officeById[preset]) officeSel.value = preset;

  function syncOfficeName() {
    var o = officeById[officeSel.value];
    officeNameWrap.hidden = !(o && o.askName);
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
    span.textContent = q.label;
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

  function go(step, fromHistory) {
    current = step;
    panels.forEach(function (p) { p.hidden = Number(p.dataset.panel) !== step; });
    stepItems.forEach(function (li) {
      var n = Number(li.dataset.step);
      li.classList.toggle("active", n === step);
      li.classList.toggle("done", n < step);
      if (n === step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    caption.textContent = step <= 4 ? "שלב " + step + " מתוך 4 · " + STEP_NAMES[step - 1] : "נשלח!";
    hideToast();
    if (step === 4) prepareLetter();
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

  // --- הכנת המכתב ואפשרויות השליחה ---
  var subjectEl = document.getElementById("subject");
  var letterEl = document.getElementById("letter");
  var countEl = document.getElementById("letter-count");
  var mailBtn = document.getElementById("mail-btn");
  var toEmail = document.getElementById("toEmail");
  var emailHint = document.getElementById("email-hint");
  var cardForm = document.getElementById("card-form");
  var cardEmail = document.getElementById("card-email");
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

  function prepareLetter() {
    var d = data();
    var key = JSON.stringify(d);
    if (key !== lastBuilt) {
      var rebuild = !letterEl.dataset.edited ||
        confirm("שיניתם פרטים בטופס. לבנות את המכתב מחדש? (העריכות שעשיתם במכתב יימחקו)");
      if (rebuild) {
        var result = window.Letter.build(d);
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

    formTip.textContent = o.formTip || (o.askName
      ? "חפשו \"פניות הציבור\" באתר הארגון, או התקשרו למוקד ובקשו כתובת מייל. אפשר גם למסור מכתב מודפס."
      : "");
    formTip.hidden = !formTip.textContent;

    emailHint.textContent = o.email ? "כתובת פניות הציבור הרשמית כבר מולאה." :
      (o.askName ? "" : "לגוף זה לא פורסמה כתובת מייל לפניות הציבור. עדיף לשלוח בטופס או במכתב מודפס.");
    // הדרך המומלצת: טופס, אלא אם לגוף אין טופס או שעדיף אצלו מייל
    var emailFirst = !!(o.email && (!o.form || o.preferEmail));
    mailBtn.classList.toggle("btn-primary", emailFirst);
    mailBtn.classList.toggle("btn-ghost", !emailFirst);
    cardEmail.classList.toggle("primary", emailFirst);
    cardForm.classList.toggle("primary", !emailFirst);
    cardEmail.querySelector(".rec").hidden = !emailFirst;
    cardForm.querySelector(".rec").hidden = emailFirst;
    if (emailFirst) cardForm.before(cardEmail); else cardEmail.before(cardForm);

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
  copyOpen.addEventListener("click", copyLetter); // הקישור עצמו פותח את הטופס בחלון חדש

  mailBtn.addEventListener("click", function () {
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
    fillPrintArea();
    window.print();
  });

  // --- סיום ושיתוף ---
  var shareText = "כתבתי מכתב תודה לפקיד/ה שעזר/ה לי 🙏\nתלונות הם שומעים כל יום – הגיע הזמן לתודה.\nלוקח 3 דקות, בחינם:";
  document.getElementById("wa-share").href =
    "https://wa.me/?text=" + encodeURIComponent(shareText + "\n" + SITE_URL);
  var nativeShare = document.getElementById("native-share");
  if (navigator.share) {
    nativeShare.hidden = false;
    nativeShare.addEventListener("click", function () {
      navigator.share({ title: "תודה תודה", text: shareText, url: SITE_URL }).catch(function () {});
    });
  }

  document.getElementById("sent-btn").addEventListener("click", function () { go(5); });

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
