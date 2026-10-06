// ניהול הטופס: מעבר בין שלבים, בניית המכתב ואפשרויות השליחה.
(function () {
  var form = document.getElementById("letter-form");
  var officeSel = document.getElementById("office");
  var officeNameWrap = document.getElementById("office-name-wrap");
  var officeNameInput = document.getElementById("officeName");
  var panels = form.querySelectorAll(".step-panel");
  var stepItems = document.querySelectorAll(".steps li");
  var announcer = document.getElementById("step-announcer");
  var toast = document.getElementById("toast");
  var current = 1;

  // --- מילוי רשימת המשרדים ---
  var officeById = {};
  officeSel.innerHTML = '<option value="">בחרו משרד או ארגון</option>';
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

  officeSel.addEventListener("change", function () {
    var o = officeById[officeSel.value];
    officeNameWrap.hidden = !(o && o.askName);
  });

  // --- תיבות התכונות ---
  var qWrap = document.getElementById("qualities");
  window.Letter.QUALITIES.forEach(function (q) {
    var label = document.createElement("label");
    label.className = "chip";
    label.innerHTML = '<input type="checkbox" name="qualities" value="' + q.id + '"> ' + q.label;
    qWrap.appendChild(label);
  });

  // --- איסוף הנתונים ---
  function val(name) {
    var el = form.elements[name];
    return el ? (el.value || "") : "";
  }

  function data() {
    var o = officeById[val("office")];
    var officeName = o ? (o.askName ? val("officeName") : o.name) : "";
    return {
      office: o,
      officeName: officeName,
      branch: val("branch"),
      clerkName: val("clerkName"),
      clerkGender: form.querySelector('input[name="clerkGender"]:checked').value,
      role: val("role"),
      serviceDate: val("serviceDate"),
      topic: val("topic"),
      qualities: Array.prototype.map.call(
        form.querySelectorAll('input[name="qualities"]:checked'),
        function (c) { return c.value; }
      ),
      story: val("story"),
      impact: val("impact"),
      tone: form.querySelector('input[name="tone"]:checked').value,
      writerName: val("writerName"),
      city: val("city"),
      contact: val("contact"),
      dedication: document.getElementById("dedication").checked
    };
  }

  // --- בדיקת שדות חובה בכל שלב ---
  function requireField(input, message) {
    if (input.value.trim()) {
      input.removeAttribute("aria-invalid");
      return true;
    }
    input.setAttribute("aria-invalid", "true");
    showToast(message);
    input.focus();
    return false;
  }

  function validate(step) {
    if (step === 1) {
      if (!requireField(officeSel, "נא לבחור משרד או ארגון")) return false;
      if (!officeNameWrap.hidden && !requireField(officeNameInput, "נא לכתוב את שם הארגון")) return false;
      return requireField(form.elements.clerkName, "נא לכתוב את שם הפקיד/ה");
    }
    if (step === 3) return requireField(form.elements.writerName, "נא לכתוב את שמכם");
    return true;
  }

  // --- מעבר בין שלבים ---
  function go(step) {
    current = step;
    panels.forEach(function (p) { p.hidden = Number(p.dataset.panel) !== step; });
    stepItems.forEach(function (li) {
      var n = Number(li.dataset.step);
      li.classList.toggle("active", n === step);
      li.classList.toggle("done", n < step);
      if (n === step) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    announcer.textContent = "שלב " + step + " מתוך 4: " + stepItems[step - 1].textContent.replace(/^\d\s*/, "");
    if (step === 4) prepareLetter();
    document.getElementById("write-title").scrollIntoView({ behavior: "smooth", block: "start" });
    var first = panels[step - 1].querySelector("input, select, textarea");
    if (first) first.focus({ preventScroll: true });
  }

  form.addEventListener("click", function (e) {
    if (e.target.matches("[data-next]")) {
      if (validate(current)) go(current + 1);
    } else if (e.target.matches("[data-prev]")) {
      go(current - 1);
    }
  });

  // --- הכנת המכתב ואפשרויות השליחה ---
  var subjectEl = document.getElementById("subject");
  var letterEl = document.getElementById("letter");
  var mailBtn = document.getElementById("mail-btn");
  var toEmail = document.getElementById("toEmail");
  var officeLink = document.getElementById("office-link");
  var searchLink = document.getElementById("search-link");
  var formLink = document.getElementById("form-link");
  var postalEl = document.getElementById("postal");
  var sourceNote = document.getElementById("source-note");

  function setLink(el, url) {
    if (url) el.href = url;
    el.hidden = !url;
  }

  toEmail.addEventListener("input", function () { toEmail.dataset.userEdited = "1"; });

  function prepareLetter() {
    var d = data();
    var result = window.Letter.build(d);
    subjectEl.value = result.subject;
    letterEl.value = result.body;

    var o = d.office || {};
    // המייל מהמאגר ממולא רק אם המשתמש לא כתב כתובת משלו
    if (!toEmail.dataset.userEdited) toEmail.value = o.email || "";

    setLink(formLink, o.form);
    setLink(officeLink, o.form === o.site ? "" : o.site);

    if (o.postal) {
      postalEl.textContent = "כתובת למשלוח בדואר: " + o.postal;
      postalEl.hidden = false;
    } else {
      postalEl.hidden = true;
    }

    sourceNote.innerHTML = "";
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
      sourceNote.hidden = false;
    } else {
      sourceNote.hidden = true;
    }
    searchLink.href = "https://www.google.com/search?q=" +
      encodeURIComponent(d.officeName + " פניות הציבור");
    updateMailLink();
  }

  function updateMailLink() {
    mailBtn.href = "mailto:" + encodeURIComponent(toEmail.value.trim()).replace(/%40/g, "@") +
      "?subject=" + encodeURIComponent(subjectEl.value) +
      "&body=" + encodeURIComponent(letterEl.value);
  }
  [subjectEl, letterEl, toEmail].forEach(function (el) { el.addEventListener("input", updateMailLink); });

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(function () { toast.classList.remove("show"); }, 3500);
  }

  document.getElementById("copy-btn").addEventListener("click", function () {
    var text = letterEl.value;
    function fallback() {
      letterEl.select();
      document.execCommand("copy");
      showToast("המכתב הועתק. עכשיו אפשר להדביק אותו בטופס.");
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("המכתב הועתק. עכשיו אפשר להדביק אותו בטופס.");
      }, fallback);
    } else {
      fallback();
    }
  });

  document.getElementById("print-btn").addEventListener("click", function () {
    var area = document.getElementById("print-area");
    area.innerHTML = "";
    var pre = document.createElement("div");
    pre.className = "print-letter";
    pre.textContent = letterEl.value;
    area.appendChild(pre);
    window.print();
  });

  document.getElementById("restart-btn").addEventListener("click", function () {
    if (!confirm("להתחיל מכתב חדש? הפרטים שמילאתם יימחקו.")) return;
    form.reset();
    officeNameWrap.hidden = true;
    toEmail.value = "";
    delete toEmail.dataset.userEdited;
    go(1);
  });
})();
