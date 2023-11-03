import os

from core.printer.printer import temporary_browser
from core.printer.tests.conftest import pdf_text


def test_printer():
    with temporary_browser() as browser:
        browser.get("https://example.com/")
        browser.wait_until_visible("h1")

        tmppath = browser.print_to_pdf()
        text = pdf_text(tmppath)
        assert "Example Domain" in text

    # Ensure that we clean up after the browser closes
    assert not os.path.exists(tmppath)
