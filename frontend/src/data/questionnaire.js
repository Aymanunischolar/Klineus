export const DISCLAIMER =
  "AI-generated draft. Must be reviewed and approved by a physician.";

export const kneeTepBlocks = [
  {
    id: "A",
    title: "Block A: Ihr Knieproblem",
    questions: [
      {
        id: "A1",
        text: "Um welches Knie geht es heute?",
        type: "single",
        options: ["Rechts", "Links", "Beide"],
      },
      {
        id: "A2",
        text: "Haben Sie aktuell Schmerzen in diesem Knie?",
        type: "single",
        options: ["Ja", "Nein"],
      },
      {
        id: "A3",
        text: "Seit wann haben Sie diese Knieschmerzen?",
        type: "single",
        options: [
          "Weniger als 3 Monate",
          "3 bis 6 Monate",
          "6 bis 12 Monate",
          "Länger als 1 Jahr",
        ],
      },
      {
        id: "A4",
        text: "Wie stark sind Ihre Knieschmerzen im Durchschnitt?",
        type: "slider",
        min: 0,
        max: 10,
      },
      {
        id: "A5",
        text: "Wann treten die Schmerzen vor allem auf?",
        type: "multiple",
        options: [
          "Beim Gehen oder Belasten",
          "Beim Treppensteigen",
          "In Ruhe",
          "Nachts",
          "Eigentlich immer",
        ],
      },
      {
        id: "A6",
        text: "Was beschreibt Ihre Beschwerden am besten?",
        type: "multiple",
        options: [
          "Schmerz",
          "Steifigkeit",
          "Unsicherheit im Knie",
          "Das Knie knickt weg",
          "Knie lässt sich nicht richtig beugen oder strecken",
          "Schwellung",
          "Etwas anderes",
        ],
      },
      {
        id: "A7",
        text: "Was ist heute der Hauptgrund für Ihren Termin?",
        type: "single",
        options: [
          "Ursache klären",
          "Behandlung besprechen",
          "Prüfen ob eine Operation sinnvoll sein könnte",
          "Zweitmeinung",
          "Sonstiges",
        ],
      },
    ],
  },
  {
    id: "B",
    title: "Block B: Auswirkungen im Alltag",
    questions: [
      {
        id: "B1",
        text: "Wie sehr schränken Ihre Kniebeschwerden Ihren Alltag insgesamt ein?",
        type: "slider",
        min: 0,
        max: 10,
      },
      {
        id: "B2",
        text: "Seit wann schränken Ihre Kniebeschwerden Ihren Alltag deutlich ein?",
        type: "single",
        options: [
          "Weniger als 3 Monate",
          "3 bis 6 Monate",
          "6 bis 12 Monate",
          "Länger als 1 Jahr",
        ],
      },
      {
        id: "B3",
        text: "Bei welchen Aktivitäten haben Sie wegen Ihres Knies Schwierigkeiten?",
        type: "multiple",
        options: [
          "Gehen",
          "Längeres Stehen",
          "Treppensteigen",
          "Hinsetzen oder Aufstehen",
          "Knien",
          "Körperpflege",
          "Haushalt",
          "Arbeit oder Beruf",
          "Sport oder Hobbys",
          "Bus, Bahn oder Auto nutzen",
          "Soziale Aktivitäten",
          "Keine besonderen Schwierigkeiten",
        ],
      },
      {
        id: "B4",
        text: "Wie weit können Sie ungefähr am Stück gehen, bevor das Knie Sie deutlich einschränkt?",
        type: "single",
        options: [
          "Mehr als 1 Kilometer",
          "500 Meter bis 1 Kilometer",
          "100 bis 500 Meter",
          "Weniger als 100 Meter",
          "Kaum möglich",
        ],
      },
      {
        id: "B5",
        text: "Fühlt sich Ihr Knie manchmal instabil an oder knickt weg?",
        type: "single",
        options: ["Nie", "Selten", "Manchmal", "Häufig"],
      },
      {
        id: "B6",
        text: "Haben Sie das Gefühl, dass Sie Ihr Knie nicht mehr richtig beugen oder strecken können?",
        type: "single",
        options: ["Ja", "Nein", "Weiß nicht"],
      },
      {
        id: "B7",
        text: "Haben Sie das Gefühl, dass Ihr Bein oder Knie schief steht?",
        type: "single",
        options: ["Ja", "Nein", "Weiß nicht"],
      },
      {
        id: "B8",
        text: "Haben Sie das Gefühl, dass Ihr betroffenes Bein schwächer geworden ist?",
        type: "single",
        options: ["Ja", "Nein", "Weiß nicht"],
      },
      {
        id: "B9",
        text: "Brauchen Sie wegen Ihres Knies im Alltag Hilfe von anderen Personen?",
        type: "single",
        options: ["Nein", "Selten", "Regelmäßig", "Fast immer"],
      },
      {
        id: "B10",
        text: "Wie sehr leiden Sie persönlich unter Ihren Kniebeschwerden?",
        type: "slider",
        min: 0,
        max: 10,
      },
    ],
  },
  {
    id: "C",
    title: "Block C: Bisherige Behandlung",
    questions: [
      {
        id: "C1",
        text: "Wurden Ihre Kniebeschwerden schon behandelt?",
        type: "single",
        options: ["Ja", "Nein"],
      },
      {
        id: "C2",
        text: "Welche Behandlungen haben Sie bisher erhalten?",
        type: "multiple",
        options: [
          "Schmerzmittel",
          "Physiotherapie oder Krankengymnastik",
          "Übungen zu Hause",
          "Spritzen ins Knie",
          "Bandage oder Hilfsmittel",
          "Einlagen oder spezielle Schuhe",
          "Empfehlung zur Gewichtsabnahme",
          "Sonstige Behandlung",
          "Keine",
        ],
      },
      {
        id: "C3",
        text: "Seit wie lange werden Ihre Kniebeschwerden schon behandelt?",
        type: "single",
        options: [
          "Weniger als 3 Monate",
          "3 bis 6 Monate",
          "6 bis 12 Monate",
          "Länger als 1 Jahr",
        ],
      },
      {
        id: "C4",
        text: "Haben die bisherigen Behandlungen Ihre Beschwerden gebessert?",
        type: "single",
        options: ["Ja, deutlich", "Ja, etwas", "Nein, kaum oder gar nicht"],
      },
      {
        id: "C5",
        text: "Haben Sie in den letzten Monaten regelmäßig Physiotherapie oder Übungen gemacht?",
        type: "single",
        options: ["Ja", "Nein", "Teilweise"],
      },
      {
        id: "C6",
        text: "Wurde Ihnen von einem Arzt schon einmal gesagt, dass Sie zunächst weiter ohne Operation behandelt werden sollen?",
        type: "single",
        options: ["Ja", "Nein", "Weiß nicht"],
      },
    ],
  },
  {
    id: "D",
    title: "Block D: Vorbefunde und ärztliche Aussagen",
    questions: [
      {
        id: "D1",
        text: "Wurde von Ihrem Knie schon einmal ein Röntgenbild gemacht?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "D2",
        text: "Wurde Ihnen gesagt, dass in Ihrem Knie ein deutlicher Gelenkverschleiß oder Arthrose vorliegt?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "D3",
        text: "Wurde Ihnen gesagt, dass der Knorpel oder die Gelenkfläche im Knie deutlich geschädigt ist?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "D4",
        text: "Wurde Ihnen gesagt, dass am Knochen oder an der Gelenkfläche ein Schaden vorliegt?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "D5",
        text: "Haben Sie Arztbriefe, Röntgenbilder oder Befunde zu Ihrem Knie?",
        type: "single",
        options: ["Ja, ich habe Unterlagen", "Teilweise", "Nein"],
      },
      {
        id: "D6",
        text: "Wurde Ihnen bereits einmal eine Knieprothese empfohlen?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
    ],
  },
  {
    id: "E",
    title: "Block E: Gesundheit und Risiken",
    questions: [
      {
        id: "E0",
        text: "Wie alt sind Sie?",
        type: "number",
        piiCategory: "age",
        includeInAi: true,
      },
      {
        id: "E1",
        text: "Haben Sie aktuell eine Entzündung oder Infektion im Knie, die gerade behandelt wird?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "E2",
        text: "Hatten Sie in den letzten 3 Monaten einen Herzinfarkt, Schlaganfall oder ein anderes schweres Herz-Kreislauf-Ereignis?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "E3",
        text: "Haben Sie Diabetes oder erhöhte Blutzuckerwerte?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "E4",
        text: "Wie groß sind Sie und wie viel wiegen Sie ungefähr?",
        type: "number_pair",
      },
      {
        id: "E5",
        text: "Rauchen Sie aktuell?",
        type: "single",
        options: ["Ja", "Nein", "Ich habe aufgehört"],
      },
      {
        id: "E6",
        text: "Haben Sie in letzter Zeit eine Kortison-Spritze direkt ins Knie bekommen?",
        type: "single",
        options: [
          "Nein",
          "Ja, vor weniger als 6 Wochen",
          "Ja, vor 6 Wochen bis 3 Monaten",
          "Ja, vor mehr als 3 Monaten",
          "Weiß ich nicht",
        ],
      },
      {
        id: "E7",
        text: "Wurde bei Ihnen schon einmal eine Blutarmut bzw. Anämie festgestellt?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "E8",
        text: "Werden Sie aktuell wegen einer psychischen Erkrankung behandelt?",
        type: "single",
        options: ["Ja", "Nein", "Möchte ich nicht angeben"],
      },
      {
        id: "E9",
        text: "Haben Sie eine rheumatische Erkrankung?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "E10",
        text: "Nehmen Sie aktuell Kortison als Tabletten ein?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
      {
        id: "E11",
        text: "Haben Sie eine andere schwere Erkrankung, wegen der Sie regelmäßig in ärztlicher Behandlung sind?",
        type: "single",
        options: ["Nein", "Ja, Herz", "Ja, Lunge", "Ja, Krebs", "Ja, etwas anderes"],
      },
      {
        id: "E12",
        text: "Trinken Sie regelmäßig viel Alkohol oder haben Sie aktuell Probleme mit Alkohol oder anderen Suchtmitteln?",
        type: "single",
        options: ["Ja", "Nein", "Möchte ich nicht angeben"],
      },
      {
        id: "E13",
        text: "Gab es früher schon einmal eine Infektion in diesem Knie?",
        type: "single",
        options: ["Ja", "Nein", "Weiß ich nicht"],
      },
    ],
  },
  {
    id: "F",
    title: "Block F: Ziele, Erwartungen und Ergänzungen",
    questions: [
      {
        id: "F1",
        text: "Was möchten Sie durch die Behandlung Ihres Knies am meisten erreichen?",
        type: "multiple",
        options: [
          "Weniger Schmerzen",
          "Besser gehen können",
          "Wieder besser Treppen steigen",
          "Wieder besser schlafen",
          "Im Alltag unabhängiger sein",
          "Wieder arbeiten können",
          "Wieder Sport oder Hobbys ausüben",
          "Sonstiges",
        ],
      },
      {
        id: "F2",
        text: "Welche Aktivität möchten Sie am liebsten wieder besser machen können?",
        type: "text",
      },
      {
        id: "F3",
        text: "Was wäre für Sie persönlich ein gutes Ergebnis der Behandlung?",
        type: "text",
      },
      {
        id: "F4",
        text: "Wurde mit Ihnen schon einmal über eine mögliche Knieoperation gesprochen?",
        type: "single",
        options: ["Ja", "Nein"],
      },
      {
        id: "F5",
        text: "Haben Sie Sorgen oder Fragen zu einer möglichen Operation?",
        type: "single",
        options: ["Ja", "Nein", "Vielleicht"],
      },
      {
        id: "F6",
        text: "Gibt es noch etwas, das Ihr Arzt über Ihr Knie wissen sollte?",
        type: "text",
      },
    ],
  },
];

export const kneeTepQuestions = kneeTepBlocks.flatMap((block) =>
  block.questions.map((question) => ({
    ...question,
    blockId: block.id,
    blockTitle: block.title,
    blockLabels: blockTranslations[block.id],
    required: question.required !== false,
    piiCategory: question.piiCategory || "none",
    includeInAi: question.includeInAi !== false,
  }))
);

const blockTranslations = {
  A: {
    de: "Block A: Ihr Knieproblem",
    en: "Block A: Your knee problem",
  },
  B: {
    de: "Block B: Auswirkungen im Alltag",
    en: "Block B: Impact on daily life",
  },
  C: {
    de: "Block C: Bisherige Behandlung",
    en: "Block C: Previous treatment",
  },
  D: {
    de: "Block D: Vorbefunde und ärztliche Aussagen",
    en: "Block D: Previous findings and medical statements",
  },
  E: {
    de: "Block E: Gesundheit und Risiken",
    en: "Block E: Health and risks",
  },
  F: {
    de: "Block F: Ziele, Erwartungen und Ergänzungen",
    en: "Block F: Goals, expectations and additions",
  },
  G: {
    de: "Block G: Zusatzfragen",
    en: "Block G: Additional questions",
  },
};

const questionTranslations = {
  A1: {
    de: "Um welches Knie geht es heute?",
    en: "Which knee is this about today?",
  },
  A2: {
    de: "Haben Sie aktuell Schmerzen in diesem Knie?",
    en: "Do you currently have pain in this knee?",
  },
  A3: {
    de: "Seit wann haben Sie diese Knieschmerzen?",
    en: "How long have you had this knee pain?",
  },
  A4: {
    de: "Wie stark sind Ihre Knieschmerzen im Durchschnitt?",
    en: "How strong is your knee pain on average?",
  },
  A5: {
    de: "Wann treten die Schmerzen vor allem auf?",
    en: "When does the pain mainly occur?",
  },
  A6: {
    de: "Was beschreibt Ihre Beschwerden am besten?",
    en: "What best describes your symptoms?",
  },
  A7: {
    de: "Was ist heute der Hauptgrund für Ihren Termin?",
    en: "What is the main reason for your appointment today?",
  },
  B1: {
    de: "Wie sehr schränken Ihre Kniebeschwerden Ihren Alltag insgesamt ein?",
    en: "Overall, how much do your knee symptoms limit your everyday life?",
  },
  B2: {
    de: "Seit wann schränken Ihre Kniebeschwerden Ihren Alltag deutlich ein?",
    en: "How long have your knee symptoms clearly limited your daily life?",
  },
  B3: {
    de: "Bei welchen Aktivitäten haben Sie wegen Ihres Knies Schwierigkeiten?",
    en: "Which activities are difficult because of your knee?",
  },
  B4: {
    de: "Wie weit können Sie ungefähr am Stück gehen, bevor das Knie Sie deutlich einschränkt?",
    en: "Roughly how far can you walk at once before your knee clearly limits you?",
  },
  B5: {
    de: "Fühlt sich Ihr Knie manchmal instabil an oder knickt weg?",
    en: "Does your knee sometimes feel unstable or give way?",
  },
  B6: {
    de: "Haben Sie das Gefühl, dass Sie Ihr Knie nicht mehr richtig beugen oder strecken können?",
    en: "Do you feel that you can no longer bend or straighten your knee properly?",
  },
  B7: {
    de: "Haben Sie das Gefühl, dass Ihr Bein oder Knie schief steht?",
    en: "Do you feel that your leg or knee is misaligned?",
  },
  B8: {
    de: "Haben Sie das Gefühl, dass Ihr betroffenes Bein schwächer geworden ist?",
    en: "Do you feel that the affected leg has become weaker?",
  },
  B9: {
    de: "Brauchen Sie wegen Ihres Knies im Alltag Hilfe von anderen Personen?",
    en: "Do you need help from other people in daily life because of your knee?",
  },
  B10: {
    de: "Wie sehr leiden Sie persönlich unter Ihren Kniebeschwerden?",
    en: "How much do you personally suffer from your knee symptoms?",
  },
  C1: {
    de: "Wurden Ihre Kniebeschwerden schon behandelt?",
    en: "Have your knee symptoms already been treated?",
  },
  C2: {
    de: "Welche Behandlungen haben Sie bisher erhalten?",
    en: "Which treatments have you received so far?",
  },
  C3: {
    de: "Seit wie lange werden Ihre Kniebeschwerden schon behandelt?",
    en: "How long have your knee symptoms been treated?",
  },
  C4: {
    de: "Haben die bisherigen Behandlungen Ihre Beschwerden gebessert?",
    en: "Have previous treatments improved your symptoms?",
  },
  C5: {
    de: "Haben Sie in den letzten Monaten regelmäßig Physiotherapie oder Übungen gemacht?",
    en: "Have you regularly done physiotherapy or exercises in recent months?",
  },
  C6: {
    de: "Wurde Ihnen von einem Arzt schon einmal gesagt, dass Sie zunächst weiter ohne Operation behandelt werden sollen?",
    en: "Has a doctor ever told you that you should initially continue treatment without surgery?",
  },
  D1: {
    de: "Wurde von Ihrem Knie schon einmal ein Röntgenbild gemacht?",
    en: "Has an X-ray of your knee ever been taken?",
  },
  D2: {
    de: "Wurde Ihnen gesagt, dass in Ihrem Knie ein deutlicher Gelenkverschleiß oder Arthrose vorliegt?",
    en: "Have you been told that there is significant joint wear or osteoarthritis in your knee?",
  },
  D3: {
    de: "Wurde Ihnen gesagt, dass der Knorpel oder die Gelenkfläche im Knie deutlich geschädigt ist?",
    en: "Have you been told that the cartilage or joint surface in your knee is significantly damaged?",
  },
  D4: {
    de: "Wurde Ihnen gesagt, dass am Knochen oder an der Gelenkfläche ein Schaden vorliegt?",
    en: "Have you been told that there is damage to the bone or joint surface?",
  },
  D5: {
    de: "Haben Sie Arztbriefe, Röntgenbilder oder Befunde zu Ihrem Knie?",
    en: "Do you have medical letters, X-rays or findings for your knee?",
  },
  D6: {
    de: "Wurde Ihnen bereits einmal eine Knieprothese empfohlen?",
    en: "Have you ever been recommended a knee replacement?",
  },
  E0: {
    de: "Wie alt sind Sie?",
    en: "How old are you?",
  },
  E1: {
    de: "Haben Sie aktuell eine Entzündung oder Infektion im Knie, die gerade behandelt wird?",
    en: "Do you currently have inflammation or infection in the knee that is being treated?",
  },
  E2: {
    de: "Hatten Sie in den letzten 3 Monaten einen Herzinfarkt, Schlaganfall oder ein anderes schweres Herz-Kreislauf-Ereignis?",
    en: "Have you had a heart attack, stroke or another severe cardiovascular event in the last 3 months?",
  },
  E3: {
    de: "Haben Sie Diabetes oder erhöhte Blutzuckerwerte?",
    en: "Do you have diabetes or elevated blood sugar levels?",
  },
  E4: {
    de: "Wie groß sind Sie und wie viel wiegen Sie ungefähr?",
    en: "How tall are you and approximately how much do you weigh?",
  },
  E5: {
    de: "Rauchen Sie aktuell?",
    en: "Do you currently smoke?",
  },
  E6: {
    de: "Haben Sie in letzter Zeit eine Kortison-Spritze direkt ins Knie bekommen?",
    en: "Have you recently received a cortisone injection directly into the knee?",
  },
  E7: {
    de: "Wurde bei Ihnen schon einmal eine Blutarmut bzw. Anämie festgestellt?",
    en: "Have you ever been diagnosed with anemia?",
  },
  E8: {
    de: "Werden Sie aktuell wegen einer psychischen Erkrankung behandelt?",
    en: "Are you currently being treated for a mental health condition?",
  },
  E9: {
    de: "Haben Sie eine rheumatische Erkrankung?",
    en: "Do you have a rheumatic disease?",
  },
  E10: {
    de: "Nehmen Sie aktuell Kortison als Tabletten ein?",
    en: "Are you currently taking cortisone tablets?",
  },
  E11: {
    de: "Haben Sie eine andere schwere Erkrankung, wegen der Sie regelmäßig in ärztlicher Behandlung sind?",
    en: "Do you have another serious condition for which you receive regular medical care?",
  },
  E12: {
    de: "Trinken Sie regelmäßig viel Alkohol oder haben Sie aktuell Probleme mit Alkohol oder anderen Suchtmitteln?",
    en: "Do you regularly drink a lot of alcohol or currently have problems with alcohol or other substances?",
  },
  E13: {
    de: "Gab es früher schon einmal eine Infektion in diesem Knie?",
    en: "Has there ever been an infection in this knee before?",
  },
  F1: {
    de: "Was möchten Sie durch die Behandlung Ihres Knies am meisten erreichen?",
    en: "What would you most like to achieve through treatment of your knee?",
  },
  F2: {
    de: "Welche Aktivität möchten Sie am liebsten wieder besser machen können?",
    en: "Which activity would you most like to be able to do better again?",
  },
  F3: {
    de: "Was wäre für Sie persönlich ein gutes Ergebnis der Behandlung?",
    en: "What would personally be a good treatment outcome for you?",
  },
  F4: {
    de: "Wurde mit Ihnen schon einmal über eine mögliche Knieoperation gesprochen?",
    en: "Has a possible knee operation ever been discussed with you?",
  },
  F5: {
    de: "Haben Sie Sorgen oder Fragen zu einer möglichen Operation?",
    en: "Do you have concerns or questions about a possible operation?",
  },
  F6: {
    de: "Gibt es noch etwas, das Ihr Arzt über Ihr Knie wissen sollte?",
    en: "Is there anything else your doctor should know about your knee?",
  },
};

const optionTranslations = {
  Rechts: { de: "Rechts", en: "Right" },
  Links: { de: "Links", en: "Left" },
  Beide: { de: "Beide", en: "Both" },
  Ja: { de: "Ja", en: "Yes" },
  Nein: { de: "Nein", en: "No" },
  "Weniger als 3 Monate": {
    de: "Weniger als 3 Monate",
    en: "Less than 3 months",
  },
  "3 bis 6 Monate": {
    de: "3 bis 6 Monate",
    en: "3 to 6 months",
  },
  "6 bis 12 Monate": {
    de: "6 bis 12 Monate",
    en: "6 to 12 months",
  },
  "Länger als 1 Jahr": {
    de: "Länger als 1 Jahr",
    en: "More than 1 year",
  },
  "Beim Gehen oder Belasten": {
    de: "Beim Gehen oder Belasten",
    en: "When walking or bearing weight",
  },
  "Beim Treppensteigen": {
    de: "Beim Treppensteigen",
    en: "When climbing stairs",
  },
  "In Ruhe": { de: "In Ruhe", en: "At rest" },
  Nachts: { de: "Nachts", en: "At night" },
  "Eigentlich immer": {
    de: "Eigentlich immer",
    en: "Almost always",
  },
  Schmerz: { de: "Schmerz", en: "Pain" },
  Steifigkeit: { de: "Steifigkeit", en: "Stiffness" },
  "Unsicherheit im Knie": {
    de: "Unsicherheit im Knie",
    en: "Uncertainty in the knee",
  },
  "Das Knie knickt weg": {
    de: "Das Knie knickt weg",
    en: "The knee gives way",
  },
  "Knie lässt sich nicht richtig beugen oder strecken": {
    de: "Knie lässt sich nicht richtig beugen oder strecken",
    en: "The knee cannot be bent or straightened properly",
  },
  Schwellung: { de: "Schwellung", en: "Swelling" },
  "Etwas anderes": {
    de: "Etwas anderes",
    en: "Something else",
  },
  "Ursache klären": {
    de: "Ursache klären",
    en: "Clarify the cause",
  },
  "Behandlung besprechen": {
    de: "Behandlung besprechen",
    en: "Discuss treatment",
  },
  "Prüfen ob eine Operation sinnvoll sein könnte": {
    de: "Prüfen ob eine Operation sinnvoll sein könnte",
    en: "Check whether an operation could make sense",
  },
  Zweitmeinung: { de: "Zweitmeinung", en: "Second opinion" },
  Sonstiges: { de: "Sonstiges", en: "Other" },
  Gehen: { de: "Gehen", en: "Walking" },
  "Längeres Stehen": {
    de: "Längeres Stehen",
    en: "Standing for longer periods",
  },
  Treppensteigen: {
    de: "Treppensteigen",
    en: "Climbing stairs",
  },
  "Hinsetzen oder Aufstehen": {
    de: "Hinsetzen oder Aufstehen",
    en: "Sitting down or standing up",
  },
  Knien: { de: "Knien", en: "Kneeling" },
  Körperpflege: { de: "Körperpflege", en: "Personal care" },
  Haushalt: { de: "Haushalt", en: "Household tasks" },
  "Arbeit oder Beruf": {
    de: "Arbeit oder Beruf",
    en: "Work or job",
  },
  "Sport oder Hobbys": {
    de: "Sport oder Hobbys",
    en: "Sports or hobbies",
  },
  "Bus, Bahn oder Auto nutzen": {
    de: "Bus, Bahn oder Auto nutzen",
    en: "Using bus, train or car",
  },
  "Soziale Aktivitäten": {
    de: "Soziale Aktivitäten",
    en: "Social activities",
  },
  "Keine besonderen Schwierigkeiten": {
    de: "Keine besonderen Schwierigkeiten",
    en: "No particular difficulties",
  },
  "Mehr als 1 Kilometer": {
    de: "Mehr als 1 Kilometer",
    en: "More than 1 kilometer",
  },
  "500 Meter bis 1 Kilometer": {
    de: "500 Meter bis 1 Kilometer",
    en: "500 meters to 1 kilometer",
  },
  "100 bis 500 Meter": {
    de: "100 bis 500 Meter",
    en: "100 to 500 meters",
  },
  "Weniger als 100 Meter": {
    de: "Weniger als 100 Meter",
    en: "Less than 100 meters",
  },
  "Kaum möglich": {
    de: "Kaum möglich",
    en: "Hardly possible",
  },
  Nie: { de: "Nie", en: "Never" },
  Selten: { de: "Selten", en: "Rarely" },
  Manchmal: { de: "Manchmal", en: "Sometimes" },
  Häufig: { de: "Häufig", en: "Often" },
  "Weiß nicht": { de: "Weiß nicht", en: "I don't know" },
  Regelmäßig: { de: "Regelmäßig", en: "Regularly" },
  "Fast immer": {
    de: "Fast immer",
    en: "Almost always",
  },
  Schmerzmittel: {
    de: "Schmerzmittel",
    en: "Pain medication",
  },
  "Physiotherapie oder Krankengymnastik": {
    de: "Physiotherapie oder Krankengymnastik",
    en: "Physiotherapy",
  },
  "Übungen zu Hause": {
    de: "Übungen zu Hause",
    en: "Exercises at home",
  },
  "Spritzen ins Knie": {
    de: "Spritzen ins Knie",
    en: "Injections into the knee",
  },
  "Bandage oder Hilfsmittel": {
    de: "Bandage oder Hilfsmittel",
    en: "Brace or assistive device",
  },
  "Einlagen oder spezielle Schuhe": {
    de: "Einlagen oder spezielle Schuhe",
    en: "Insoles or special shoes",
  },
  "Empfehlung zur Gewichtsabnahme": {
    de: "Empfehlung zur Gewichtsabnahme",
    en: "Recommendation to lose weight",
  },
  "Sonstige Behandlung": {
    de: "Sonstige Behandlung",
    en: "Other treatment",
  },
  Keine: { de: "Keine", en: "None" },
  "Ja, deutlich": {
    de: "Ja, deutlich",
    en: "Yes, clearly",
  },
  "Ja, etwas": {
    de: "Ja, etwas",
    en: "Yes, somewhat",
  },
  "Nein, kaum oder gar nicht": {
    de: "Nein, kaum oder gar nicht",
    en: "No, hardly or not at all",
  },
  Teilweise: { de: "Teilweise", en: "Partly" },
  "Weiß ich nicht": {
    de: "Weiß ich nicht",
    en: "I don't know",
  },
  "Ja, ich habe Unterlagen": {
    de: "Ja, ich habe Unterlagen",
    en: "Yes, I have documents",
  },
  "Ich habe aufgehört": {
    de: "Ich habe aufgehört",
    en: "I have stopped",
  },
  "Ja, vor weniger als 6 Wochen": {
    de: "Ja, vor weniger als 6 Wochen",
    en: "Yes, less than 6 weeks ago",
  },
  "Ja, vor 6 Wochen bis 3 Monaten": {
    de: "Ja, vor 6 Wochen bis 3 Monaten",
    en: "Yes, 6 weeks to 3 months ago",
  },
  "Ja, vor mehr als 3 Monaten": {
    de: "Ja, vor mehr als 3 Monaten",
    en: "Yes, more than 3 months ago",
  },
  "Möchte ich nicht angeben": {
    de: "Möchte ich nicht angeben",
    en: "I prefer not to say",
  },
  "Ja, Herz": { de: "Ja, Herz", en: "Yes, heart" },
  "Ja, Lunge": { de: "Ja, Lunge", en: "Yes, lungs" },
  "Ja, Krebs": { de: "Ja, Krebs", en: "Yes, cancer" },
  "Ja, etwas anderes": {
    de: "Ja, etwas anderes",
    en: "Yes, something else",
  },
  "Weniger Schmerzen": {
    de: "Weniger Schmerzen",
    en: "Less pain",
  },
  "Besser gehen können": {
    de: "Besser gehen können",
    en: "Being able to walk better",
  },
  "Wieder besser Treppen steigen": {
    de: "Wieder besser Treppen steigen",
    en: "Climbing stairs better again",
  },
  "Wieder besser schlafen": {
    de: "Wieder besser schlafen",
    en: "Sleeping better again",
  },
  "Im Alltag unabhängiger sein": {
    de: "Im Alltag unabhängiger sein",
    en: "Being more independent in daily life",
  },
  "Wieder arbeiten können": {
    de: "Wieder arbeiten können",
    en: "Being able to work again",
  },
  "Wieder Sport oder Hobbys ausüben": {
    de: "Wieder Sport oder Hobbys ausüben",
    en: "Doing sports or hobbies again",
  },
  Vielleicht: { de: "Vielleicht", en: "Maybe" },
};

export function getBlockTitle(blockId, language = "de") {
  return (
    blockTranslations[blockId]?.[language] ||
    blockTranslations[blockId]?.de ||
    blockId ||
    ""
  );
}

export function getQuestionText(questionOrId, language = "de", fallback = "") {
  if (!questionOrId) {
    return fallback;
  }

  if (typeof questionOrId === "object" && questionOrId.labels) {
    return (
      questionOrId.labels[language] ||
      questionOrId.labels.de ||
      questionOrId.text ||
      fallback
    );
  }

  const questionId =
    typeof questionOrId === "string" ? questionOrId : questionOrId.id;

  const fallbackText =
    typeof questionOrId === "string" ? fallback : questionOrId.text;

  return (
    questionTranslations[questionId]?.[language] ||
    questionTranslations[questionId]?.de ||
    fallbackText ||
    questionId
  );
}

export function getOptionLabel(option, language = "de") {
  if (option && typeof option === "object") {
    return (
      option.labels?.[language] ||
      option.labels?.de ||
      option.label ||
      option.value ||
      ""
    );
  }

  return optionTranslations[option]?.[language] || optionTranslations[option]?.de || option;
}

export function getOptionValue(option) {
  return option && typeof option === "object" ? option.value : option;
}

export function getAnswerLabel(answer, language = "de", noAnswer = "keine Angabe") {
  if (Array.isArray(answer)) {
    return answer.length
      ? answer.map((item) => getOptionLabel(item, language)).join(", ")
      : noAnswer;
  }

  if (answer && typeof answer === "object") {
    const height = answer.height_cm ? `${answer.height_cm} cm` : noAnswer;
    const weight = answer.weight_kg ? `${answer.weight_kg} kg` : noAnswer;
    return `${height} / ${weight}`;
  }

  return answer ? getOptionLabel(answer, language) : noAnswer;
}

export function normalizeAdminQuestion(question) {
  return {
    id: question.id,
    blockId: question.block_id,
    blockTitle: question.block_title?.de || question.block_id,
    blockLabels: question.block_title || {
      de: question.block_id,
      en: question.block_id,
    },
    type: question.type,
    labels: question.labels,
    text: question.labels?.de || question.id,
    options: question.options || [],
    min: question.min ?? 0,
    max: question.max ?? 10,
    required: question.required !== false,
    piiCategory: question.pii_category || "none",
    includeInAi: question.include_in_ai !== false,
    source: "admin",
  };
}

export function defaultAnswer(question) {
  if (question.type === "multiple") {
    return [];
  }

  if (question.type === "slider") {
    return Math.round(((question.min ?? 0) + (question.max ?? 10)) / 2);
  }

  if (question.type === "number_pair") {
    return {
      height_cm: "",
      weight_kg: "",
    };
  }

  return "";
}

export function isAnswerComplete(question, value) {
  if (!question) {
    return false;
  }

  if (question.required === false) {
    return true;
  }

  if (question.type === "multiple") {
    return Array.isArray(value) && value.length > 0;
  }

  if (question.type === "number_pair") {
    return Number(value?.height_cm) > 0 && Number(value?.weight_kg) > 0;
  }

  if (question.type === "slider") {
    return Number.isFinite(Number(value));
  }

  return String(value || "").trim().length > 0;
}