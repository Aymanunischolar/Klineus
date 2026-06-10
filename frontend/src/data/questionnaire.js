export const DISCLAIMER =
  "AI-generated draft. Must be reviewed and approved by a physician.";

const label = (de, en = de) => ({ de, en });

const option = (de, en = de) => ({
  value: de,
  labels: label(de, en),
});

const options = (items) =>
  items.map((item) => {
    if (Array.isArray(item)) {
      return option(item[0], item[1]);
    }

    return option(item);
  });

const common = {
  side: options([
    ["Rechts", "Right"],
    ["Links", "Left"],
    ["Beide", "Both"],
  ]),
  yesNo: options([
    ["Ja", "Yes"],
    ["Nein", "No"],
  ]),
  yesNoUnknown: options([
    ["Ja", "Yes"],
    ["Nein", "No"],
    ["Weiß ich nicht", "I don’t know"],
  ]),
  duration: options([
    ["Weniger als 3 Monate", "Less than 3 months"],
    ["3 bis 6 Monate", "3 to 6 months"],
    ["6 bis 12 Monate", "6 to 12 months"],
    ["Länger als 1 Jahr", "Longer than 1 year"],
  ]),
};

function makeQuestionnaire({
  id,
  indication,
  slug,
  labelDe,
  labelEn,
  descriptionDe,
  descriptionEn,
  version,
  blocks,
}) {
  return {
    id,
    indication,
    slug,
    labels: label(labelDe, labelEn),
    description: label(descriptionDe, descriptionEn),
    version,
    blocks: blocks.map((block, blockIndex) => ({
      ...block,
      order: blockIndex + 1,
      title: block.titleDe,
      labels: label(block.titleDe, block.titleEn),
      questions: block.questions.map((question, questionIndex) => ({
        required: true,
        includeInAi: true,
        piiCategory: "none",
        min: question.type === "slider" ? 0 : question.min,
        max: question.type === "slider" ? 10 : question.max,
        ...question,
        text: question.textDe,
        labels: label(question.textDe, question.textEn),
        blockId: block.id,
        blockTitle: block.titleDe,
        blockLabels: label(block.titleDe, block.titleEn),
        order: questionIndex + 1,
      })),
    })),
  };
}

