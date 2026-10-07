// ספירה אנונימית דרך GoatCounter: בלי עוגיות ובלי שום פרט מזהה.
// נספרים רק אירועים כלליים (למשל "מכתב מוכן" או "נשלח בטופס") ושם המשרד מתוך הרשימה,
// לעולם לא שמות, תוכן המכתב או פרטי קשר.
(function () {
  var queue = [];

  function send(name, title) {
    window.goatcounter.count({ path: name, title: title || name, event: true });
  }

  // GoatCounter נטען אחרי הדף (async), אז אירועים מוקדמים נשמרים בתור
  window.track = function (name, title) {
    try {
      if (window.goatcounter && window.goatcounter.count) send(name, title);
      else queue.push([name, title]);
    } catch (e) { /* ספירה לעולם לא תשבור את האתר */ }
  };

  window.addEventListener("load", function () {
    var tries = 0;
    var timer = setInterval(function () {
      if (window.goatcounter && window.goatcounter.count) {
        clearInterval(timer);
        queue.splice(0).forEach(function (q) { try { send(q[0], q[1]); } catch (e) {} });
      } else if (++tries > 20) {
        clearInterval(timer); // חוסם פרסומות או חסימת רשת: מוותרים בשקט
      }
    }, 500);
  });
})();
