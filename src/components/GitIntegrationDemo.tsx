import { useState } from 'react';
import { handleGitPushWithFallback } from '../utils/gitWithGemini';
import { GitErrorAnalysisResult } from '../utils/services/geminiAIService';

export const GitIntegrationDemo = () => {
  const [isPushing, setIsPushing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    result?: GitErrorAnalysisResult;
  } | null>(null);

  const handlePush = async () => {
    setIsPushing(true);
    setResult(null);
    try {
      const pushResult = await handleGitPushWithFallback();
      setResult(pushResult);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Git Push with AI Fallback</h2>
      <button
        onClick={handlePush}
        disabled={isPushing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isPushing ? 'Pushing...' : 'Simulate Git Push'}
      </button>

      {result && (
        <div className="mt-4">
          {result.success ? (
            <div className="text-green-600">Push successful!</div>
          ) : (
            <div className="space-y-4">
              <div className="text-red-600 mb-2">
                <strong>Error:</strong> 
                <pre className="bg-red-50 dark:bg-red-900/20 p-2 rounded mt-1 text-sm overflow-x-auto">
                  {result.result?.error}
                </pre>
              </div>
              <div>
                <strong>Analysis:</strong> {result.result?.analysis}
              </div>
              <div>
                <strong>Confidence:</strong> {result.result?.confidence}%
              </div>
              <div>
                <strong>Suggested Commands:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {result.result?.suggestedCommands.map((cmd, i) => (
                    <li key={i} className="font-mono text-sm">
                      {cmd}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
