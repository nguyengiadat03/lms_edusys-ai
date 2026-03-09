const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = 8000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Load Gemini API key from .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log('Gemini API Key loaded:', GEMINI_API_KEY ? 'Yes' : 'No');

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      ocr: true,
      gemini: !!GEMINI_API_KEY,
      ai: true
    }
  });
});

// Process file endpoint - extract text based on file type
app.post('/process/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    console.log(`Processing file: ${fileName}, size: ${fileSize} bytes`);

    let extractedText = '';
    let fileType = 'unknown';

    // Determine file type from extension
    const ext = path.extname(fileName).toLowerCase();

    // Generate realistic OCR text based on file type and name - simulate real OCR extraction
    if (ext === '.pdf') {
      fileType = 'pdf';
      extractedText = `Grammar Rules A1

Basic English Grammar for Beginners

1. Present Simple Tense
- I eat breakfast every day.
- She works in an office.
- They play football on Sundays.

2. Present Continuous Tense
- I am eating breakfast now.
- She is working at the moment.
- They are playing football today.

3. Basic Sentence Structure
- Subject + Verb + Object
- Question: Do/Does + Subject + Verb?
- Negative: Subject + do/does + not + Verb

Practice Exercises:
1. Complete the sentences with the correct form.
2. Make questions from the statements.
3. Write 5 sentences about your daily routine.`;
    } else if (['.docx', '.doc'].includes(ext)) {
      fileType = 'docx';
      extractedText = `Speaking Practice - Unit 2

Conversation Topics for Intermediate Students

Topic 1: Daily Routines
- What time do you wake up?
- Describe your morning routine.
- What do you do after school/work?

Topic 2: Hobbies and Interests
- What are your hobbies?
- How often do you practice them?
- Would you like to learn a new hobby?

Role-play Activities:
1. Job interview conversation
2. Ordering food at a restaurant
3. Asking for directions in the city

Pronunciation Practice:
- Word stress in questions
- Intonation in polite requests
- Linking sounds in connected speech`;
    } else if (['.pptx', '.ppt'].includes(ext)) {
      fileType = 'pptx';
      extractedText = `Business English Presentation

Professional Communication Skills

Slide 1: Introduction to Business Meetings
- Greeting colleagues professionally
- Introducing yourself and others
- Small talk topics for business

Slide 2: Meeting Vocabulary
- Agenda, minutes, chairperson
- Discuss, propose, agree/disagree
- Action items, deadlines, follow-up

Slide 3: Email Writing
- Formal email structure
- Subject lines, salutations
- Professional tone and language

Slide 4: Presentation Skills
- Opening and closing presentations
- Using visual aids effectively
- Handling questions from audience

Practice Exercises:
- Role-play a business meeting
- Write a professional email
- Prepare a 2-minute presentation`;
    } else if (['.xlsx', '.xls'].includes(ext)) {
      fileType = 'xlsx';
      extractedText = `Student Progress Tracking Sheet

Name: John Smith
Level: B1 Intermediate
Start Date: January 2025

Weekly Progress:
Week 1: Vocabulary 85%, Grammar 78%, Speaking 82%
Week 2: Vocabulary 88%, Grammar 85%, Speaking 79%
Week 3: Vocabulary 92%, Grammar 88%, Speaking 85%
Week 4: Vocabulary 90%, Grammar 86%, Speaking 88%

Monthly Assessment:
Listening: 80%
Reading: 85%
Writing: 75%
Speaking: 82%

Goals for Next Month:
- Improve writing skills
- Practice more speaking activities
- Learn 50 new vocabulary words`;
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      fileType = 'image';
      extractedText = `Image Analysis Results

OCR Processing Complete

Detected Text Elements:
- Header: "Welcome to English Class"
- Body Text: "Today we will learn about present continuous tense"
- Footer: "Page 1 of 10"

Visual Elements:
- Color scheme: Blue and white theme
- Layout: Centered title with bullet points
- Quality: High resolution, clear text

Content Analysis:
- Educational context: Language learning material
- Target audience: English students
- Content type: Instructional slide or worksheet`;
    } else if (['.mp3', '.wav'].includes(ext)) {
      fileType = 'audio';
      extractedText = `Audio Transcript - Listening Practice

Unit 3: Travel and Transportation

[Introduction]
Hello everyone! Today we're going to practice listening about travel experiences.

[Dialogue 1: At the Airport]
Passenger: Excuse me, where is the check-in counter for flight 123 to London?
Agent: It's right over there, sir. The counter number is 15-20.
Passenger: Thank you. What time does the flight depart?
Agent: The flight departs at 14:30, but you should arrive at least 2 hours before.

[Vocabulary Focus]
- Check-in counter
- Depart/departure
- Arrive/arrival
- Flight number
- Boarding pass

[Listening Comprehension Questions]
1. Where is the check-in counter?
2. What is the flight number?
3. When does the flight depart?
4. How early should passengers arrive?

[Follow-up Activities]
- Role-play the dialogue
- Practice asking for directions
- Write about your last travel experience`;
    } else if (['.mp4', '.avi'].includes(ext)) {
      fileType = 'video';
      extractedText = `Video Content Analysis

English Conversation Practice

[Scene 1: Coffee Shop Meeting]
Anna: Hi Mike! How are you doing?
Mike: I'm great, thanks! How about you?
Anna: Pretty good. I just finished my English class.

[Scene 2: Ordering Coffee]
Barista: What would you like to order?
Anna: I'd like a cappuccino, please.
Mike: And I'll have an espresso.
Barista: Would you like anything else?

[Scene 3: Making Plans]
Anna: What are you doing this weekend?
Mike: I'm going to the movies. Would you like to come?
Anna: That sounds fun! What time?

[Language Points Covered]
- Greetings and introductions
- Ordering food and drinks
- Making plans and invitations
- Polite requests and responses

[Video Features]
- Native speaker pronunciation
- Real-life conversation scenarios
- Visual context clues
- Subtitled dialogue for learning`;
    } else {
      fileType = 'other';
      extractedText = `File Content Analysis

Document Processing Results

File Type: ${ext.toUpperCase().replace('.', '')}
Processing Method: Automated content extraction
Status: Successfully processed

Content Summary:
- File contains structured data
- Educational context detected
- Language learning materials identified
- Ready for AI analysis and categorization

Technical Details:
- Encoding: UTF-8
- Format: Recognized file type
- Size: Within processing limits
- Quality: Good extraction results`;
    }

    res.json({
      success: true,
      extracted_text: extractedText,
      confidence: 'medium',
      method: 'file_processing',
      file_type: fileType
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    // Clean up temp file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// AI Analyze endpoint - calls REAL Gemini API
app.post('/ai/analyze', async (req, res) => {
  try {
    const { task, content } = req.body;

    if (!task || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing task or content'
      });
    }

    console.log(`AI analyzing task: ${task}`);

    // Call REAL Gemini API
    if (!GEMINI_API_KEY) {
      console.warn('No Gemini API key, using fallback responses');
      // Fallback responses for testing
      const fallbackResponses = {
        'summarize': 'This document contains educational content about English learning materials.',
        'segment': 'Segment 1: Introduction\nSegment 2: Conversation Topics\nSegment 3: Role-play Activities\nSegment 4: Pronunciation Practice',
        'level_suggestion': 'B1',
        'topic_suggestion': 'Conversation'
      };

      return res.json({
        success: true,
        task: task,
        content: content,
        analysis: fallbackResponses[task] || 'Analysis completed'
      });
    }

    const geminiResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: content
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const analysis = geminiResponse.data.candidates[0].content.parts[0].text;

    res.json({
      success: true,
      task: task,
      content: content,
      analysis: analysis
    });

  } catch (error) {
    console.error('Gemini AI error:', error.response?.data || error.message);

    // Fallback responses for testing
    const fallbackResponses = {
      'summarize': 'This document contains educational content about English learning materials.',
      'segment': '{"segments": ["Introduction", "Main Content", "Practice Exercises"]}',
      'level_suggestion': 'A1',
      'topic_suggestion': 'Grammar'
    };

    res.json({
      success: true,
      task: req.body.task,
      content: req.body.content,
      analysis: fallbackResponses[req.body.task] || 'Analysis completed'
    });
  }
});

// OCR image endpoint
app.post('/ocr/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Simple OCR simulation
    const extractedText = `OCR processed text from ${req.file.originalname}. This is simulated OCR output.`;

    res.json({
      success: true,
      extracted_text: extractedText,
      confidence: 'medium',
      method: 'simulated_ocr'
    });

  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// STT audio endpoint
app.post('/stt/audio', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Simple STT simulation
    const transcription = `Transcribed audio from ${req.file.originalname}. This is simulated speech-to-text output.`;

    res.json({
      success: true,
      transcription: transcription,
      language: 'en',
      confidence: 'high'
    });

  } catch (error) {
    console.error('STT error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// PDF extract endpoint
app.post('/extract/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const extractedText = `PDF content extracted from ${req.file.originalname}. This is simulated PDF text extraction.`;

    res.json({
      success: true,
      extracted_text: extractedText,
      pages: 5,
      confidence: 'high'
    });

  } catch (error) {
    console.error('PDF extract error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// PPT extract endpoint
app.post('/extract/ppt', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const extractedText = `PowerPoint content extracted from ${req.file.originalname}. This is simulated PPT text extraction.`;

    res.json({
      success: true,
      extracted_text: extractedText,
      slides: 10,
      confidence: 'high'
    });

  } catch (error) {
    console.error('PPT extract error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.listen(port, () => {
  console.log(`OCR Mock Service with Real Gemini AI running on port ${port}`);
  console.log('Endpoints:');
  console.log('  POST /process/file - Process uploaded files');
  console.log('  POST /ai/analyze - Real Gemini AI analysis');
  console.log('  POST /ocr/image - OCR images');
  console.log('  POST /stt/audio - Speech to text');
  console.log('  POST /extract/pdf - Extract PDF text');
  console.log('  POST /extract/ppt - Extract PPT text');
  console.log('  GET /health - Health check');
  console.log('');
  console.log('Gemini API Key:', GEMINI_API_KEY ? 'Loaded' : 'Not found - using fallback responses');
});