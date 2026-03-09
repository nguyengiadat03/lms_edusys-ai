const axios = require('axios');

console.log('🔬 TESTING OCR + GEMINI INTEGRATION FOR ALL FILE TYPES');
console.log('=======================================================');

// Simulate OCR output for different file types
const testCases = [
  {
    fileType: 'pdf',
    fileName: 'sample_english_lesson.pdf',
    ocrText: `English Grammar Lesson: Present Simple Tense

The present simple tense is used to talk about habits, routines, and general truths.

Formation:
- Positive: Subject + base verb (+ s/es for he/she/it)
- Negative: Subject + do/does + not + base verb
- Question: Do/Does + subject + base verb?

Examples:
I eat breakfast at 7 AM every day.
She does not like coffee.
Do you play tennis on weekends?

Common uses:
- Daily routines: I wake up at 6 AM.
- Facts: Water boils at 100 degrees Celsius.
- Habits: He smokes cigarettes.

Practice exercises:
1. Complete the sentences with the correct form.
2. Write 5 sentences about your daily routine.
3. Ask questions to your partner about their habits.

Remember: Add 's' or 'es' to the verb when the subject is he/she/it.
I = You = We = They → base verb
He = She = It → base verb + s/es`
  },
  {
    fileType: 'docx',
    fileName: 'vocabulary_lesson.docx',
    ocrText: `Vocabulary: Family Members

Family vocabulary is essential for everyday conversations in English.

Immediate family:
- Mother/Mom/Mum
- Father/Dad
- Brother
- Sister
- Son
- Daughter

Extended family:
- Grandmother/Grandma
- Grandfather/Grandpa
- Aunt
- Uncle
- Cousin
- Niece
- Nephew

Family relationships:
My mother's sister is my aunt.
My father's brother is my uncle.
My aunt's daughter is my cousin.

Common expressions:
- Meet my family
- Family gathering
- Family tree
- Close-knit family
- Nuclear family

Practice:
Write sentences about your family members.
Describe your family relationships.
Role-play introducing family members.`
  },
  {
    fileType: 'pptx',
    fileName: 'presentation_skills.pptx',
    ocrText: `Presentation Skills Workshop

Effective presentation techniques for English learners.

Structure your presentation:
1. Introduction - Greet audience, state topic
2. Main body - Present key points, use visuals
3. Conclusion - Summarize main points, Q&A

Body language tips:
- Stand confidently
- Make eye contact
- Use hand gestures appropriately
- Smile and be enthusiastic

Voice techniques:
- Speak clearly and slowly
- Vary your pitch and volume
- Pause for emphasis
- Avoid filler words (um, ah, like)

Visual aids:
- Use PowerPoint slides
- Include relevant images
- Keep text minimal
- Use bullet points

Practice activities:
- Prepare a 2-minute presentation
- Record yourself and self-evaluate
- Present to classmates and get feedback

Remember: Practice makes perfect!`
  },
  {
    fileType: 'audio',
    fileName: 'listening_practice.mp3',
    ocrText: `Good morning, everyone. Welcome to our English listening practice session. Today we will practice listening to a conversation about daily routines.

Listen carefully to the dialogue between Anna and John.

Anna: Hi John, what time do you usually wake up in the morning?
John: I wake up at 6 o'clock every day. What about you?
Anna: I wake up at 7 AM on weekdays, but I sleep until 9 AM on weekends.
John: That sounds nice. Do you have breakfast before going to work?
Anna: Yes, I always eat cereal and drink coffee. How about you?
John: I usually have toast and tea. I don't drink coffee because it makes me nervous.

Anna: Do you exercise in the morning?
John: Yes, I go jogging for 30 minutes. It helps me start the day with energy.
Anna: That's great. I sometimes go to the gym after work.

Now, let's practice the pronunciation of these time expressions:
- Wake up
- Go to bed
- Have breakfast
- Brush teeth
- Take a shower

Remember to listen carefully and repeat after the speaker.`
  },
  {
    fileType: 'image',
    fileName: 'grammar_diagram.jpg',
    ocrText: `Present Continuous Tense

Subject + am/is/are + verb-ing

Examples:
I am studying English now.
She is reading a book.
They are playing soccer.

Questions:
Am I speaking clearly?
Is he working today?
Are you listening?

Negative:
I am not eating dinner.
She is not sleeping.
We are not studying.

Usage:
- Actions happening now
- Temporary situations
- Future arrangements

Practice:
Write 5 sentences using present continuous.
Describe what people are doing in the picture.
Ask your partner questions.`
  },
  {
    fileType: 'video',
    fileName: 'restaurant_conversation.mp4',
    ocrText: `Restaurant Conversation Practice

[Video shows two people at a restaurant table]

Customer: Hello, can I see the menu please?
Waiter: Certainly. Here you are. Would you like to order drinks first?

Customer: Yes, I'd like a glass of water and a coffee, please.
Waiter: Water and coffee. Would you like milk with your coffee?

Customer: No, just black coffee is fine. What are your specials today?
Waiter: Today's special is grilled salmon with vegetables. It's very popular.

Customer: That sounds good. I'll have the salmon. What sides do you recommend?
Waiter: The roasted potatoes go very well with the salmon.

Customer: Okay, salmon with roasted potatoes. And can I have the salad instead of vegetables?
Waiter: Of course. So that's grilled salmon, roasted potatoes, and a side salad.

Customer: Perfect. Thank you.

[End of video]

Vocabulary focus:
- Menu
- Specials
- Recommend
- Sides
- Instead of

Cultural notes:
- In English-speaking countries, it's common to leave 15-20% tip
- "The bill/check please" means you want to pay
- It's polite to say "please" and "thank you" when ordering

Practice:
Role-play ordering food at a restaurant.
Create your own restaurant dialogue.
Practice pronunciation of food vocabulary.`
  }
];

