import base64
import io
from pypdf import PdfReader

def extract_text_from_file(file_name: str, file_type: str, base64_content: str) -> str:
    """
    Decodes Base64 and extracts text based on file type.
    """
    try:
        # Decode the Base64 string back to bytes
        decoded_bytes = base64.b64decode(base64_content)
        file_stream = io.BytesIO(decoded_bytes)
        
        extracted_text = ""

        # 1. PDF Handling
        if "pdf" in file_type or file_name.endswith(".pdf"):
            reader = PdfReader(file_stream)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        # 2. Plain Text / Code Handling (txt, py, js, md, json, etc.)
        else:
            # Try decoding as UTF-8
            extracted_text = decoded_bytes.decode('utf-8')

        return extracted_text.strip()

    except Exception as e:
        print(f"Error extracting file {file_name}: {e}")
        return f"[Error reading file {file_name}]"