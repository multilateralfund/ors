import io

import openpyxl
from django.http import FileResponse


class CPReportBase:
    sections = ()

    def get_xlsx(self, data, usages):
        wb = openpyxl.Workbook()
        for section in self.sections:
            name = section.replace("_", " ").title()
            sheet = wb.create_sheet(name)
            getattr(self, f"export_{section}")(
                sheet,
                data.get(section),
                usages.get(section),
            )

        # Remove the default sheet before saving
        wb.remove_sheet(wb.get_sheet_by_name(wb.get_sheet_names()[0]))

        # Save xlsx and return the response
        xls = io.BytesIO()
        wb.save(xls)
        xls.seek(0)
        return FileResponse(
            xls, as_attachment=True, filename=data["cp_report"]["name"] + ".xlsx"
        )