export const kneeTepQuestionnaire = makeQuestionnaire({
  id: "knee_tep_v2_wajjahat",
  indication: "knee_tep",
  slug: "knie-tep",
  version: 2,
  labelDe: "Knie-TEP Fragebogen",
  labelEn: "Knee replacement questionnaire",
  descriptionDe:
    "Leitlinienbasierter Fragebogen zur Vorbereitung der ärztlichen Prüfung bei Knie-TEP.",
  descriptionEn:
    "Guideline-based questionnaire to prepare the medical review for knee replacement.",
  blocks: [
    {
      id: "A",
      titleDe: "Block A: Ihr Knieproblem",
      titleEn: "Block A: Your knee problem",
      questions: [
        {
          id: "A1",
          textDe: "Um welches Knie geht es heute?",
          textEn: "Which knee is this about today?",
          type: "single",
          options: common.side,
        },
        {
          id: "A2",
          textDe: "Haben Sie aktuell Schmerzen in diesem Knie?",
          textEn: "Do you currently have pain in this knee?",
          type: "single",
          options: common.yesNo,
        },
        {
          id: "A3",
          textDe: "Seit wann haben Sie diese Knieschmerzen?",
          textEn: "How long have you had this knee pain?",
          type: "single",
          options: common.duration,
          showIf: { questionId: "A2", equals: "Ja" },
        },
        {
          id: "A4",
          textDe: "Wie stark sind Ihre Knieschmerzen im Durchschnitt?",
          textEn: "How severe is your knee pain on average?",
          type: "slider",
          min: 0,
          max: 10,
          showIf: { questionId: "A2", equals: "Ja" },
        },
        {
          id: "A5",
          textDe: "Wann treten die Schmerzen vor allem auf?",
          textEn: "When does the pain mainly occur?",
          type: "multiple",
          options: options([
            ["Beim Gehen oder Belasten", "When walking or putting weight on it"],
            ["Beim Treppensteigen", "When climbing stairs"],
            ["In Ruhe", "At rest"],
            ["Nachts", "At night"],
            ["Eigentlich immer", "Almost all the time"],
          ]),
          showIf: { questionId: "A2", equals: "Ja" },
        },
        {
          id: "A6",
          textDe: "Was beschreibt Ihre Beschwerden am besten?",
          textEn: "What best describes your symptoms?",
          type: "multiple",
          options: options([
            ["Schmerz", "Pain"],
            ["Steifigkeit", "Stiffness"],
            ["Unsicherheit im Knie", "Instability in the knee"],
            ["Das Knie knickt weg", "The knee gives way"],
            [
              "Knie lässt sich nicht richtig beugen oder strecken",
              "The knee cannot be properly bent or straightened",
            ],
            ["Schwellung", "Swelling"],
            ["Etwas anderes", "Something else"],
          ]),
        },
        {
          id: "A7",
          textDe: "Was ist heute der Hauptgrund für Ihren Termin?",
          textEn: "What is the main reason for your appointment today?",
          type: "single",
          options: options([
            ["Ursache klären", "Clarify the cause"],
            ["Behandlung besprechen", "Discuss treatment"],
            [
              "Prüfen ob eine Operation sinnvoll sein könnte",
              "Check whether surgery could make sense",
            ],
            ["Zweitmeinung", "Second opinion"],
            ["Sonstiges", "Other"],
          ]),
        },
      ],
    },
    {
      id: "B",
      titleDe: "Block B: Auswirkungen im Alltag",
      titleEn: "Block B: Effects on everyday life",
      questions: [
        {
          id: "B1",
          textDe:
            "Wie sehr schränken Ihre Kniebeschwerden Ihren Alltag insgesamt ein?",
          textEn:
            "How much do your knee symptoms limit your everyday life overall?",
          type: "slider",
          min: 0,
          max: 10,
        },
        {
          id: "B2",
          textDe:
            "Wie weit können Sie ungefähr am Stück gehen, bevor das Knie Sie deutlich einschränkt?",
          textEn:
            "About how far can you walk at a time before the knee significantly limits you?",
          type: "single",
          options: options([
            ["Mehr als 1 Kilometer", "More than 1 kilometre"],
            ["500 Meter bis 1 Kilometer", "500 metres to 1 kilometre"],
            ["100 bis 500 Meter", "100 to 500 metres"],
            ["Weniger als 100 Meter", "Less than 100 metres"],
            ["Kaum möglich", "Hardly possible"],
          ]),
        },
        {
          id: "B3",
          textDe: "Haben Sie das Gefühl, dass Ihr Bein oder Knie schief steht?",
          textEn: "Do you feel that your leg or knee is misaligned?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "B4",
          textDe:
            "Haben Sie das Gefühl, dass Ihr betroffenes Bein schwächer geworden ist?",
          textEn: "Do you feel that your affected leg has become weaker?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "B5",
          textDe:
            "Brauchen Sie wegen Ihres Knies im Alltag Hilfe von anderen Personen?",
          textEn:
            "Do you need help from other people in everyday life because of your knee?",
          type: "single",
          options: options([
            ["Nein", "No"],
            ["Selten", "Rarely"],
            ["Regelmäßig", "Regularly"],
            ["Fast immer", "Almost always"],
          ]),
        },
      ],
    },
    {
      id: "C",
      titleDe: "Block C: Bisherige Behandlung",
      titleEn: "Block C: Previous treatment",
      questions: [
        {
          id: "C1",
          textDe:
            "Wurden Ihre Kniebeschwerden schon mal nichtoperativ behandelt?",
          textEn: "Have your knee symptoms already been treated non-operatively?",
          type: "single",
          options: common.yesNo,
        },
        {
          id: "C2",
          textDe: "Welche Behandlungen haben Sie bisher erhalten?",
          textEn: "Which treatments have you received so far?",
          type: "multiple",
          options: options([
            ["Schmerzmittel", "Pain medication"],
            [
              "Physiotherapie oder Krankengymnastik",
              "Physiotherapy or physical therapy",
            ],
            ["Übungen zu Hause", "Exercises at home"],
            ["Spritzen ins Knie", "Injections into the knee"],
            ["Bandage oder Hilfsmittel", "Brace or aids"],
            ["Einlagen oder spezielle Schuhe", "Insoles or special shoes"],
            ["Empfehlung zur Gewichtsabnahme", "Recommendation to lose weight"],
            ["Sonstige Behandlung", "Other treatment"],
            ["Keine", "None"],
          ]),
          showIf: { questionId: "C1", equals: "Ja" },
        },
        {
          id: "C3",
          textDe:
            "Seit wie lange werden Ihre Kniebeschwerden schon behandelt?",
          textEn: "How long have your knee symptoms already been treated?",
          type: "single",
          options: common.duration,
          showIf: { questionId: "C1", equals: "Ja" },
        },
        {
          id: "C4",
          textDe:
            "Haben die bisherigen Behandlungen Ihre Beschwerden gebessert?",
          textEn: "Have the treatments so far improved your symptoms?",
          type: "single",
          options: options([
            ["Ja, deutlich", "Yes, significantly"],
            ["Ja, etwas", "Yes, somewhat"],
            ["Nein, kaum oder gar nicht", "No, hardly or not at all"],
          ]),
          showIf: { questionId: "C1", equals: "Ja" },
        },
        {
          id: "C5",
          textDe:
            "Wurde Ihnen von einem Arzt schon einmal gesagt, dass Sie zunächst weiter ohne Operation behandelt werden sollen?",
          textEn:
            "Has a doctor ever told you that you should first continue treatment without surgery?",
          type: "single",
          options: common.yesNoUnknown,
        },
      ],
    },
    {
      id: "D",
      titleDe: "Block D: Vorbefunde und ärztliche Aussagen",
      titleEn: "Block D: Previous findings and medical statements",
      questions: [
        {
          id: "D1",
          textDe:
            "Haben Sie Arztbriefe, Röntgenbilder oder Befunde zu Ihrem Knie?",
          textEn:
            "Do you have medical letters, X-rays or findings related to your knee?",
          type: "single",
          options: options([
            ["Ja, ich habe Unterlagen", "Yes, I have documents"],
            ["Nein", "No"],
          ]),
          notesByValue: {
            "Ja, ich habe Unterlagen":
              "Bitte bringen Sie die Bilder und Befunde zum Termin mit.",
          },
          notesByValueEn: {
            "Ja, ich habe Unterlagen":
              "Please bring the images and findings to your appointment.",
          },
        },
        {
          id: "D2",
          textDe: "Wurde Ihnen bereits einmal eine Knieprothese empfohlen?",
          textEn: "Has a knee replacement ever been recommended to you?",
          type: "single",
          options: common.yesNoUnknown,
        },
      ],
    },
    {
      id: "E",
      titleDe: "Block E: Gesundheit und Risiken",
      titleEn: "Block E: Health and risks",
      questions: [
        {
          id: "E1",
          textDe:
            "Haben Sie aktuell eine Entzündung oder Infektion im Knie, die gerade behandelt wird?",
          textEn:
            "Do you currently have inflammation or an infection in the knee that is being treated?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E2",
          textDe:
            "Gab es früher schon einmal eine Infektion in diesem Knie?",
          textEn: "Has there ever been an infection in this knee before?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E3",
          textDe:
            "Hatten Sie in den letzten 3 Monaten einen Herzinfarkt, Schlaganfall oder ein anderes schweres Herz-Kreislauf-Ereignis?",
          textEn:
            "Have you had a heart attack, stroke or another serious cardiovascular event in the last 3 months?",
          type: "single",
          options: common.yesNoUnknown,
          notesByValue: {
            Ja: "Bitte bringen Sie falls vorhanden Entlassungsbriefe zum Termin mit.",
          },
          notesByValueEn: {
            Ja: "Please bring discharge letters to your appointment if available.",
          },
        },
        {
          id: "E4",
          textDe: "Haben Sie Diabetes oder erhöhte Blutzuckerwerte?",
          textEn: "Do you have diabetes or elevated blood sugar levels?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E5",
          textDe: "Wie groß sind Sie und wie viel wiegen Sie ungefähr?",
          textEn: "How tall are you and approximately how much do you weigh?",
          type: "number_pair",
        },
        {
          id: "E6",
          textDe: "Rauchen Sie aktuell?",
          textEn: "Do you currently smoke?",
          type: "single_with_text",
          options: options([
            [
              "Ja, mit Angabe Packungen pro Tag und Rauchjahre",
              "Yes, with number of packs per day and years of smoking",
            ],
            ["Nein", "No"],
            ["Ich habe aufgehört seit…", "I stopped since…"],
          ]),
          detailsIf: [
            "Ja, mit Angabe Packungen pro Tag und Rauchjahre",
            "Ich habe aufgehört seit…",
          ],
          detailsLabel: "Angabe",
          detailsLabels: label("Angabe", "Details"),
        },
        {
          id: "E7",
          textDe:
            "Haben Sie in letzter Zeit eine Kortison-Spritze direkt ins Knie bekommen?",
          textEn:
            "Have you recently had a cortisone injection directly into the knee?",
          type: "single",
          options: options([
            ["Nein", "No"],
            ["Ja, vor weniger als 6 Wochen", "Yes, less than 6 weeks ago"],
            [
              "Ja, vor 6 Wochen bis 3 Monaten",
              "Yes, 6 weeks to 3 months ago",
            ],
            ["Ja, vor mehr als 3 Monaten", "Yes, more than 3 months ago"],
            ["Weiß ich nicht", "I don’t know"],
          ]),
        },
        {
          id: "E8",
          textDe:
            "Wurde bei Ihnen schon einmal eine Blutarmut bzw. Anämie festgestellt?",
          textEn: "Have you ever been diagnosed with anaemia?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E9",
          textDe:
            "Werden Sie aktuell wegen einer psychischen Erkrankung behandelt?",
          textEn:
            "Are you currently being treated for a mental health condition?",
          type: "single",
          options: options([
            ["Ja", "Yes"],
            ["Nein", "No"],
            ["Möchte ich nicht angeben", "I prefer not to say"],
          ]),
        },
        {
          id: "E10",
          textDe: "Haben Sie eine rheumatische Erkrankung?",
          textEn: "Do you have a rheumatic disease?",
          type: "single_with_text",
          options: common.yesNoUnknown,
          detailsIf: ["Ja"],
          detailsLabel: "Welche Erkrankung?",
          detailsLabels: label("Welche Erkrankung?", "Which disease?"),
        },
        {
          id: "E11",
          textDe: "Nehmen Sie aktuell Kortison als Tabletten ein?",
          textEn: "Are you currently taking cortisone tablets?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E12",
          textDe:
            "Haben Sie eine andere schwere Erkrankung, wegen der Sie regelmäßig in ärztlicher Behandlung sind?",
          textEn:
            "Do you have another serious illness for which you are regularly under medical treatment?",
          type: "single_with_text",
          options: options([
            ["Nein", "No"],
            ["Ja", "Yes"],
          ]),
          detailsIf: ["Ja"],
          detailsLabel: "Welche Erkrankung?",
          detailsLabels: label("Welche Erkrankung?", "Which illness?"),
        },
        {
          id: "E13",
          textDe:
            "Trinken Sie regelmäßig viel Alkohol oder haben Sie aktuell Probleme mit Alkohol oder anderen Suchtmitteln?",
          textEn:
            "Do you regularly drink a lot of alcohol or currently have problems with alcohol or other addictive substances?",
          type: "single",
          options: options([
            ["Ja", "Yes"],
            ["Nein", "No"],
            ["Möchte ich nicht angeben", "I prefer not to say"],
          ]),
        },
      ],
    },
    {
      id: "F",
      titleDe: "Block F: Ziele, Erwartungen und Ergänzungen",
      titleEn: "Block F: Goals, expectations and additional information",
      questions: [
        {
          id: "F1",
          textDe:
            "Was möchten Sie durch die Behandlung Ihres Knies am meisten erreichen?",
          textEn:
            "What would you most like to achieve through treatment of your knee?",
          type: "multiple",
          options: options([
            ["Weniger Schmerzen", "Less pain"],
            ["Besser gehen können", "Being able to walk better"],
            ["Wieder besser Treppen steigen", "Being able to climb stairs better again"],
            ["Wieder besser schlafen", "Being able to sleep better again"],
            ["Im Alltag unabhängiger sein", "Being more independent in everyday life"],
            ["Wieder arbeiten können", "Being able to work again"],
            ["Wieder Sport oder Hobbys ausüben", "Being able to do sports or hobbies again"],
            ["Sonstiges", "Other"],
          ]),
        },
        {
          id: "F2",
          textDe:
            "Haben Sie Sorgen oder Fragen zu einer möglichen Operation?",
          textEn: "Do you have concerns or questions about possible surgery?",
          type: "single_with_text",
          options: options([
            ["Ja", "Yes"],
            ["Nein", "No"],
            ["Vielleicht", "Maybe"],
          ]),
          detailsIf: ["Ja", "Vielleicht"],
          detailsLabel: "Freitext",
          detailsLabels: label("Freitext", "Free text"),
        },
        {
          id: "F3",
          textDe:
            "Gibt es noch etwas, das Ihr Arzt über Ihr Knie wissen sollte?",
          textEn: "Is there anything else your doctor should know about your knee?",
          type: "text",
          required: false,
        },
      ],
    },
  ],
});

