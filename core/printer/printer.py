import base64
import logging
import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path

from django.conf import settings
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.print_page_options import PrintOptions
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


SCRIPT_TIMEOUT = 20

PREFERENCES = {
    # Firefox doesn't have support for Command.GET_LOG, this is the best we
    # can do ATM (see https://github.com/mozilla/geckodriver/issues/284)
    "devtools.console.stdout.content": True,
    # Disable user interaction while printing
    "print.always_print_silent": True,
    "print.show_print_progress": False,
    # Print menu settings
    "print.more-settings.open": True,
    "print.printer_Mozilla_Save_to_PDF.print_bgcolor": True,
    "print.printer_Mozilla_Save_to_PDF.print_bgimages": True,
    "print.printer_Mozilla_Save_to_PDF.print_duplex": 0,
    "print.printer_Mozilla_Save_to_PDF.print_edge_bottom": 0,
    "print.printer_Mozilla_Save_to_PDF.print_edge_left": 0,
    "print.printer_Mozilla_Save_to_PDF.print_edge_right": 0,
    "print.printer_Mozilla_Save_to_PDF.print_edge_top": 0,
    "print.printer_Mozilla_Save_to_PDF.print_footercenter": "",
    "print.printer_Mozilla_Save_to_PDF.print_footerleft": "",
    "print.printer_Mozilla_Save_to_PDF.print_footerright": "",
    "print.printer_Mozilla_Save_to_PDF.print_headercenter": "",
    "print.printer_Mozilla_Save_to_PDF.print_headerleft": "",
    "print.printer_Mozilla_Save_to_PDF.print_headerright": "",
    "print.printer_Mozilla_Save_to_PDF.print_in_color": True,
    "print.printer_Mozilla_Save_to_PDF.print_margin_bottom": "10",
    "print.printer_Mozilla_Save_to_PDF.print_margin_left": "5",
    "print.printer_Mozilla_Save_to_PDF.print_margin_right": "5",
    "print.printer_Mozilla_Save_to_PDF.print_margin_top": "5",
    # Hardcoded to portrait
    "print.printer_Mozilla_Save_to_PDF.print_orientation": 0,
    "print.printer_Mozilla_Save_to_PDF.print_page_delay": 100,
    "print.printer_Mozilla_Save_to_PDF.print_paper_height": "297",
    "print.printer_Mozilla_Save_to_PDF.print_paper_width": "210",
    "print.printer_Mozilla_Save_to_PDF.print_paper_id": "iso_a4",
    # Units used for height, width and margins:
    # 0 = inches, 1 = millimeters
    "print.printer_Mozilla_Save_to_PDF.print_paper_size_unit": 1,
    "print.printer_Mozilla_Save_to_PDF.print_reversed": False,
    "print.printer_Mozilla_Save_to_PDF.print_scaling": "1",
    "print.printer_Mozilla_Save_to_PDF.print_shrink_to_fit": True,
    "print.printer_Mozilla_Save_to_PDF.print_to_file": True,
    # Set dynamically in a temporary dir
    # "print.printer_Mozilla_Save_to_PDF.print_to_filename": "",
    "print.printer_Mozilla_Save_to_PDF.print_unwriteable_margin_bottom": 0,
    "print.printer_Mozilla_Save_to_PDF.print_unwriteable_margin_left": 0,
    "print.printer_Mozilla_Save_to_PDF.print_unwriteable_margin_right": 0,
    "print.printer_Mozilla_Save_to_PDF.print_unwriteable_margin_top": 0,
    "print_printer": "Mozilla Save to PDF",
}

logger = logging.getLogger(__name__)


class Browser(webdriver.Firefox):
    def __init__(self, **kwargs):
        self.print_dir = Path(tempfile.mkdtemp(prefix="printer"))
        self.print_path = self.print_dir / "report.pdf"

        self.print_options = PrintOptions()
        self.print_options.orientation = "portrait"
        self.print_options.shrink_to_fit = True
        self.print_options.background = True

        options = Options()
        if settings.PRINTER_BROWSER_HEADLESS:
            options.add_argument("--headless")

        options.add_argument("--window-size=1920x1080")
        for key, value in PREFERENCES.items():
            options.set_preference(key, value)
        options.set_preference(
            "print.printer_Mozilla_Save_to_PDF.print_to_filename",
            str(self.print_path),
        )

        geckodriver_path = shutil.which("geckodriver")
        driver_service = Service(executable_path=geckodriver_path)

        super().__init__(options=options, service=driver_service, **kwargs)
        self.set_script_timeout(SCRIPT_TIMEOUT)
        self.set_page_load_timeout(SCRIPT_TIMEOUT)

    def __del__(self):
        self._clean_tmp_dir()

    def __getitem__(self, css_selector):
        return self.find_element(By.CSS_SELECTOR, css_selector)

    def quit(self):
        self._clean_tmp_dir()
        super().quit()

    def _clean_tmp_dir(self):
        shutil.rmtree(self.print_dir, ignore_errors=True)

    def wait_until_visible(self, css_selector, timeout=10):
        logger.debug("Waiting until visible: %r", css_selector)
        return WebDriverWait(self, timeout).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, css_selector)),
            f"Expected element to be visible: f{css_selector!r}",
        )

    def wait_until_not_visible(self, css_selector, timeout=10):
        logger.debug("Waiting until NOT visible: %r", css_selector)
        return WebDriverWait(self, timeout).until_not(
            EC.visibility_of_element_located((By.CSS_SELECTOR, css_selector)),
            f"Expected element to be NOT visible: f{css_selector!r}",
        )

    def authenticate(self, username, password):
        logger.info("Authenticating as %r", username)

        self.wait_until_visible("[name=username]").send_keys(username)
        self.wait_until_visible("[name=password]").send_keys(password)
        self.wait_until_visible("button[type=submit]").click()

    def get(self, url):
        logger.info("Navigating to %r", url)
        return super().get(url)

    def print_to_pdf(self):
        logger.info("Printing to PDF: %s", self.print_path)
        with self.print_path.open("wb") as print_file:
            data = base64.b64decode(self.print_page(print_options=self.print_options))
            print_file.write(data)
        logger.debug("Print complete: %s", self.print_path)
        return self.print_path


@contextmanager
def temporary_browser(**kwargs):
    browser = Browser(**kwargs)
    logger.debug("Browser ready")
    try:
        yield browser
    finally:
        logger.debug("Quitting browser")
        browser.quit()
