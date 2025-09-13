import React, { useState } from 'react';
import { Target, Sparkles, Users } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import type { AITaskBreakdown, User } from '../types';

interface GoalInputProps {
  onTaskBreakdown: (breakdown: AITaskBreakdown) => void;
  teamMembers?: User[];
}

export const GoalInput: React.FC<GoalInputProps> = ({ onTaskBreakdown, teamMembers = [] }) => {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geminiService = new GeminiService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const teamRoles = teamMembers.map(member => member.role);
      const breakdown = await geminiService.generateTaskBreakdown(goal, teamRoles);
      onTaskBreakdown(breakdown);
    } catch (err) {
      setError('Failed to generate task breakdown. Please try again.');
      console.error('Goal breakdown error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <Target className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Project Goal</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your project goal
          </label>
          <textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Build an e-commerce website in 2 months with user authentication, product catalog, shopping cart, and payment integration"
            required
          />
        </div>

        {teamMembers.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center mb-2">
              <Users className="h-4 w-4 text-gray-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">Team Members:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member) => (
                <span
                  key={member.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {member.name} ({member.role})
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !goal.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Task Breakdown
            </>
          )}
        </button>
      </form>
    </div>
  );
};