export const hipTepQuestionnaire = makeQuestionnaire({
  id: "hip_tep_v2_wajjahat",
  indication: "hip_tep",
  slug: "hueft-tep",
  version: 2,
  labelDe: "Hüft-TEP Fragebogen",
  labelEn: "Hip replacement questionnaire",
  descriptionDe:
    "Leitlinienbasierter Fragebogen zur Vorbereitung der ärztlichen Prüfung bei Hüft-TEP.",
  descriptionEn:
    "Guideline-based questionnaire to prepare the medical review for hip replacement.",
  blocks: [
    {
      id: "A",
      titleDe: "Block A: Ihr Hüftproblem",
      titleEn: "Block A: Your hip problem",
      questions: [
        {
          id: "A1",
          textDe: "Um welche Hüfte geht es heute?",
          textEn: "Which hip is this about today?",
          type: "single",
          options: common.side,
        },
        {
          id: "A2",
          textDe: "Haben Sie aktuell Schmerzen in dieser Hüfte?",
          textEn: "Do you currently have pain in this hip?",
          type: "single",
          options: common.yesNo,
        },
        {
          id: "A3",
          textDe: "Seit wann haben Sie diese Hüftschmerzen?",
          textEn: "How long have you had this hip pain?",
          type: "single",
          options: common.duration,
          showIf: { questionId: "A2", equals: "Ja" },
        },
        {
          id: "A4",
          textDe: "Wie stark sind Ihre Hüftschmerzen im Durchschnitt?",
          textEn: "How severe is your hip pain on average?",
          type: "slider",
          min: 0,
          max: 10,
          showIf: { questionId: "A2", equals: "Ja" },
        },
        {
          id: "A5",
          textDe: "Wann treten die Schmerzen vor allem auf?",
          textEn: "When does the pain mainly occur?",
          type: "multiple",
          options: options([
            ["Beim Gehen oder Belasten", "When walking or putting weight on it"],
            ["Beim Aufstehen oder Lagewechsel", "When standing up or changing position"],
            ["In Ruhe", "At rest"],
            ["Nachts", "At night"],
            ["Eigentlich immer", "Almost all the time"],
          ]),
          showIf: { questionId: "A2", equals: "Ja" },
        },
        {
          id: "A6",
          textDe: "Was beschreibt Ihre Beschwerden am besten?",
          textEn: "What best describes your symptoms?",
          type: "multiple",
          options: options([
            ["Schmerz", "Pain"],
            ["Steifigkeit", "Stiffness"],
            ["Die Hüfte ist unbeweglich", "The hip is stiff or difficult to move"],
            ["Ich humpele", "I limp"],
            ["Die Hüfte fühlt sich schwach an", "The hip feels weak"],
            ["Etwas anderes", "Something else"],
          ]),
        },
        {
          id: "A7",
          textDe: "Was ist der Hauptgrund für Ihren Termin?",
          textEn: "What is the main reason for your appointment?",
          type: "single",
          options: options([
            ["Ursache klären", "Clarify the cause"],
            ["Behandlung besprechen", "Discuss treatment"],
            [
              "Prüfen ob eine Operation sinnvoll sein könnte",
              "Check whether surgery could make sense",
            ],
            ["Zweitmeinung", "Second opinion"],
            ["Sonstiges", "Other"],
          ]),
        },
      ],
    },
    {
      id: "B",
      titleDe: "Block B: Auswirkungen im Alltag",
      titleEn: "Block B: Effects on everyday life",
      questions: [
        {
          id: "B1",
          textDe:
            "Wie sehr schränken Ihre Hüftbeschwerden Ihren Alltag insgesamt ein?",
          textEn:
            "How much do your hip symptoms limit your everyday life overall?",
          type: "slider",
          min: 0,
          max: 10,
        },
        {
          id: "B2",
          textDe:
            "Seit wann schränken Ihre Hüftbeschwerden Ihren Alltag deutlich ein?",
          textEn:
            "Since when have your hip symptoms significantly limited your everyday life?",
          type: "single",
          options: common.duration,
        },
        {
          id: "B3",
          textDe:
            "Bei welchen Aktivitäten haben Sie wegen Ihrer Hüfte Schwierigkeiten?",
          textEn: "Which activities are difficult for you because of your hip?",
          type: "multiple",
          options: options([
            ["Gehen", "Walking"],
            ["Längeres Stehen", "Standing for longer periods"],
            ["Treppensteigen", "Climbing stairs"],
            ["Hinsetzen oder Aufstehen", "Sitting down or standing up"],
            ["Schuhe oder Socken anziehen", "Putting on shoes or socks"],
            ["Haushalt", "Household tasks"],
            ["Arbeit oder Beruf", "Work or occupation"],
            ["Sport oder Hobbys", "Sports or hobbies"],
            ["Verkehrsmittel nutzen", "Using transport"],
            ["Sexualität", "Sexual activity"],
            ["Keine besonderen Schwierigkeiten", "No particular difficulties"],
          ]),
        },
        {
          id: "B4",
          textDe:
            "Wie weit können Sie ungefähr am Stück gehen, bevor die Hüfte Sie deutlich einschränkt?",
          textEn:
            "About how far can you walk at a time before the hip significantly limits you?",
          type: "single",
          options: options([
            ["Mehr als 1 km", "More than 1 km"],
            ["500 m bis 1 km", "500 m to 1 km"],
            ["Unter 500 m", "Under 500 m"],
            ["Unter 100 m", "Under 100 m"],
            ["Kaum möglich", "Hardly possible"],
          ]),
        },
        {
          id: "B5",
          textDe:
            "Wie sehr leiden Sie persönlich unter Ihren Hüftbeschwerden?",
          textEn: "How much do you personally suffer from your hip symptoms?",
          type: "slider",
          min: 0,
          max: 10,
        },
      ],
    },
    {
      id: "C",
      titleDe: "Block C: Bisherige Behandlung",
      titleEn: "Block C: Previous treatment",
      questions: [
        {
          id: "C1",
          textDe: "Wurden Ihre Hüftbeschwerden schon behandelt?",
          textEn: "Have your hip symptoms already been treated?",
          type: "single",
          options: common.yesNo,
        },
        {
          id: "C2",
          textDe: "Welche Behandlungen haben Sie bisher erhalten?",
          textEn: "Which treatments have you received so far?",
          type: "multiple",
          options: options([
            ["Schmerzmittel", "Pain medication"],
            [
              "Physiotherapie oder Krankengymnastik",
              "Physiotherapy or physical therapy",
            ],
            ["Übungen zu Hause", "Exercises at home"],
            ["Spritzen in die Hüfte", "Injections into the hip"],
            ["Gehstock oder andere Hilfsmittel", "Walking stick or other aids"],
            ["Sonstige Behandlung", "Other treatment"],
            ["Keine", "None"],
          ]),
          showIf: { questionId: "C1", equals: "Ja" },
        },
        {
          id: "C3",
          textDe:
            "Seit wie lange werden Ihre Hüftbeschwerden schon behandelt?",
          textEn: "How long have your hip symptoms already been treated?",
          type: "single",
          options: common.duration,
          showIf: { questionId: "C1", equals: "Ja" },
        },
        {
          id: "C4",
          textDe:
            "Haben die bisherigen Behandlungen Ihre Beschwerden gebessert?",
          textEn: "Have the treatments so far improved your symptoms?",
          type: "single",
          options: options([
            ["Ja, deutlich", "Yes, significantly"],
            ["Ja, etwas", "Yes, somewhat"],
            ["Nein, kaum oder gar nicht", "No, hardly or not at all"],
          ]),
          showIf: { questionId: "C1", equals: "Ja" },
        },
        {
          id: "C5",
          textDe:
            "Wurden Sie über Ihre Hüfterkrankung und mögliche Behandlungen aufgeklärt oder beraten?",
          textEn:
            "Have you been informed or advised about your hip condition and possible treatments?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "C6",
          textDe:
            "Haben Sie in den letzten Monaten regelmäßig Bewegungstherapie, Krankengymnastik oder gezielte Übungen gemacht?",
          textEn:
            "In recent months, have you regularly done exercise therapy, physiotherapy or targeted exercises?",
          type: "single",
          options: options([
            ["Ja", "Yes"],
            ["Nein", "No"],
            ["Teilweise", "Partly"],
          ]),
        },
        {
          id: "C7",
          textDe:
            "Wurde Ihnen von einem Arzt schon einmal gesagt, dass Sie zunächst weiter ohne Operation behandelt werden sollen?",
          textEn:
            "Has a doctor ever told you that you should first continue treatment without surgery?",
          type: "single",
          options: common.yesNoUnknown,
        },
      ],
    },
    {
      id: "D",
      titleDe: "Block D: Vorbefunde und ärztliche Aussagen",
      titleEn: "Block D: Previous findings and medical statements",
      questions: [
        {
          id: "D1",
          textDe:
            "Wurde Ihnen gesagt, dass in Ihrer Hüfte ein deutlicher Gelenkverschleiß oder Arthrose vorliegt?",
          textEn:
            "Have you been told that there is significant joint wear or osteoarthritis in your hip?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "D2",
          textDe:
            "Haben Sie Arztbriefe, Röntgenbilder oder Befunde zu Ihrer Hüfte?",
          textEn:
            "Do you have medical letters, X-rays or findings related to your hip?",
          type: "single",
          options: options([
            ["Ja, ich habe Unterlagen", "Yes, I have documents"],
            ["Nein", "No"],
          ]),
          notesByValue: {
            "Ja, ich habe Unterlagen":
              "Bitte bringen Sie Unterlagen zum Termin mit.",
          },
          notesByValueEn: {
            "Ja, ich habe Unterlagen":
              "Please bring the documents to your appointment.",
          },
        },
        {
          id: "D3",
          textDe: "Wurde Ihnen bereits einmal eine Hüftprothese empfohlen?",
          textEn: "Has a hip replacement ever been recommended to you?",
          type: "single_with_text",
          options: options([
            ["Ja", "Yes"],
            ["Nein", "No"],
            ["Weiß ich nicht", "I don’t know"],
          ]),
          detailsIf: ["Ja"],
          detailsLabel: "Auf welcher Seite?",
          detailsLabels: label("Auf welcher Seite?", "Which side?"),
        },
      ],
    },
    {
      id: "E",
      titleDe: "Block E: Gesundheit und Risiken",
      titleEn: "Block E: Health and risks",
      questions: [
        {
          id: "E1",
          textDe:
            "Haben Sie aktuell eine Entzündung oder Infektion in der Hüfte oder an anderer Stelle, die gerade behandelt wird?",
          textEn:
            "Do you currently have inflammation or an infection in the hip or elsewhere that is being treated?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E2",
          textDe:
            "Gab es früher schon einmal eine Infektion in dieser Hüfte?",
          textEn: "Has there ever been an infection in this hip before?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E3",
          textDe:
            "Haben Sie eine schwere Herz-, Lungen-, Krebs- oder andere Erkrankung, wegen der Ärzte Ihnen ein erhöhtes Operationsrisiko gesagt haben?",
          textEn:
            "Do you have a serious heart, lung, cancer or other illness for which doctors have told you that you have an increased surgical risk?",
          type: "single_with_text",
          options: options([
            ["Nein", "No"],
            ["Ja", "Yes"],
            ["Weiß ich nicht", "I don’t know"],
          ]),
          detailsIf: ["Ja"],
          detailsLabel: "Erkrankungen",
          detailsLabels: label("Erkrankungen", "Illnesses"),
        },
        {
          id: "E4",
          textDe: "Wie groß sind Sie und wie viel wiegen Sie ungefähr?",
          textEn: "How tall are you and approximately how much do you weigh?",
          type: "number_pair",
        },
        {
          id: "E5",
          textDe: "Rauchen Sie aktuell?",
          textEn: "Do you currently smoke?",
          type: "single_with_text",
          options: options([
            ["Ja, täglich", "Yes, daily"],
            ["Ja, gelegentlich", "Yes, occasionally"],
            ["Nein", "No"],
            ["Ich habe aufgehört seit …", "I stopped since …"],
          ]),
          detailsIf: ["Ja, täglich", "Ich habe aufgehört seit …"],
          detailsLabel: "Angabe",
          detailsLabels: label("Angabe", "Details"),
        },
        {
          id: "E6",
          textDe: "Haben Sie Diabetes oder erhöhte Blutzuckerwerte?",
          textEn: "Do you have diabetes or elevated blood sugar levels?",
          type: "single_with_text",
          options: common.yesNoUnknown,
          detailsIf: ["Ja"],
          detailsLabel: "Diabetes-Typ und HbA1c Wert",
          detailsLabels: label(
            "Diabetes-Typ und HbA1c Wert",
            "Diabetes type and HbA1c value",
          ),
        },
        {
          id: "E7",
          textDe:
            "Wurde bei Ihnen schon einmal eine Blutarmut oder Anämie festgestellt?",
          textEn: "Have you ever been diagnosed with anaemia?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E8",
          textDe:
            "Haben Sie in letzter Zeit eine Kortison-Spritze direkt in die Hüfte bekommen?",
          textEn:
            "Have you recently had a cortisone injection directly into the hip?",
          type: "single",
          options: options([
            ["Nein", "No"],
            ["Ja, vor weniger als 6 Wochen", "Yes, less than 6 weeks ago"],
            [
              "Ja, vor 6 Wochen bis 3 Monaten",
              "Yes, 6 weeks to 3 months ago",
            ],
            ["Ja, vor mehr als 3 Monaten", "Yes, more than 3 months ago"],
            ["Weiß ich nicht", "I don’t know"],
          ]),
        },
        {
          id: "E9",
          textDe:
            "Wird oder wurde bei Ihnen eine psychische Erkrankung vermutet oder behandelt?",
          textEn:
            "Is or was a mental health condition suspected or treated in your case?",
          type: "single_with_text",
          options: options([
            ["Ja und zwar…", "Yes, namely…"],
            ["Nein", "No"],
            ["Möchte ich nicht angeben", "I prefer not to say"],
          ]),
          detailsIf: ["Ja und zwar…"],
          detailsLabel: "Angabe",
          detailsLabels: label("Angabe", "Details"),
        },
        {
          id: "E10",
          textDe:
            "Haben Sie aktuell Beschwerden beim Wasserlassen oder einen behandlungsbedürftigen Harnwegsinfekt?",
          textEn:
            "Do you currently have discomfort when urinating or a urinary tract infection requiring treatment?",
          type: "single",
          options: common.yesNoUnknown,
        },
        {
          id: "E11",
          textDe:
            "Nehmen Sie dauerhaft Medikamente ein, die Ihr Immunsystem deutlich beeinflussen?",
          textEn:
            "Do you permanently take medication that significantly affects your immune system?",
          type: "single_with_text",
          options: options([
            ["Ja, und zwar…", "Yes, namely…"],
            ["Nein", "No"],
            ["Weiß ich nicht", "I don’t know"],
          ]),
          detailsIf: ["Ja, und zwar…"],
          detailsLabel: "Angabe",
          detailsLabels: label("Angabe", "Details"),
        },
      ],
    },
    {
      id: "F",
      titleDe: "Block F: Ziele, Erwartungen und gemeinsame Entscheidung",
      titleEn: "Block F: Goals, expectations and shared decision-making",
      questions: [
        {
          id: "F1",
          textDe:
            "Haben Sie Sorgen oder Fragen zu einer möglichen Operation?",
          textEn: "Do you have concerns or questions about possible surgery?",
          type: "single_with_text",
          options: options([
            ["Ja", "Yes"],
            ["Nein", "No"],
            ["Vielleicht", "Maybe"],
          ]),
          detailsIf: ["Ja", "Vielleicht"],
          detailsLabel: "Freitext",
          detailsLabels: label("Freitext", "Free text"),
        },
        {
          id: "F2",
          textDe:
            "Gibt es noch etwas, das Ihr Arzt über Ihre Hüfte wissen sollte?",
          textEn: "Is there anything else your doctor should know about your hip?",
          type: "text",
          required: false,
        },
      ],
    },
  ],
});

