import unicodedata

from pdfminer.high_level import extract_text


def pdf_text(pdf_file):
    text = extract_text(pdf_file)
    # Normalize to avoid weird comparisons like 'ﬃ' != 'ffi'
    return unicodedata.normalize("NFKD", text)
