import io

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

from core.api.export.pcr.sections import (
    NO_DATA_TEXT,
    Fields,
    PCRDocument,
    format_value,
)

FONT_NAME = "Times New Roman"


def _set_repeat_table_header(row):
    """The header row is repeated when the table continues on the next page"""
    tr_pr = row._tr.get_or_add_trPr()  # pylint: disable=protected-access
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def _shade_cell(cell, color="F2F2F2"):
    tc_pr = cell._tc.get_or_add_tcPr()  # pylint: disable=protected-access
    shading = OxmlElement("w:shd")
    shading.set(qn("w:val"), "clear")
    shading.set(qn("w:color"), "auto")
    shading.set(qn("w:fill"), color)
    tc_pr.append(shading)


def _write_cell(cell, text, bold=False, font_size=None):
    paragraph = cell.paragraphs[0]
    run = paragraph.add_run(text)
    run.bold = bold
    if font_size:
        run.font.size = font_size


class PCRDocxRenderer:
    def __init__(self, document: PCRDocument):
        self.document = document
        self.doc = docx.Document()
        self._setup()

    def _setup(self):
        section = self.doc.sections[0]
        # Letter, as the PCR template
        section.page_width = Cm(21.59)
        section.page_height = Cm(27.94)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2)
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)

        normal = self.doc.styles["Normal"]
        normal.font.name = FONT_NAME
        normal.font.size = Pt(11)
        normal.paragraph_format.space_after = Pt(0)
        for style_name in ["Heading 1", "Heading 2", "Heading 3"]:
            style = self.doc.styles[style_name]
            style.font.name = FONT_NAME
            style.font.size = Pt(13 if style_name == "Heading 1" else 11)
            style.font.bold = True
            style.font.color.rgb = None
            style.paragraph_format.space_before = Pt(12)
            style.paragraph_format.space_after = Pt(6)
            # python-docx does not set the east asian font, used by some viewers
            style.element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)

        self._add_page_number_footer(section)

    @staticmethod
    def _add_page_number_footer(section):
        paragraph = section.footer.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = paragraph.add_run()
        for tag, text in [
            ("w:fldChar", "begin"),
            ("w:instrText", "PAGE"),
            ("w:fldChar", "end"),
        ]:
            element = OxmlElement(tag)
            if tag == "w:fldChar":
                element.set(qn("w:fldCharType"), text)
            else:
                element.set(qn("xml:space"), "preserve")
                element.text = text
            run._r.append(element)  # pylint: disable=protected-access

    def _add_spacing(self):
        self.doc.add_paragraph()

    def _add_fields(self, block: Fields):
        table = self.doc.add_table(rows=0, cols=2)
        table.style = "Table Grid"
        for label, value in block.items:
            cells = table.add_row().cells
            _write_cell(cells[0], label, bold=True)
            _write_cell(cells[1], format_value(value))
        for row in table.rows:
            row.cells[0].width = Cm(6.5)
            row.cells[1].width = Cm(10.5)
        self._add_spacing()

    def _add_table(self, block):
        if not block.rows:
            paragraph = self.doc.add_paragraph()
            paragraph.add_run(NO_DATA_TEXT).italic = True
            self._add_spacing()
            return
        font_size = Pt(8) if len(block.headers) > 6 else None
        table = self.doc.add_table(rows=1, cols=len(block.headers))
        table.style = "Table Grid"
        header_row = table.rows[0]
        _set_repeat_table_header(header_row)
        for cell, header in zip(header_row.cells, block.headers):
            _write_cell(cell, header, bold=True, font_size=font_size)
            _shade_cell(cell)
        for row in block.rows:
            cells = table.add_row().cells
            for cell, value in zip(cells, row):
                _write_cell(cell, format_value(value), font_size=font_size)
        self._add_spacing()

    def _add_block(self, block):
        if block.title:
            self.doc.add_heading(block.title, level=3)
        if isinstance(block, Fields):
            self._add_fields(block)
        else:
            self._add_table(block)

    def render(self) -> bytes:
        heading = self.doc.add_heading(self.document.title.upper(), level=1)
        heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
        self._add_block(self.document.identification)
        for section in self.document.sections:
            self.doc.add_heading(
                f"SECTION {section.number}: {section.title.upper()}", level=2
            )
            for block in section.blocks:
                self._add_block(block)

        out = io.BytesIO()
        self.doc.save(out)
        return out.getvalue()


def render_docx(document: PCRDocument) -> bytes:
    return PCRDocxRenderer(document).render()