export const questionnairesByIndication = {
  knee_tep: kneeTepQuestionnaire,
  hip_tep: hipTepQuestionnaire,
};

export function getQuestionnaire(indication = "knee_tep") {
  return questionnairesByIndication[indication] || kneeTepQuestionnaire;
}

function flattenQuestions(questionnaire) {
  return questionnaire.blocks.flatMap((block) => block.questions);
}

export const kneeTepBlocks = kneeTepQuestionnaire.blocks;
export const hipTepBlocks = hipTepQuestionnaire.blocks;
export const kneeTepQuestions = flattenQuestions(kneeTepQuestionnaire);
export const hipTepQuestions = flattenQuestions(hipTepQuestionnaire);

export function getQuestionsForIndication(indication = "knee_tep") {
  return flattenQuestions(getQuestionnaire(indication));
}

function getRawAnswerValue(answer) {
  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
    return answer.value ?? answer.choice ?? "";
  }

  return answer;
}

function answerMatches(answer, condition) {
  if (!condition) return true;

  const raw = getRawAnswerValue(answer);

  if (Object.prototype.hasOwnProperty.call(condition, "equals")) {
    return raw === condition.equals;
  }

  if (Array.isArray(condition.in)) {
    return condition.in.includes(raw);
  }

  if (Object.prototype.hasOwnProperty.call(condition, "not")) {
    return raw !== condition.not;
  }

  return true;
}

