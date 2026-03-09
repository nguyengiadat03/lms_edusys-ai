
export interface ContentGenerationRequest {
  type: 'assignment' | 'game';
  contentType: string;
  topic: string;
  level: string;
  skill?: string;
  language?: string;
  additionalContext?: string;
}

export interface GeneratedContent {
  title: string;
  description: string;
  content: Record<string, unknown>;
  objectives?: string[];
  rubric?: RubricData;
  tags?: string[];
  estimatedDuration?: number;
  level?: string;
  skill?: string;
  contentType?: string;
  language?: string;
  techRequirements?: string[];
}

export interface RubricData {
  criteria: RubricCriterion[];
  totalPoints?: number;
  gradingScale?: Record<string, string>;
}

export interface RubricCriterion {
  name: string;
  description?: string;
  weight?: number;
  levels: Record<string, string>;
}

export interface RubricGenerationRequest {
  assignmentType: string;
  objectives: string[];
  level: string;
  skill?: string;
}

export interface FeedbackSuggestionRequest {
  studentAnswer: string;
  assignmentContent: Record<string, unknown>;
  rubric: RubricData;
  level: string;
}

export interface FeedbackData {
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  grade: string;
}

export interface AssignmentIdea {
  title: string;
  type: string;
  description: string;
  objectives: string[];
}

export interface GameIdea {
  title: string;
  type: string;
  description: string;
  objectives: string[];
}

export interface DocumentAnalysisRequest {
  ocrText: string;
  fileName?: string;
  mimeType?: string;
}

export interface DocumentAnalysisResult {
  summary: string;
  segments: string[];
  level: string;
  topic: string;
  tags: Array<{ tag_label: string; confidence: number }>;
}

export interface DocumentAnalysisRequest {
  ocrText: string;
  fileName?: string;
  mimeType?: string;
}

export interface DocumentAnalysisResult {
  summary: string;
  segments: string[];
  level: string;
  topic: string;
  tags: Array<{ tag_label: string; confidence: number }>;
}

