import io
import re
import base64
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Tuple, Dict, Any, Optional
from pypdf import PdfReader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings, api_key_rotator


class DocumentParseResult:
    def __init__(self, full_text: str, pages_data: List[Dict[str, Any]], links: List[str]):
        self.full_text = full_text
        self.pages_data = pages_data  # list of {"page": int, "text": str}
        self.links = links


class DocumentService:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=120,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def extract_from_pdf(self, content: bytes) -> DocumentParseResult:
        pdf_reader = PdfReader(io.BytesIO(content))
        pages_data = []
        links = []
        full_text_parts = []

        for idx, page in enumerate(pdf_reader.pages, start=1):
            page_text = page.extract_text() or ""
            # Extract hyperlinks
            annots = getattr(page, "annotations", None)
            if annots is None and "/Annots" in page:
                annots_obj = page["/Annots"]
                annots = annots_obj.get_object() if hasattr(annots_obj, "get_object") else annots_obj
            
            if annots:
                for annot in annots:
                    obj = annot.get_object() if hasattr(annot, "get_object") else annot
                    if isinstance(obj, dict) and obj.get("/Subtype") == "/Link" and "/A" in obj:
                        action = obj["/A"]
                        action = action.get_object() if hasattr(action, "get_object") else action
                        if isinstance(action, dict) and "/URI" in action:
                            uri = action["/URI"]
                            uri = uri.get_object() if hasattr(uri, "get_object") else uri
                            if isinstance(uri, bytes):
                                try:
                                    uri = uri.decode('utf-8', errors='ignore')
                                except Exception:
                                    uri = None
                            if uri and isinstance(uri, str) and uri not in links:
                                links.append(uri)

            clean_text = page_text.strip()
            if clean_text:
                pages_data.append({"page": idx, "text": clean_text})
                full_text_parts.append(f"--- Page {idx} ---\n{clean_text}")

        full_text = "\n\n".join(full_text_parts)
        if links:
            full_text += "\n\n[DOCUMENT HYPERLINKS]\n" + "\n".join(links)
        return DocumentParseResult(full_text=full_text, pages_data=pages_data, links=links)

    def extract_from_docx(self, content: bytes) -> DocumentParseResult:
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        paragraphs.append(row_text)
            text = "\n\n".join(paragraphs)
        except Exception:
            # Fallback to direct XML parse
            text = self._extract_docx_xml(content)

        pages_data = [{"page": 1, "text": text}]
        return DocumentParseResult(full_text=text, pages_data=pages_data, links=[])

    def _extract_docx_xml(self, content: bytes) -> str:
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            # Find all text nodes
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            texts = [node.text for node in tree.findall('.//w:t', namespaces) if node.text]
            return " ".join(texts)
        except Exception as e:
            return f"Error extracting DOCX text: {e}"

    def extract_from_pptx(self, content: bytes) -> DocumentParseResult:
        pages_data = []
        full_text_parts = []
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                # Find all slide files
                slide_files = sorted([f for f in z.namelist() if f.startswith("ppt/slides/slide") and f.endswith(".xml")])
                for idx, slide_path in enumerate(slide_files, start=1):
                    xml_data = z.read(slide_path)
                    tree = ET.fromstring(xml_data)
                    namespaces = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
                    slide_texts = [node.text for node in tree.findall('.//a:t', namespaces) if node.text]
                    slide_content = " ".join(slide_texts).strip()
                    if slide_content:
                        pages_data.append({"page": idx, "text": slide_content})
                        full_text_parts.append(f"--- Slide {idx} ---\n{slide_content}")
        except Exception as e:
            full_text_parts.append(f"Error parsing PPTX: {e}")

        full_text = "\n\n".join(full_text_parts)
        if not pages_data:
            pages_data = [{"page": 1, "text": full_text or "No text found in presentation."}]
        return DocumentParseResult(full_text=full_text, pages_data=pages_data, links=[])

    def extract_from_xlsx(self, content: bytes) -> DocumentParseResult:
        pages_data = []
        full_text_parts = []
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            for idx, sheet_name in enumerate(wb.sheetnames, start=1):
                sheet = wb[sheet_name]
                rows_text = []
                for row in sheet.iter_rows(values_only=True):
                    row_vals = [str(val).strip() for val in row if val is not None]
                    if row_vals:
                        rows_text.append(" | ".join(row_vals))
                sheet_text = f"Sheet: {sheet_name}\n" + "\n".join(rows_text)
                pages_data.append({"page": idx, "text": sheet_text})
                full_text_parts.append(f"--- Sheet {idx} ({sheet_name}) ---\n{sheet_text}")
        except Exception as e:
            full_text_parts.append(f"Error parsing Excel spreadsheet: {e}")

        full_text = "\n\n".join(full_text_parts)
        if not pages_data:
            pages_data = [{"page": 1, "text": full_text or "No table data found."}]
        return DocumentParseResult(full_text=full_text, pages_data=pages_data, links=[])

    def extract_from_image(self, content: bytes, filename: str) -> DocumentParseResult:
        """
        Uses Gemini Multimodal Vision for OCR, table structure recovery, and visual analysis.
        """
        keys = api_key_rotator.get_rotated_google_keys()
        if not keys:
            return DocumentParseResult(
                full_text="[Image text extraction unavailable: No Google API key configured]",
                pages_data=[{"page": 1, "text": "[Image: " + filename + "]"}],
                links=[]
            )

        mime_type = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
        b64_image = base64.b64encode(content).decode("utf-8")

        prompt = (
            "You are an expert OCR and document analysis system. "
            "Transcribe all text, numbers, formulas, tables, labels, and diagrams from this document/image. "
            "Output clear, structured markdown. Do not include introductory conversational filler."
        )

        ocr_text = ""
        for key in keys:
            try:
                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    google_api_key=key,
                    temperature=0.0
                )
                message = HumanMessage(
                    content=[
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{b64_image}"}
                        }
                    ]
                )
                res = llm.invoke([message])
                ocr_text = res.content if isinstance(res.content, str) else str(res.content)
                if ocr_text.strip():
                    break
            except Exception as e:
                print(f"Image OCR attempt with key failed: {e}")
                continue

        if not ocr_text.strip():
            ocr_text = f"[Image: {filename} - OCR could not recognize text]"

        pages_data = [{"page": 1, "text": ocr_text}]
        return DocumentParseResult(full_text=ocr_text, pages_data=pages_data, links=[])

    def extract_from_text(self, content: bytes) -> DocumentParseResult:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = content.decode("latin-1")
            except Exception:
                text = content.decode("utf-8", errors="ignore")
        pages_data = [{"page": 1, "text": text}]
        return DocumentParseResult(full_text=text, pages_data=pages_data, links=[])

    def parse_document(self, content: bytes, filename: str) -> DocumentParseResult:
        ext = filename.lower().split(".")[-1] if "." in filename else ""
        if ext == "pdf":
            return self.extract_from_pdf(content)
        elif ext in ["docx", "doc"]:
            return self.extract_from_docx(content)
        elif ext in ["pptx", "ppt"]:
            return self.extract_from_pptx(content)
        elif ext in ["xlsx", "xls", "csv"]:
            if ext == "csv":
                return self.extract_from_text(content)
            return self.extract_from_xlsx(content)
        elif ext in ["png", "jpg", "jpeg", "webp", "bmp"]:
            return self.extract_from_image(content, filename)
        else:
            # Default to text / markdown / code
            return self.extract_from_text(content)

    def chunk_document(
        self,
        parse_result: DocumentParseResult,
        user_id: str,
        filename: str,
        document_id: str
    ) -> List[Document]:
        all_chunks: List[Document] = []
        chunk_idx = 0

        # Chunk per page to retain accurate page citations
        for page_info in parse_result.pages_data:
            page_num = page_info.get("page", 1)
            page_text = page_info.get("text", "").strip()
            if not page_text:
                continue

            page_chunks = self.splitter.split_text(page_text)
            for chunk_content in page_chunks:
                chunk_idx += 1
                metadata = {
                    "user_id": user_id,
                    "document_id": document_id,
                    "filename": filename,
                    "page": page_num,
                    "chunk_id": f"{document_id}_{chunk_idx}"
                }
                all_chunks.append(Document(page_content=chunk_content, metadata=metadata))

        # Fallback if pages were somehow empty but full_text exists
        if not all_chunks and parse_result.full_text.strip():
            raw_chunks = self.splitter.split_text(parse_result.full_text)
            for c in raw_chunks:
                chunk_idx += 1
                all_chunks.append(
                    Document(
                        page_content=c,
                        metadata={
                            "user_id": user_id,
                            "document_id": document_id,
                            "filename": filename,
                            "page": 1,
                            "chunk_id": f"{document_id}_{chunk_idx}"
                        }
                    )
                )

        return all_chunks

document_service = DocumentService()
