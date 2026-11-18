from django.template.loader import render_to_string
from weasyprint import HTML

from core.api.export.pcr.sections import Fields, PCRDocument, format_value


def _format_block(block):
    if isinstance(block, Fields):
        return {
            "type": "fields",
            "title": block.title,
            "items": [(label, format_value(value)) for label, value in block.items],
        }
    return {
        "type": "table",
        "title": block.title,
        "headers": block.headers,
        "rows": [[format_value(value) for value in row] for row in block.rows],
    }


def render_pdf(document: PCRDocument) -> bytes:
    context = {
        "title": document.title,
        "identification": _format_block(document.identification),
        "sections": [
            {
                "number": section.number,
                "title": section.title,
                "blocks": [_format_block(block) for block in section.blocks],
            }
            for section in document.sections
        ],
    }
    html = render_to_string("pcr_export/pcr.html", context)
    return HTML(string=html).write_pdf()
