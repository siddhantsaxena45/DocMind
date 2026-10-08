import io
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class PDFService:
    @staticmethod
    def extract_text_from_bytes(content: bytes) -> tuple[str, str]:
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
                            if uri and isinstance(uri, str) and uri not in links:
                                links.append(uri)
                            elif uri and isinstance(uri, bytes):
                                try:
                                    uri_str = uri.decode('utf-8')
                                    if uri_str not in links:
                                        links.append(uri_str)
                                except:
                                    pass
        
        links_text = ""
        # Append extracted links to the end of the text for AI analysis
        if links:
            links_text = "\n\n[DOC_LINKS]\n" + "\n".join(links)
            
        return text, links_text

    @staticmethod
    def chunk_text(text: str, links_text: str, user_id: str, filename: str, document_id: str):
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        docs = splitter.create_documents(
            [text],
            metadatas=[{"user_id": user_id, "filename": filename, "document_id": document_id}],
        )
        
        # Inject the links into every chunk so the context is preserved during vector retrieval
        if links_text:
            for doc in docs:
                doc.page_content += links_text
                
        return docs

pdf_service = PDFService()
