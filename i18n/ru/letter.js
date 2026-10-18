// Русская версия письма (для страницы /ru/). Она добавляется после письма на иврите
// и повторяет его структуру и логику (см. js/letter.js).
// Имена сотрудников в Израиле склоняются ненадёжно, поэтому имя везде стоит в именительном падеже:
// «Меня обслуживала г-жа Ронит Леви», «сотрудница по имени Ронит».
// Пол автора письма неизвестен, поэтому в письме нет глаголов прошедшего времени от первого лица.
(function () {
  var QUALITY_LABELS = {
    patience: "Терпение",
    kindness: "Вежливость",
    professional: "Профессионализм",
    personal: "Личное внимание",
    listening: "Умение выслушать",
    clarity: "Понятные объяснения",
    efficiency: "Оперативность",
    extra: "Больше, чем требовалось"
  };

  // Что проявил сотрудник (винительный падеж): «…проявила огромное терпение, доброжелательность и …»
  var PHRASES = {
    patience: "огромное терпение",
    kindness: "доброжелательность",
    professional: "высокий профессионализм",
    personal: "тёплое личное отношение",
    listening: "умение внимательно выслушать",
    clarity: "умение ясно всё объяснить",
    efficiency: "оперативность"
  };
  var ORDER = ["patience", "kindness", "professional", "personal", "listening", "clarity", "efficiency"];

  var CHANNELS = {
    front: "при личном визите",
    phone: "по телефону",
    chat: "в онлайн-чате",
    email: "в переписке по электронной почте"
  };

  var DEDICATION =
    "Письмо отправлено в рамках инициативы «Тода-тода» в память о Шош Кахана, благословенна её память, " +
    "которая всегда благодарила письменно за каждое хорошее обслуживание.";

  function g(isF, m, f) { return isF ? f : m; }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // «а, б и в»
  function joinRu(list) {
    if (list.length === 0) return "";
    if (list.length === 1) return list[0];
    return list.slice(0, -1).join(", ") + " и " + list[list.length - 1];
  }

  function sentence(text) {
    text = (text || "").trim();
    if (!text) return "";
    return /[.!?…]$/.test(text) ? text : text + ".";
  }

  function formatDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    if (p.length !== 3) return "";
    return Number(p[2]) + "." + Number(p[1]) + "." + p[0];
  }

  function trim(s) { return (s || "").trim(); }

  // Как называть сотрудника. Имя всегда в именительном падеже.
  //   first   — в первом упоминании: «г-жа Ронит Леви» / «сотрудница по имени Ронит» / «сотрудница»
  //   later   — подлежащее дальше в письме: «г-жа Леви» / «Ронит» / «она»
  //   subject — для строки «Тема»: «г-жа Ронит Леви» / «Ронит» / ""
  function names(d, f) {
    var full = trim(d.clerkName).replace(/\s+/g, " ");
    var title = d.medical
      ? g(f, "сотрудник медицинского персонала", "сотрудница медицинского персонала")
      : g(f, "сотрудник", "сотрудница");
    if (!full) {
      // Должность, если указана, заменяет слово «сотрудница»: «Обо мне заботилась медсестра…»
      var role = trim(d.role);
      return { first: role || title, later: g(f, "этот сотрудник", "эта сотрудница"), subject: "", known: false, title: title };
    }
    var parts = full.split(" ");
    if (parts.length === 1) {
      return { first: title + " по имени " + full, later: full, subject: full, known: true, title: title };
    }
    var honor = g(f, "г-н", "г-жа");
    return {
      first: honor + " " + full,
      later: honor + " " + parts[parts.length - 1],
      subject: honor + " " + full,
      known: true,
      title: title
    };
  }

  function details(d) {
    return [trim(d.branch), trim(d.station)].filter(Boolean).join(", ");
  }

  function when(d) {
    var date = formatDate(d.serviceDate);
    var s = date || "недавно";
    if (date && d.serviceTime) s += " в " + d.serviceTime;
    return s;
  }

  function build(d, officeLocalName) {
    var f = d.clerkGender === "f";
    var n = names(d, f);
    // Русское название — только для организаций из списка; иначе то, что ввёл пользователь
    var office = (d.officeFromList && trim(officeLocalName)) || trim(d.officeName);
    var qualities = d.qualities || [];
    var phrases = ORDER.filter(function (id) { return qualities.indexOf(id) !== -1; })
      .map(function (id) { return PHRASES[id]; });
    var extra = qualities.indexOf("extra") !== -1;
    var how = phrases.length ? joinRu(phrases) : "самоотдачу и профессионализм";
    var channel = (d.medical && d.channel === "front") ? "" : (CHANNELS[d.channel] || "");
    var whenCh = when(d) + (channel ? " " + channel : "");
    var short = d.tone === "short";
    var role = trim(d.role);
    var det = details(d);
    var his = g(f, "его", "её");

    // «Меня обслуживала г-жа Ронит Леви, сотрудница приёма граждан (отделение в Беэр-Шеве, окно 4).»
    var served;
    if (d.medical) served = g(f, "Обо мне заботился", "Обо мне заботилась");
    else if (short) served = g(f, "Мне помогал", "Мне помогала");
    else served = g(f, "Меня обслуживал", "Меня обслуживала");
    served += " " + n.first;
    if (n.known) {
      if (role) served += ", " + role;
      if (det) served += " (" + det + ")";
      served += ".";
    } else {
      if (det) served += " (" + det + ")";
      served += ", " + g(f, "имени которого", "имени которой") + " я, к сожалению, не знаю.";
    }

    // «Занимаясь моим обращением, г-жа Леви проявила огромное терпение и доброжелательность.»
    var howLine = (d.medical || short ? cap(n.later) : "Занимаясь моим обращением, " + n.later) +
      " " + g(f, "проявил", "проявила") + " " + how + ".";
    if (extra) howLine += " " + g(f, "Он", "Она") + " даже " + g(f, "сделал", "сделала") +
      " намного больше, чем от " + g(f, "него", "неё") + " требовалось.";

    var topic = trim(d.topic)
      ? (d.medical ? "Речь шла о следующем: " : "Тема моего обращения: ") + sentence(d.topic)
      : "";

    var what = d.medical ? "за внимательное отношение и заботу" : "за отличное обслуживание";
    var subjectTail = [n.subject, office].filter(Boolean).join(", ");
    var subject = "Благодарность " + g(f, "сотруднику", "сотруднице") +
      (d.medical ? " медицинского персонала" : "") + " " + what +
      (subjectTail ? " — " + subjectTail : "");

    var lines = [];
    lines.push("В отдел по обращениям граждан");
    if (office) lines.push(office);
    lines.push("");
    lines.push("Тема: " + subject);
    lines.push("");
    lines.push(short ? "Здравствуйте!" : "Уважаемые господа!");
    lines.push("");

    if (short) {
      var para = [
        "Хочу сказать огромное спасибо за помощь, оказанную мне " + whenCh + ".",
        served
      ];
      if (topic) para.push(topic);
      para.push(howLine);
      if (trim(d.story)) para.push(sentence(d.story));
      if (trim(d.impact)) para.push(sentence(d.impact));
      lines.push(para.join(" "));
      lines.push("");
      lines.push(
        "Пожалуйста, передайте эту благодарность " + g(f, "ему", "ей") + " и " + his +
        " руководству, а также приобщите письмо к " + his + " личному делу."
      );
    } else {
      lines.push(
        "Хочу выразить искреннюю благодарность " +
        (d.medical ? "за внимательное отношение и заботу, проявленные ко мне "
                   : "за прекрасное обслуживание, оказанное мне ") +
        whenCh + ". " + served
      );
      lines.push("");
      var body = [];
      if (topic) body.push(topic);
      body.push(howLine);
      if (trim(d.story)) body.push(sentence(d.story));
      if (trim(d.impact)) body.push(sentence(d.impact));
      lines.push(body.join(" "));
      lines.push("");
      var example = d.medical
        ? "каким должно быть отношение к пациентам"
        : "каким должно быть обслуживание граждан";
      lines.push(
        "Обычно пишут лишь тогда, когда что-то пошло не так, поэтому мне важно написать и о хорошем. " +
        (n.known ? cap(n.later) : g(f, "Этот сотрудник", "Эта сотрудница")) +
        " — настоящий пример того, " + example +
        ", и именно такая работа укрепляет доверие общества " +
        (office ? "к вашему учреждению" : "к государственной службе") + "."
      );
      lines.push("");
      lines.push(
        "Прошу вас передать это письмо " + g(f, "самому сотруднику", "самой сотруднице") + ", " + his +
        " непосредственному руководителю и руководителю подразделения, а также приобщить его к личному делу " +
        g(f, "сотрудника", "сотрудницы") + ". Заранее благодарю за короткое подтверждение того, что письмо передано."
      );
    }

    lines.push("");
    lines.push(short ? "С благодарностью," : "С уважением и признательностью,");
    lines.push(trim(d.writerName));
    if (trim(d.city)) lines.push(trim(d.city));
    if (trim(d.contact)) lines.push("⁦" + trim(d.contact) + "⁩");

    if (d.dedication) {
      lines.push("");
      lines.push("―――");
      lines.push(DEDICATION);
    }

    return { subject: subject, body: lines.join("\n") };
  }

  window.LetterLocal = {
    noteHe: "המכתב נכתב במקור ברוסית, והנוסח ברוסית מצורף להלן.",
    qualityLabels: QUALITY_LABELS,
    build: build
  };
})();
