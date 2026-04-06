import io
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class PDFService:
    @staticmethod
    def extract_text_from_bytes(content: bytes) -> str:
        pdf_reader = PdfReader(io.BytesIO(content))
        text = ""
        links = []
        
        for page in pdf_reader.pages:
            # 1. Extract visible text
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
            
            # 2. Extract hidden hyperlinks from annotations
            if "/Annots" in page:
                for annot in page["/Annots"]:
                    obj = annot.get_object()
                    if obj.get("/Subtype") == "/Link" and "/A" in obj:
                        action = obj["/A"]
                        if "/URI" in action:
                            uri = action["/URI"]
                            if uri and uri not in links:
                                links.append(uri)
        
        # Append extracted links to the end of the text for AI analysis
        if links:
            text += "\n\n[DOC_LINKS]\n"
            text += "\n".join(links)
            
        return text

    @staticmethod
    def chunk_text(text: str, user_id: str, filename: str, document_id: str):
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        docs = splitter.create_documents(
            [text],
            metadatas=[{"user_id": user_id, "filename": filename, "document_id": document_id}],
        )
        return docs

pdf_service = PDFService()
