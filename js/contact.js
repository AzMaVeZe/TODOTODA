// טופס יצירת קשר: נשלח דרך Web3Forms, והפנייה מגיעה במייל למפעילי האתר.
// מפתח הגישה של Web3Forms ציבורי מעצם הגדרתו (הוא לא חושף את כתובת המייל).
(function () {
  var ACCESS_KEY = "7a09a3fa-80e2-4ab9-9ae0-6d27a9c01334";
  var form = document.getElementById("contact-form");
  var message = document.getElementById("c-message");
  var err = document.getElementById("c-message-err");
  var status = document.getElementById("c-status");
  var submit = document.getElementById("c-submit");

  message.addEventListener("input", function () {
    message.removeAttribute("aria-invalid");
    err.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!message.value.trim()) {
      message.setAttribute("aria-invalid", "true");
      err.hidden = false;
      message.focus();
      return;
    }
    var topic = form.elements.topic.value;
    // נשלח כטופס רגיל (FormData) ולא כ-JSON, כדי שהדפדפן לא יצטרך בקשת בדיקה מקדימה
    var data = new FormData();
    data.append("access_key", ACCESS_KEY);
    data.append("subject", "תודה תודה – פנייה חדשה: " + topic);
    data.append("from_name", "אתר תודה תודה");
    data.append("נושא", topic);
    data.append("תוכן", message.value.trim());
    data.append("שם", form.elements.name.value.trim());
    data.append("לחזרה", form.elements.reply.value.trim());
    if (form.elements.botcheck.checked) data.append("botcheck", "on");
    submit.disabled = true;
    status.className = "contact-status";
    status.textContent = "שולחים…";
    fetch("https://api.web3forms.com/submit", { method: "POST", body: data })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) throw new Error(res.message || "error");
        form.reset();
        status.classList.add("ok");
        status.textContent = "תודה! הפנייה נשלחה, ונחזור אליכם בהקדם אם השארתם פרטים.";
      })
      .catch(function () {
        status.classList.add("fail");
        status.textContent = "לא הצלחנו לשלוח את הפנייה. נסו שוב בעוד כמה דקות.";
      })
      .then(function () { submit.disabled = false; });
  });
})();
