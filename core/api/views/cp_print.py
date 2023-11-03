from django.conf import settings
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import views

from core.models import CPReport
from core.printer.printer import temporary_browser


class CPPrintView(views.APIView):
    """Print CP Report with the specified ID"""

    def get(self, *args, pk=None, **kwargs):
        obj = get_object_or_404(CPReport, pk=pk)

        url = settings.PRINTER_FRONTEND_HOST + f"/country-programme/{pk}"
        with temporary_browser() as browser:
            browser.get(url)
            browser.authenticate(
                settings.PRINTER_USERNAME, settings.PRINTER_USER_PASSWORD
            )
            # TODO: replace with a more reliable loading wait method
            browser.wait_until_visible("#header-title")
            browser.wait_until_not_visible(".loading")
            tmpf = browser.print_to_pdf()

            response = FileResponse(
                tmpf.open("rb"), as_attachment=True, filename=obj.name + ".pdf"
            )
            return response