export function shouldShowQuestion(question, answers) {
  if (!question.showIf) return true;

  return answerMatches(answers[question.showIf.questionId], question.showIf);
}

export function getVisibleQuestions(questions, answers) {
  return questions.filter((question) => shouldShowQuestion(question, answers));
}

export function getBlockTitle(blockId, language = "de", indication = "knee_tep") {
  const block = getQuestionnaire(indication).blocks.find(
    (item) => item.id === blockId,
  );

  return block?.labels?.[language] || block?.labels?.de || block?.title || blockId;
}

export function getQuestionText(
  questionOrId,
  language = "de",
  fallback = "",
  indication = "knee_tep",
) {
  if (typeof questionOrId === "object") {
    return (
      questionOrId.labels?.[language] ||
      questionOrId.labels?.de ||
      questionOrId.text ||
      fallback
    );
  }

  const question = getQuestionsForIndication(indication).find(
    (item) => item.id === questionOrId,
  );

  return (
    question?.labels?.[language] ||
    question?.labels?.de ||
    question?.text ||
    fallback ||
    questionOrId
  );
}

export function getOptionLabel(optionItem, language = "de") {
  return optionItem && typeof optionItem === "object"
    ? optionItem.labels?.[language] || optionItem.labels?.de || optionItem.value || ""
    : optionItem;
}

