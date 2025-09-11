import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AITaskBreakdown, Task } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateTaskBreakdown(goal: string, teamMembers: string[] = []): Promise<AITaskBreakdown> {
    const teamMembersText = teamMembers.length > 0 
      ? `The team has the following roles: ${teamMembers.join(', ')}.` 
      : 'No specific team roles provided.';

    const prompt = `
Analyze the following project goal and create a comprehensive task breakdown: "${goal}"

${teamMembersText}

Please create milestones and break them down into detailed tasks. Return a valid JSON object with the following structure:

{
  "milestones": [
    {
      "title": "Milestone Title",
      "description": "Brief description of the milestone",
      "tasks": [
        {
          "title": "Task Title",
          "description": "Detailed description of what needs to be done",
          "estimate": "X days/hours",
          "suggestedRole": "frontend/backend/design/marketing/general"
        }
      ]
    }
  ]
}

Guidelines:
- Create 3-6 logical milestones
- Each milestone should have 3-8 tasks
- Estimates should be realistic (hours for small tasks, days for larger ones)
- Suggest appropriate roles based on the task type
- Tasks should be specific and actionable
- Consider dependencies and logical ordering

Return ONLY the JSON object, no additional text.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      console.error('Error generating task breakdown:', error);
      
      return {
        milestones: [
          {
            title: 'Project Planning',
            description: 'Initial project setup and planning phase',
            tasks: [
              {
                title: 'Define Requirements',
                description: 'Gather and document all project requirements',
                estimate: '2 days',
                suggestedRole: 'general'
              },
              {
                title: 'Create Project Timeline',
                description: 'Establish milestones and deadlines',
                estimate: '1 day',
                suggestedRole: 'general'
              }
            ]
          },
          {
            title: 'Development',
            description: 'Core development phase',
            tasks: [
              {
                title: 'Setup Development Environment',
                description: 'Configure tools and development environment',
                estimate: '1 day',
                suggestedRole: 'backend'
              },
              {
                title: 'Implement Core Features',
                description: 'Build main functionality',
                estimate: '5 days',
                suggestedRole: 'frontend'
              }
            ]
          }
        ]
      };
    }
  }

  async assignTasks(tasks: Task[], teamMembers: { name: string; role: string }[]): Promise<{ taskId: string; assignee: string; reason: string }[]> {
    const prompt = `
Given these tasks and team members, suggest the best assignment:

Tasks:
${JSON.stringify(tasks, null, 2)}

Team Members:
${JSON.stringify(teamMembers, null, 2)}

Return a JSON array with each task assigned to the most suitable team member based on their role and the task requirements. Consider workload balance.

Return format:
[
  {
    "taskId": "original task id",
    "assignee": "team member name",
    "reason": "brief explanation for assignment"
  }
]
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error assigning tasks:', error);
      return tasks.map((task, index) => ({
        taskId: task.taskId,
        assignee: teamMembers[index % teamMembers.length]?.name || teamMembers[0]?.name,
        reason: 'Auto-assigned due to AI service error'
      }));
    }
  }
}