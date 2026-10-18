// النسخة العربية من المكتوب: تُضاف بعد المكتوب العبري، بنفس البنية والمنطق الموجودين في js/letter.js.
// الكاتب/ة غير معروف/ة الجنس، لذلك تُستخدم صيغ المتكلم التي لا تُظهر الجنس (أودّ، تلقّيتُ، توجّهتُ).
(function () {
  var QUALITY_LABELS = {
    patience: "صبر",
    kindness: "لطف",
    professional: "مهنية",
    personal: "اهتمام شخصي",
    listening: "إصغاء",
    clarity: "شرح واضح",
    efficiency: "كفاءة",
    extra: "أكثر من المطلوب"
  };

  // العبارة التي تدخل في المكتوب ("extra" تدخل كجملة منفصلة)
  var PHRASES = {
    patience: "بصبر كبير",
    kindness: "بلطف بالغ",
    professional: "بمهنية عالية",
    personal: "باهتمام شخصي ودافئ",
    listening: "بإصغاء حقيقي",
    clarity: "بشرح واضح",
    efficiency: "بكفاءة عالية"
  };
  var ORDER = ["patience", "kindness", "professional", "personal", "listening", "clarity", "efficiency"];

  var CHANNELS = {
    front: "في قسم استقبال الجمهور",
    phone: "خلال مكالمة هاتفية",
    chat: "عبر الدردشة",
    email: "عبر البريد الإلكتروني"
  };

  // في الرسالة القصيرة: "عندما توجّهتُ إلى قسم استقبال الجمهور"
  var CHANNELS_SHORT = { front: "إلى قسم استقبال الجمهور" };

  var UNIT = "وحدة توجّهات الجمهور";

  var DEDICATION =
    "أُرسلت هذه الرسالة ضمن مبادرة «شكرًا شكرًا»، إحياءً لذكرى شوش كهانا رحمها الله، " +
    "التي اعتادت أن تشكر كتابيًا على كل خدمة جيدة تلقّتها.";

  // صيغة المذكر أو المؤنث حسب جنس الموظف/ة
  function g(isF, m, f) { return isF ? f : m; }

  // "أ، وب، وج"
  function joinAr(list) {
    if (list.length === 0) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + " و" + list[1];
    return list[0] + "، " + list.slice(1).map(function (s) { return "و" + s; }).join("، ");
  }

  // يضيف نقطة في آخر الجملة إن لم تنتهِ بعلامة ترقيم
  function sentence(text) {
    text = (text || "").trim();
    if (!text) return "";
    return /[.!?…؟]$/.test(text) ? text : text + ".";
  }

  // نص داخل الجملة: بلا علامة ترقيم في آخره
  function inline(text) {
    return (text || "").trim().replace(/[\s.!?…؟،,;:]+$/, "");
  }

  // "ب" + اسم الجهة؛ قبل اسم غير عربي (بالعبرية مثلًا) تُكتب "بـ"
  function inPlace(name) {
    return (/^[؀-ۿ]/.test(name) ? "ب" : "بـ") + name;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    if (p.length !== 3) return "";
    return Number(p[2]) + "." + Number(p[1]) + "." + p[0];
  }

  // كيف نسمّي الموظف/ة: في المرة الأولى (first)، وفي بقية المكتوب (later)
  function names(d, f) {
    var full = (d.clerkName || "").trim().replace(/\s+/g, " ");
    // في المستشفى: "عضو/ة الطاقم" (ممرض/ة، طبيب/ة، سكرتير/ة)، وفي غيره: "الموظف/ة"
    var title = d.medical ? g(f, "عضو الطاقم", "عضوة الطاقم") : g(f, "الموظف", "الموظفة");
    if (!full) {
      var desc = d.medical ? g(f, "الذي عالجني", "التي عالجتني") : g(f, "الذي استقبلني", "التي استقبلتني");
      return { first: title + " " + desc, later: "", known: false };
    }
    var parts = full.split(" ");
    if (parts.length === 1) {
      // اسم شخصي فقط: "الموظفة رونيت"، بلا "السيدة"
      return { first: title + " " + full, later: full, known: true };
    }
    var honor = g(f, "السيد", "السيدة");
    return { first: honor + " " + full, later: honor + " " + parts[parts.length - 1], known: true };
  }

  // تفاصيل تساعد الوحدة في التعرّف على الموظف/ة
  function details(d) {
    var bits = [];
    if ((d.branch || "").trim()) bits.push(d.branch.trim());
    if ((d.station || "").trim()) bits.push(d.station.trim());
    return bits.join("، ");
  }

  function when(d) {
    var date = formatDate(d.serviceDate);
    var s = date ? "بتاريخ " + date : "مؤخرًا";
    if (date && d.serviceTime) s += " عند الساعة " + d.serviceTime;
    return s;
  }

  function build(d, officeLocalName) {
    var f = d.clerkGender === "f";
    var n = names(d, f);
    var office = ((officeLocalName || "") || (d.officeName || "")).trim();
    var qualities = d.qualities || [];
    var phrases = ORDER.filter(function (id) { return qualities.indexOf(id) !== -1; })
      .map(function (id) { return PHRASES[id]; });
    var extra = qualities.indexOf("extra") !== -1;
    var how = phrases.length ? joinAr(phrases) : "بتفانٍ ومهنية";
    // "في قسم استقبال الجمهور" لا يناسب المستشفى؛ هناك لا حاجة لذكر طريقة التواصل
    var channel = (d.medical && d.channel === "front") ? "" : (CHANNELS[d.channel] || "");
    var topic = (d.topic || "").trim();
    var story = (d.story || "").trim();
    var impact = (d.impact || "").trim();
    var role = (d.role || "").trim();

    // "إلى السيدة رونيت ليفي، موظفة استقبال الجمهور (فرع بئر السبع، الشباك 4)"
    var who = "إلى " + n.first;
    if (role) who += "، " + role;
    var det = details(d);
    if (det) who += " (" + det + ")";

    // ما فعله/فعلته: "تعاملت مع طلبي" أو، في المستشفى، "اعتنت بي"
    function act(subject) {
      var s = subject ? " " + subject : "";
      return d.medical
        ? g(f, "اعتنى", "اعتنت") + " بي" + s + " " + how
        : g(f, "تعامل", "تعاملت") + s + " مع طلبي " + how;
    }

    var subject = "رسالة شكر وتقدير إلى " + n.first + (office ? " – " + office : "");
    var toHim = g(f, "إليه", "إليها");
    var file = g(f, "ملفه الشخصي", "ملفها الشخصي");
    var lines = [];

    lines.push("إلى " + UNIT);
    if (office) lines.push(office);
    lines.push("");
    lines.push("الموضوع: " + subject);
    lines.push("");
    lines.push("تحية طيبة وبعد،");
    lines.push("");

    if (d.tone === "short") {
      var opener = (d.medical && !channel) ? "فخلال العلاج الذي تلقّيته" : "فعندما توجّهتُ";
      var shortChannel = channel ? (CHANNELS_SHORT[d.channel] || channel) : "";
      var short = [
        "أودّ أن أوجّه شكرًا كبيرًا " + who + ".",
        opener + " " + when(d) + (shortChannel ? " " + shortChannel : "") +
          (topic ? " بخصوص " + inline(topic) : "") + "، " + act("") + "."
      ];
      if (extra) short.push(g(f, "وقد بذل", "وقد بذلت") + " جهدًا يفوق المطلوب بكثير.");
      if (story) short.push(sentence(story));
      if (impact) short.push(sentence(impact));
      lines.push(short.join(" "));
      lines.push("");
      lines.push(
        "أرجو أن تنقلوا هذا الشكر " + toHim + " وإلى المسؤولين " + g(f, "عنه", "عنها") +
        "، وأن تحفظوا الرسالة في " + file + "."
      );
    } else {
      lines.push(
        "أودّ أن أتقدّم بخالص الشكر والتقدير " + who + "، على " +
        (d.medical ? "الرعاية الممتازة" : "الخدمة الممتازة") + " التي تلقّيتها " + when(d) +
        (channel ? " " + channel : "") + "."
      );
      lines.push("");
      var para = [];
      if (topic) para.push("توجّهتُ بخصوص " + sentence(topic));
      para.push((topic ? "وقد " : "لقد ") + act(n.known ? n.later : "") +
        (extra ? "، بل " + g(f, "وبذل", "وبذلت") + " جهدًا يفوق المطلوب بكثير" : "") + ".");
      if (story) para.push(sentence(story));
      if (impact) para.push(sentence(impact));
      lines.push(para.join(" "));
      lines.push("");
      lines.push(
        "كثيرًا ما لا نكتب إلا عندما يسوء أمرٌ ما، ولذلك يهمّني أن أكتب أيضًا حين " +
        (d.medical ? "نتلقّى رعاية جيدة" : "نتلقّى خدمة جيدة") + ". " +
        (n.known ? g(f, "ويُعدّ ", "وتُعدّ ") + n.later : g(f, "وهو يُعدّ", "وهي تُعدّ")) +
        " نموذجًا " +
        (d.medical ? "للرعاية في أفضل صورها، ورعاية كهذه" : "للخدمة العامة في أفضل صورها، وخدمة كهذه") +
        " تعزّز ثقة الجمهور" + (office ? " " + inPlace(office) : "") + "."
      );
      lines.push("");
      lines.push(
        "أرجو التكرّم بنقل هذه الرسالة " + toHim + "، وإلى " + g(f, "مسؤوله", "مسؤولها") +
        " المباشر، وإلى مدير/ة الوحدة، وحفظها في " + file + ". " +
        "ويسعدني أن أتلقّى تأكيدًا موجزًا على نقلها."
      );
    }

    lines.push("");
    lines.push(d.tone === "short" ? "مع جزيل الشكر،" : "مع خالص الاحترام والتقدير،");
    lines.push((d.writerName || "").trim());
    if ((d.city || "").trim()) lines.push(d.city.trim());
    // الهاتف أو البريد الإلكتروني يبقى باتجاه من اليسار إلى اليمين داخل النص العربي (+972… لا ينقلب)
    if ((d.contact || "").trim()) lines.push("⁦" + d.contact.trim() + "⁩");

    if (d.dedication) {
      lines.push("");
      lines.push("―――");
      lines.push(DEDICATION);
    }

    return { subject: subject, body: lines.join("\n") };
  }

  window.LetterLocal = {
    noteHe: "המכתב נכתב במקור בערבית, והנוסח בערבית מצורף להלן.",
    qualityLabels: QUALITY_LABELS,
    build: build
  };
})();