// Current Gemini prompts (from the code)
function createSummaryPrompt(ocrText, fileName, fileType) {
  return `CREATE A SPECIFIC SUMMARY BASED ON THE OCR TEXT:

OCR TEXT: "${ocrText.substring(0, 2000)}"
File name: ${fileName}
File type: ${fileType}

INSTRUCTIONS:
1. Read the OCR text and identify what it actually talks about
2. Create a summary that describes the specific content found in the text
3. Mention the main characters, topics, or activities described
4. Keep it to 2-3 sentences maximum

EXAMPLE FOR FRIEND TEXT:
If OCR text mentions "My friend Anna is kind and intelligent. We help each other with homework. We play together and have fun."
Then create: "This document tells about the author's best friend named Anna, who is kind and intelligent. They often help each other with homework, play together, and always have happy moments with each other every day."

OUTPUT FORMAT:
"This document tells about [specific content from OCR text]. [2-3 sentences describing what the text actually says]."

Make the summary reflect the ACTUAL content in the OCR text!`;
}

function createSegmentPrompt(ocrText, fileName, fileType) {
  return `CREATE SPECIFIC CONTENT SECTIONS BASED ON THE OCR TEXT:

OCR TEXT: "${ocrText.substring(0, 2000)}"
File name: ${fileName}
File type: ${fileType}

INSTRUCTIONS:
1. Read the OCR text and identify the main characters/topics
2. Create 3-4 specific section names that describe the actual content
3. Each section name should be unique and based on what the text actually talks about
4. Don't use generic names like "Introduction" or "Main Content"

EXAMPLE FOR FRIEND TEXT:
If OCR text mentions "My friend Anna is kind and intelligent. We help each other with homework. We play together and have fun."
Then create sections like:
- "Introduction to Anna - best friend"
- "Anna's personality traits"
- "Shared activities between friends"

RETURN ONLY JSON:
{
  "segments": [
    "Specific section name 1",
    "Specific section name 2",
    "Specific section name 3"
  ]
}

Make section names specific to the actual content in the OCR text!`;
}

function createLevelPrompt(ocrText, fileName, fileType) {
  return `ANALYZE LEVEL BASED ON SPECIFIC CONTENT:

File name: ${fileName}
Content: "${ocrText.substring(0, 2000)}"

ANALYZE IN DETAIL:
1. Identify vocabulary: simple (A1) vs complex (C1)
2. Grammar: basic tenses (A1-A2) vs complex (B2-C1)
3. Sentence structure: simple (A1) vs complex (C1)
4. Topics: familiar (A1) vs specialized (C1)

Based on the analysis above, return only the level: A1, A2, B1, B2, C1, or C2
NO explanation, just return the level!`;
}

function createTopicPrompt(ocrText, fileName, fileType) {
  return `IDENTIFY THE MAIN TOPIC FROM THE ACTUAL CONTENT:

File name: ${fileName}
Content: "${ocrText.substring(0, 2000)}"
File type: ${fileType}

ANALYZE:
1. Read all content and identify the main topic
2. DO NOT use generic "Education"
3. Choose a specific topic from the list: Family, Travel, Business, Health, Food, Sports, Technology, Environment, History, Science, Art, Music, Literature, Grammar, Vocabulary, Conversation, Reading, Writing, Listening, Speaking

OR another topic if none from the list fit.

Return only the TOPIC NAME, no explanation!`;
}

