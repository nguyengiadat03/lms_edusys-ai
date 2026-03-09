# OCR Test API

FastAPI service for testing OCR (Optical Character Recognition) on different file formats using various AI models.

## Supported File Formats & Libraries

| File Format | Library | Description |
|-------------|---------|-------------|
| **Images** (JPG, PNG) | PaddleOCR | AI-powered OCR for text recognition from images |
| **PDF** | PyMuPDF | Extract text from PDF documents |
| **Word** (DOCX) | python-docx | Extract text from Word documents |
| **PowerPoint** (PPTX) | python-pptx | Extract text from PowerPoint presentations |
| **Audio** (MP3, WAV) | Whisper | Speech-to-text transcription |
| **Video** (MP4, AVI, MOV) | MoviePy + Whisper | Extract audio from video then transcribe |

## Installation

1. Create a Python virtual environment:
```bash
cd backend
python -m venv ocr_env
source ocr_env/bin/activate  # On Windows: ocr_env\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements-ocr.txt
```

## Running the API

```bash
python ocr_test_api.py
```

The API will be available at: http://localhost:8000

## API Endpoints

### GET /
Returns API information and library availability status.

**Response:**
```json
{
  "message": "OCR Test API",
  "supported_formats": ["pdf", "docx", "pptx", "mp3", "wav", "mp4", "avi", "mov"],
  "libraries": {
    "paddleocr": true,
    "whisper": true,
    "pymupdf": true,
    "python-pptx": true,
    "python-docx": true,
    "moviepy": true
  }
}
```

### POST /ocr/test
Upload a file and extract text using appropriate OCR method.

**Parameters:**
- `file`: File to process (multipart/form-data)

**Supported formats:** pdf, docx, pptx, mp3, wav, mp4, avi, mov, jpg, jpeg, png

**Response:**
```json
{
  "success": true,
  "file_type": "pdf",
  "extracted_text": "Extracted text content...",
  "confidence": 1.0,
  "processing_time": 2.34,
  "error_message": ""
}
```

### GET /health
Health check endpoint showing library availability.

## Testing Examples

### Using curl:

```bash
# Test PDF file
curl -X POST "http://localhost:8000/ocr/test" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@sample.pdf"

# Test image file
curl -X POST "http://localhost:8000/ocr/test" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@image.jpg"

# Test audio file
curl -X POST "http://localhost:8000/ocr/test" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@audio.mp3"
```

### Using Python requests:

```python
import requests

# Test a file
files = {'file': open('document.pdf', 'rb')}
response = requests.post('http://localhost:8000/ocr/test', files=files)
print(response.json())
```

## Library Installation Notes

### PaddleOCR (Image OCR)
```bash
pip install paddlepaddle paddleocr
```
- Requires significant disk space (~2GB)
- First run will download models automatically

### Whisper (Audio/Video)
```bash
pip install openai-whisper
```
- Requires FFmpeg for audio processing
- Models: tiny, base, small, medium, large (larger = more accurate but slower)

### PyMuPDF (PDF)
```bash
pip install PyMuPDF
```
- Fast and reliable PDF text extraction

### python-docx (Word)
```bash
pip install python-docx
```
- Extracts text from .docx files

### python-pptx (PowerPoint)
```bash
pip install python-pptx
```
- Extracts text from .pptx files

### MoviePy (Video)
```bash
pip install moviepy
```
- Requires FFmpeg
- Used to extract audio from video files

## Performance Notes

- **PaddleOCR**: Good for printed text, slower for handwritten
- **Whisper**: Excellent for clear audio, supports multiple languages
- **PyMuPDF**: Very fast for text-based PDFs
- **Document libraries**: Near-instantaneous for text extraction
- **Video processing**: Requires audio extraction first, then transcription

## Error Handling

The API returns structured error responses:
```json
{
  "success": false,
  "file_type": "pdf",
  "extracted_text": "",
  "confidence": 0.0,
  "processing_time": 0.0,
  "error_message": "Detailed error description"
}
```

## Development

To run in development mode with auto-reload:
```bash
uvicorn ocr_test_api:app --reload --host 0.0.0.0 --port 8000
```

## Integration with Document Library

This OCR API can be integrated into the document management system to:

1. Automatically extract text from uploaded documents
2. Enable full-text search capabilities
3. Generate AI summaries and topic suggestions
4. Support multiple document formats in the library

## Troubleshooting

### Common Issues:

1. **"Library not available"**: Install missing dependencies from requirements-ocr.txt
2. **Large files**: API processes files in memory, consider file size limits
3. **Video processing slow**: Video files require audio extraction + transcription
4. **Memory usage**: Large models (Whisper large) require significant RAM

### Model Downloads:

- PaddleOCR models download automatically on first use
- Whisper models download based on model size selected
- Ensure stable internet connection for initial setup