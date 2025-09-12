import React, { useState } from 'react';
import { Info, Users, Mail, CheckSquare } from 'lucide-react';

export const DemoInstructions: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors"
          title="View Demo Instructions"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🎯 Team Invitation Demo</h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckSquare className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 mb-2">✅ Real Team System Active!</h3>
                  <p className="text-sm text-green-800">
                    This demo uses a fully functional real team invitation system. Every account created is real and persistent.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                  <span className="text-indigo-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Create Invitation</h4>
                  <p className="text-sm text-gray-600">
                    Go to "Invite Members" tab and enter an email to create an invitation link
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                  <span className="text-indigo-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Share Link</h4>
                  <p className="text-sm text-gray-600">
                    Copy the generated invitation link and open it in a new browser tab/window
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                  <span className="text-indigo-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Accept Invitation</h4>
                  <p className="text-sm text-gray-600">
                    Fill in the name and role, then accept. This creates a real account!
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                  <span className="text-indigo-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">View Team</h4>
                  <p className="text-sm text-gray-600">
                    Both users can now see the real team members in the "Team" tab
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-2">💡 Demo Tips</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Use different email addresses to test multiple team members</li>
                    <li>• Open invitation links in incognito/private windows to simulate different users</li>
                    <li>• All accounts persist in browser storage - they're real!</li>
                    <li>• Team members can see each other with full details</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start">
                <Users className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-indigo-900 mb-2">🔒 Real Features</h3>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• ✅ Real user accounts with unique IDs</li>
                    <li>• ✅ Proper access control and permissions</li>
                    <li>• ✅ Team members see actual user data</li>
                    <li>• ✅ Invitation expiration and validation</li>
                    <li>• ✅ Account creation and management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};