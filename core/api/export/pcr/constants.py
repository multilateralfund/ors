# (key, title) of the PCR sections, in the order and with the numbering of the
# PCR template. The keys are the ones selected by the user in the export.
SECTIONS = [
    ("overview", "Project overview"),
    ("project_results", "Project results: overall assessment highlights"),
    ("causes_of_delay", "Causes of delays and action taken"),
    ("lessons_learned", "Lessons learned"),
    ("gender_mainstreaming", "Gender mainstreaming"),
    ("sdgs", "Contribution to the sustainable development goals"),
    ("summary_of_key_data", "Summary of key data on project implementation"),
    ("supporting_evidence", "Other supporting evidence"),
]
SECTION_KEYS = [key for key, _ in SECTIONS]
