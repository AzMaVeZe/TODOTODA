// רשימת המשרדים והארגונים שמופיעים באתר.
// site — קישור לאתר הרשמי (רק קישורים שנבדקו). אם אין, האתר יציע חיפוש של "פניות הציבור".
// email — כתובת מייל רשמית לפניות הציבור, אם ידועה ומאומתת. השאירו ריק אם לא בטוחים.
window.OFFICES = [
  { group: "משרדי ממשלה ורשויות", items: [
    { id: "btl", name: "המוסד לביטוח לאומי", site: "https://www.btl.gov.il" },
    { id: "taxes", name: "רשות המסים בישראל", site: "https://www.gov.il/he/departments/general/ta-contact-us" },
    { id: "population", name: "רשות האוכלוסין וההגירה" },
    { id: "interior", name: "משרד הפנים" },
    { id: "health", name: "משרד הבריאות" },
    { id: "transport", name: "משרד התחבורה (משרד הרישוי)" },
    { id: "education", name: "משרד החינוך" },
    { id: "welfare", name: "משרד הרווחה והביטחון החברתי" },
    { id: "employment", name: "שירות התעסוקה הישראלי" },
    { id: "aliyah", name: "משרד העלייה והקליטה" },
    { id: "housing", name: "משרד הבינוי והשיכון" },
    { id: "ila", name: "רשות מקרקעי ישראל" },
    { id: "justice", name: "משרד המשפטים" },
    { id: "enforcement", name: "רשות האכיפה והגבייה (הוצאה לפועל)" },
    { id: "courts", name: "הרשות השופטת (בתי המשפט)" },
    { id: "police", name: "משטרת ישראל" },
    { id: "rehab", name: "משרד הביטחון – אגף השיקום" },
    { id: "finance", name: "משרד האוצר" }
  ]},
  { group: "שירותים ציבוריים", items: [
    { id: "post", name: "דואר ישראל", site: "https://www.israelpost.co.il" },
    { id: "clalit", name: "שירותי בריאות כללית", site: "https://www.clalit.co.il" },
    { id: "maccabi", name: "מכבי שירותי בריאות", site: "https://www.maccabi4u.co.il" },
    { id: "meuhedet", name: "קופת חולים מאוחדת", site: "https://www.meuhedet.co.il" },
    { id: "leumit", name: "לאומית שירותי בריאות", site: "https://www.leumit.co.il" },
    { id: "municipality", name: "עירייה / מועצה מקומית", askName: true }
  ]},
  { group: "אחר", items: [
    { id: "other", name: "ארגון אחר", askName: true }
  ]}
];