// Expected correct outputs
const expectedOutputs = {
  pdf: {
    summary: "This document teaches English grammar focusing on the present simple tense. It explains formation, provides examples, and covers common uses like daily routines and habits. The lesson includes practice exercises for students to apply what they've learned.",
    segments: ["Present Simple Formation", "Examples and Usage", "Practice Exercises"],
    level: "A2",
    topic: "Grammar"
  },
  docx: {
    summary: "This document teaches vocabulary related to family members and relationships. It covers immediate and extended family terms, explains relationships, and provides common expressions and practice activities for learners.",
    segments: ["Family Vocabulary", "Family Relationships", "Practice Activities"],
    level: "A1",
    topic: "Vocabulary"
  },
  pptx: {
    summary: "This presentation teaches effective presentation skills for English learners. It covers presentation structure, body language tips, voice techniques, visual aids usage, and includes practice activities for developing presentation confidence.",
    segments: ["Presentation Structure", "Body Language Tips", "Voice Techniques", "Practice Activities"],
    level: "B1",
    topic: "Speaking"
  },
  audio: {
    summary: "This audio lesson practices listening skills through a conversation about daily routines. It features a dialogue between Anna and John discussing wake-up times, breakfast habits, and morning exercises, with pronunciation practice for time expressions.",
    segments: ["Listening Dialogue", "Daily Routines Discussion", "Pronunciation Practice"],
    level: "A2",
    topic: "Listening"
  },
  image: {
    summary: "This image shows grammar rules for the present continuous tense. It displays the formation structure, provides examples, shows question and negative forms, explains usage, and includes practice exercises for learners.",
    segments: ["Tense Formation", "Examples and Questions", "Usage and Practice"],
    level: "A2",
    topic: "Grammar"
  },
  video: {
    summary: "This video lesson demonstrates practical English conversation skills in a restaurant setting. It shows a dialogue between a customer and waiter ordering food, includes pronunciation practice for food vocabulary, and provides cultural tips about dining etiquette in English-speaking countries.",
    segments: ["Restaurant Dialogue", "Food Vocabulary Practice", "Ordering Sequence", "Cultural Dining Tips"],
    level: "B1",
    topic: "Speaking"
  }
};

// Test each case
testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. TESTING ${testCase.fileType.toUpperCase()}: ${testCase.fileName}`);
  console.log('='.repeat(80));

  console.log('\n📄 OCR EXTRACTED TEXT:');
  console.log(testCase.ocrText.substring(0, 300) + (testCase.ocrText.length > 300 ? '...' : ''));

  console.log('\n🤖 GEMINI SUMMARY PROMPT:');
  console.log(createSummaryPrompt(testCase.ocrText, testCase.fileName, testCase.fileType));

  console.log('\n🎯 EXPECTED SUMMARY:');
  console.log(expectedOutputs[testCase.fileType].summary);

  console.log('\n📊 GEMINI SEGMENT PROMPT:');
  console.log(createSegmentPrompt(testCase.ocrText, testCase.fileName, testCase.fileType));

  console.log('\n🎯 EXPECTED SEGMENTS:');
  console.log(JSON.stringify(expectedOutputs[testCase.fileType].segments, null, 2));

  console.log('\n📈 LEVEL ANALYSIS PROMPT:');
  console.log(createLevelPrompt(testCase.ocrText, testCase.fileName, testCase.fileType));

  console.log('\n🎯 EXPECTED LEVEL:');
  console.log(expectedOutputs[testCase.fileType].level);

  console.log('\n🏷️ TOPIC ANALYSIS PROMPT:');
  console.log(createTopicPrompt(testCase.ocrText, testCase.fileName, testCase.fileType));

  console.log('\n🎯 EXPECTED TOPIC:');
  console.log(expectedOutputs[testCase.fileType].topic);

  console.log('\n❌ POTENTIAL ISSUES WITH CURRENT PROMPTS:');
  console.log('1. Prompts are too generic and don\'t guide AI to extract specific educational content');
  console.log('2. No clear instruction to identify the actual subject matter (grammar, vocabulary, etc.)');
  console.log('3. Examples are too specific to "friend" content, may confuse AI for other topics');
  console.log('4. No validation that AI understands the educational context');
});

console.log('\n🔧 REQUIRED FIXES:');
console.log('='.repeat(80));

console.log('\n1. IMPROVE SUMMARY PROMPT:');
console.log('- Add specific instructions for educational content identification');
console.log('- Guide AI to recognize lesson types (grammar, vocabulary, speaking, etc.)');
console.log('- Include examples for different content types');

console.log('\n2. FIX SEGMENT PROMPT:');
console.log('- Remove confusing "friend" examples');
console.log('- Add examples for educational content sections');
console.log('- Guide AI to create logical learning progression');

console.log('\n3. ENHANCE LEVEL ANALYSIS:');
console.log('- Add specific criteria for each CEFR level');
console.log('- Include vocabulary complexity examples');
console.log('- Guide grammar structure analysis');

console.log('\n4. IMPROVE TOPIC DETECTION:');
console.log('- Prioritize educational topics over general ones');
console.log('- Add context about English learning materials');
console.log('- Include fallback logic for unrecognized content');

console.log('\n📝 NEXT STEPS:');
console.log('1. Update Gemini prompts with better examples and instructions');
console.log('2. Add content type detection before AI analysis');
console.log('3. Implement prompt validation and fallback logic');
console.log('4. Test with actual OCR output from real files');