export class AIService {
  // Single Gemini call for document analysis - optimized for speed
  async analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResult> {
    const { ocrText, fileName, mimeType } = request;

    if (!ocrText || ocrText.trim().length < 10) {
      throw new Error('OCR text is required and must be at least 10 characters');
    }

    try {
      // Single comprehensive prompt for Gemini
      const analysisPrompt = `
ANALYZE THIS DOCUMENT AND PROVIDE A COMPLETE ANALYSIS IN THE FOLLOWING JSON FORMAT:

{
  "summary": "2-3 sentence summary of the document content",
  "segments": ["Segment 1 title", "Segment 2 title", "Segment 3 title", "Segment 4 title"],
  "level": "A1|A2|B1|B2|C1|C2",
  "topic": "single main topic word",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

DOCUMENT INFORMATION:
- Filename: ${fileName || 'Unknown'}
- Content Type: ${mimeType || 'Unknown'}
- Text Length: ${ocrText.length} characters

DOCUMENT CONTENT:
${ocrText.substring(0, 4000)}

REQUIREMENTS:
- Summary: 2-3 sentences describing the document's main content and purpose
- Segments: 3-4 main section titles that describe the document structure
- Level: English proficiency level (A1 beginner to C2 advanced)
- Topic: One primary topic word (e.g., "grammar", "vocabulary", "speaking", "hometown")
- Tags: 5-8 relevant tags including skill areas, content types, and difficulty levels

Return ONLY valid JSON, no additional text or explanations.
`;

      // Call Gemini AI once with the comprehensive prompt
      const response = await fetch('http://localhost:8000/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'document_analysis',
          content: analysisPrompt,
          ocr_text: ocrText.substring(0, 4000),
          file_name: fileName,
          mime_type: mimeType
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const geminiResponse = await response.json() as any;

      if (!geminiResponse.success || !geminiResponse.analysis) {
        throw new Error('Invalid response from Gemini AI');
      }

      // Parse the JSON response from Gemini
      let analysisResult;
      try {
        // Gemini might return the JSON as a string or already parsed
        if (typeof geminiResponse.analysis === 'string') {
          analysisResult = JSON.parse(geminiResponse.analysis);
        } else {
          analysisResult = geminiResponse.analysis;
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini response as JSON, using fallback analysis');
        analysisResult = this.createFallbackAnalysis(ocrText, fileName);
      }

      // Validate and enhance the analysis result
      const validatedResult = this.validateAndEnhanceAnalysis(analysisResult, ocrText);

      // Log AI usage for analytics
      await this.logAIUsage('document_analysis', {
        fileName,
        mimeType,
        textLength: ocrText.length,
        analysisResult: validatedResult
      });

      return validatedResult;

    } catch (error) {
      console.warn('Gemini AI analysis failed, using fallback:', error);
      const fallbackResult = this.createFallbackAnalysis(ocrText, fileName);

      // Log fallback usage
      await this.logAIUsage('document_analysis_fallback', {
        fileName,
        mimeType,
        textLength: ocrText.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return fallbackResult;
    }
  }

  // Fallback analysis when AI fails
  private createFallbackAnalysis(ocrText: string, fileName?: string): DocumentAnalysisResult {
    const text = ocrText.toLowerCase();

    // Basic topic detection
    let topic = 'education';
    if (text.includes('grammar')) topic = 'grammar';
    else if (text.includes('vocabulary') || text.includes('word')) topic = 'vocabulary';
    else if (text.includes('speaking') || text.includes('talk') || text.includes('conversation')) topic = 'speaking';
    else if (text.includes('listening') || text.includes('audio')) topic = 'listening';
    else if (text.includes('reading') || text.includes('comprehension')) topic = 'reading';
    else if (text.includes('writing') || text.includes('essay')) topic = 'writing';
    else if (text.includes('hometown') || text.includes('home town')) topic = 'hometown';

    // Basic level detection
    let level = 'B1';
    if (text.includes('beginner') || text.includes('a1') || text.includes('basic')) level = 'A1';
    else if (text.includes('elementary') || text.includes('a2')) level = 'A2';
    else if (text.includes('intermediate') || text.includes('b1')) level = 'B1';
    else if (text.includes('upper') || text.includes('b2')) level = 'B2';
    else if (text.includes('advanced') || text.includes('c1')) level = 'C1';
    else if (text.includes('proficiency') || text.includes('c2')) level = 'C2';

    // Generate tags
    const tags: Array<{ tag_label: string; confidence: number }> = [
      { tag_label: topic, confidence: 0.9 },
      { tag_label: `level-${level.toLowerCase()}`, confidence: 0.95 },
      { tag_label: 'education', confidence: 0.8 },
      { tag_label: 'english', confidence: 0.9 }
    ];

    // Add skill-based tags
    if (text.includes('grammar')) tags.push({ tag_label: 'grammar', confidence: 0.9 });
    if (text.includes('vocabulary')) tags.push({ tag_label: 'vocabulary', confidence: 0.9 });
    if (text.includes('speaking')) tags.push({ tag_label: 'speaking', confidence: 0.9 });
    if (text.includes('listening')) tags.push({ tag_label: 'listening', confidence: 0.9 });
    if (text.includes('reading')) tags.push({ tag_label: 'reading', confidence: 0.9 });
    if (text.includes('writing')) tags.push({ tag_label: 'writing', confidence: 0.9 });

    return {
      summary: `This document contains educational content about ${topic} for ${level} level English learners. It was extracted from ${fileName || 'the uploaded file'}.`,
      segments: [
        'Introduction',
        'Main Content',
        'Practice Activities',
        'Additional Resources'
      ],
      level,
      topic,
      tags
    };
  }

  // Validate and enhance analysis result
  private validateAndEnhanceAnalysis(analysis: any, ocrText: string): DocumentAnalysisResult {
    // Ensure all required fields exist with defaults
    const result: DocumentAnalysisResult = {
      summary: analysis.summary || 'Document analysis summary not available.',
      segments: Array.isArray(analysis.segments) && analysis.segments.length > 0
        ? analysis.segments.slice(0, 4)
        : ['Content Overview', 'Main Material', 'Practice Section'],
      level: this.validateLevel(analysis.level),
      topic: analysis.topic || 'education',
      tags: this.validateAndEnhanceTags(analysis.tags || [], ocrText)
    };

    return result;
  }

  // Validate English level
  private validateLevel(level: string): string {
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const upperLevel = level?.toUpperCase();
    return validLevels.includes(upperLevel) ? upperLevel : 'B1';
  }

  // Validate and enhance tags
  private validateAndEnhanceTags(tags: any[], ocrText: string): Array<{ tag_label: string; confidence: number }> {
    const validTags: Array<{ tag_label: string; confidence: number }> = [];

    // Process provided tags
    if (Array.isArray(tags)) {
      tags.forEach(tag => {
        if (typeof tag === 'string' && tag.trim()) {
          validTags.push({
            tag_label: tag.trim().toLowerCase(),
            confidence: 0.8
          });
        } else if (tag && typeof tag === 'object' && tag.tag_label) {
          validTags.push({
            tag_label: tag.tag_label.toLowerCase(),
            confidence: tag.confidence || 0.8
          });
        }
      });
    }

    // Ensure essential tags are present
    const essentialTags = ['education', 'english'];
    essentialTags.forEach(tag => {
      if (!validTags.some(t => t.tag_label === tag)) {
        validTags.push({ tag_label: tag, confidence: 0.9 });
      }
    });

    // Add level-based tag if not present
    const hasLevelTag = validTags.some(t => t.tag_label.startsWith('level-'));
    if (!hasLevelTag) {
      validTags.push({ tag_label: 'level-b1', confidence: 0.95 });
    }

    // Limit to 8 tags maximum
    return validTags.slice(0, 8);
  }

  // Mock AI service - in real implementation, this would call external AI APIs
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { type, contentType, topic, level, skill, language, additionalContext } = request;

    // Mock response - replace with actual AI API call
    const mockContent: GeneratedContent = {
      title: `${type === 'assignment' ? 'Assignment' : 'Game'}: ${topic}`,
      description: `A ${level} level ${type} about ${topic}`,
      content: {
        instructions: `Complete this ${type} on ${topic}`,
        items: []
      },
      objectives: [`Understand ${topic}`, `Apply ${skill || 'basic skills'}`],
      rubric: {
        criteria: [
          {
            name: 'Content Quality',
            description: 'Quality of the content provided',
            weight: 40,
            levels: {
              excellent: 'Outstanding content with deep understanding',
              good: 'Good content with clear understanding',
              fair: 'Basic content with some understanding',
              poor: 'Poor content with little understanding'
            }
          }
        ]
      },
      tags: [topic, level, skill].filter(Boolean) as string[],
      estimatedDuration: 30,
      level,
      skill,
      contentType,
      language,
      techRequirements: []
    };

    // Log AI usage for analytics
    await this.logAIUsage('content_generation', {
      type,
      contentType,
      topic,
      level,
      skill,
      language
    });

    return mockContent;
  }

  async generateRubric(request: RubricGenerationRequest): Promise<RubricData> {
    const { assignmentType, objectives, level, skill } = request;

    // Mock rubric generation
    const mockRubric: RubricData = {
      criteria: objectives.map((objective, index) => ({
        name: `Objective ${index + 1}`,
        description: objective,
        weight: Math.floor(100 / objectives.length),
        levels: {
          excellent: `Excellent demonstration of: ${objective}`,
          good: `Good demonstration of: ${objective}`,
          fair: `Fair demonstration of: ${objective}`,
          poor: `Poor demonstration of: ${objective}`
        }
      })),
      totalPoints: 100,
      gradingScale: {
        'A': '90-100',
        'B': '80-89',
        'C': '70-79',
        'D': '60-69',
        'F': '0-59'
      }
    };

    await this.logAIUsage('rubric_generation', request as unknown as Record<string, unknown>);

    return mockRubric;
  }

  async generateFeedback(request: FeedbackSuggestionRequest): Promise<FeedbackData> {
    const { studentAnswer, assignmentContent, rubric, level } = request;

    // Mock feedback generation
    const mockFeedback: FeedbackData = {
      overallFeedback: `Your answer demonstrates a ${level} level of understanding.`,
      strengths: [
        'Clear structure and organization',
        'Good use of relevant examples'
      ],
      improvements: [
        'Could provide more detailed explanations',
        'Consider adding more specific examples'
      ],
      suggestions: [
        'Review the key concepts and try to connect them more deeply',
        'Practice similar exercises to improve confidence'
      ],
      grade: 'B'
    };

    await this.logAIUsage('feedback_generation', {
      level,
      answerLength: studentAnswer.length
    });

    return mockFeedback;
  }

  async generateAssignmentIdeas(topic: string, level: string, count: number = 5): Promise<AssignmentIdea[]> {
    // Mock assignment ideas
    const ideas: AssignmentIdea[] = [];
    const types = ['quiz', 'essay', 'project', 'presentation', 'research'];

    for (let i = 0; i < count; i++) {
      ideas.push({
        title: `${topic} ${types[i % types.length]} - ${level} Level`,
        type: types[i % types.length],
        description: `A ${level} level ${types[i % types.length]} assignment focused on ${topic}`,
        objectives: [
          `Demonstrate understanding of ${topic}`,
          `Apply ${level} level skills in ${types[i % types.length]} format`
        ]
      });
    }

    await this.logAIUsage('assignment_ideas', { topic, level, count });

    return ideas;
  }

  async generateGameIdeas(topic: string, level: string, count: number = 5): Promise<GameIdea[]> {
    // Mock game ideas
    const ideas: GameIdea[] = [];
    const types = ['quiz', 'puzzle', 'adventure', 'simulation', 'strategy'];

    for (let i = 0; i < count; i++) {
      ideas.push({
        title: `${topic} ${types[i % types.length]} Game`,
        type: types[i % types.length],
        description: `An engaging ${level} level game about ${topic}`,
        objectives: [
          `Learn about ${topic} through interactive gameplay`,
          `Develop ${level} level skills in a fun environment`
        ]
      });
    }

    await this.logAIUsage('game_ideas', { topic, level, count });

    return ideas;
  }

  private async logAIUsage(action: string, metadata: Record<string, unknown>) {
    // Log AI usage for analytics - this could be stored in a separate table
    // For now, we'll just log to console or could store in existing audit log
    console.log(`AI Usage: ${action}`, metadata);
  }
}

export const aiService = new AIService();