export function getOptionValue(optionItem) {
  return optionItem && typeof optionItem === "object"
    ? optionItem.value
    : optionItem;
}

export function getAnswerLabel(answer, language = "de", noAnswer = "keine Angabe") {
  if (Array.isArray(answer)) {
    return answer.length
      ? answer.map((item) => getOptionLabel(item, language)).join(", ")
      : noAnswer;
  }

  if (answer && typeof answer === "object") {
    if (Object.prototype.hasOwnProperty.call(answer, "value")) {
      const main = answer.value || noAnswer;
      return answer.detail ? `${main}: ${answer.detail}` : main;
    }

    const height = answer.height_cm;
    const weight = answer.weight_kg;

    if (height || weight) {
      return `Größe: ${height || "-"} cm, Gewicht: ${weight || "-"} kg`;
    }

    return noAnswer;
  }

  return answer ? getOptionLabel(answer, language) : noAnswer;
}

export function normalizeAdminQuestion(question) {
  return {
    id: question.id || question.question_id,
    blockId: question.block_id,
    blockTitle:
      question.block_title?.de || question.block_title_de || question.block_id,
    blockLabels: question.block_title || {
      de: question.block_title_de || question.block_id,
      en: question.block_title_en || question.block_title_de || question.block_id,
    },
    type: question.type,
    labels: question.labels || {
      de: question.question_de || question.id,
      en: question.question_en || question.question_de || question.id,
    },
    text: question.labels?.de || question.question_de || question.id,
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
  if (question.type === "multiple") return [];
  if (question.type === "slider") return 5;
  if (question.type === "number_pair") return { height_cm: "", weight_kg: "" };
  if (question.type === "single_with_text") return { value: "", detail: "" };

  return "";
}

export function isAnswerComplete(question, value) {
  if (question.required === false) return true;

  if (question.type === "multiple") {
    return Array.isArray(value) && value.length > 0;
  }

  if (question.type === "number_pair") {
    return Number(value?.height_cm) > 0 && Number(value?.weight_kg) > 0;
  }

  if (question.type === "slider") {
    return Number.isFinite(Number(value));
  }

  if (question.type === "single_with_text") {
    const selected = value?.value || "";

    if (!selected) return false;

    if (question.detailsIf?.includes(selected)) {
      return String(value?.detail || "").trim().length > 0;
    }

    return true;
  }

  return String(value || "").trim().length > 0;
}