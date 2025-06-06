import React, { useState } from 'react';
import axios from 'axios';

interface AiTaskRewriterProps {
  task: string;
}

const AiTaskRewriter: React.FC<AiTaskRewriterProps> = ({ task }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const rewriteTask = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await axios.post('/api/gpt-rewrite', {
        task,
      });
      setResult(response.data.result);
    } catch (err: any) {
      setError('Error rewriting task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-4 shadow-sm space-y-2 bg-white">
      <div className="text-sm text-gray-600">Original Task:</div>
      <div className="font-medium">{task}</div>
      <button
        onClick={rewriteTask}
        className="px-3 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? 'Thinking...' : 'Rewrite for Clarity'}
      </button>
      {result && (
        <div className="mt-2 text-green-700 whitespace-pre-wrap border-t pt-2">
          <strong>Clarity Version:</strong>
          <div>{result}</div>
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
};

export default AiTaskRewriter;
