"""German wording of the risk notes: 'im Knie' / 'in der Hüfte', never 'in das Knie' or 'zu das Knie'.

Run from the backend folder:  python -m unittest discover tests
"""
import unittest

from app.report_service import generate_documentation_flags

TRIGGER_ANSWERS = {"A2": "Nein", "E1": "Ja", "E2": "Ja", "D1": "Nein", "D2": "Nein"}
UNKNOWN_ANSWERS = {"E1": "Weiß ich nicht", "E2": "Weiß ich nicht", "D1": "Weiß ich nicht", "D2": "Weiß ich nicht"}

WRONG = ("in das Knie", "in die Hüfte", "zu das", "zu die", "Infektion in das", "Schmerzen in das")


def descriptions(indication, values):
    answers = [{"question_id": key, "answer": value} for key, value in values.items()]
    return [flag.description for flag in generate_documentation_flags(answers, indication)]


class FlagWordingTest(unittest.TestCase):
    def collect(self, indication):
        return descriptions(indication, TRIGGER_ANSWERS) + descriptions(indication, UNKNOWN_ANSWERS)

    def test_no_ungrammatical_joint_phrases(self):
        for indication in ("knee_tep", "hip_tep"):
            for text in self.collect(indication):
                if "Kortison-Spritze" in text:
                    continue  # "direkt in das Knie" is correct (accusative, direction)
                for wrong in WRONG:
                    self.assertNotIn(wrong, text, f"{indication}: {text}")

    def test_knee_uses_im_knie(self):
        text = " ".join(self.collect("knee_tep"))
        self.assertIn("keine aktuellen Schmerzen im Knie", text)
        self.assertIn("Infektion im Knie", text)

    def test_hip_uses_in_der_huefte(self):
        text = " ".join(self.collect("hip_tep"))
        self.assertIn("keine aktuellen Schmerzen in der Hüfte", text)
        self.assertIn("Infektion in der Hüfte", text)

    def test_missing_findings_note_uses_location_form(self):
        for indication, expected in (("knee_tep", "Befunde im Knie."), ("hip_tep", "Befunde in der Hüfte.")):
            text = " ".join(self.collect(indication))
            self.assertIn(expected, text, indication)

    def test_cortisone_notes_keep_the_direction_form(self):
        knee = descriptions("knee_tep", {"E7": "Ja, vor weniger als 6 Wochen"})
        self.assertTrue(any("direkt in das Knie" in text for text in knee), knee)

        hip = descriptions("hip_tep", {"E8": "Ja, vor weniger als 6 Wochen"})
        self.assertTrue(any("direkt in die Hüfte" in text for text in hip), hip)


if __name__ == "__main__":
    unittest.main()
