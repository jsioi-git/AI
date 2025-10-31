import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { APPLICATIONS, OPERATIONS, DOMAINS, DEPARTMENTS } from './constants';
import Dropdown from './components/Dropdown';
import Button from './components/Button';

// Rule interface for structured data
interface Rule {
  ruleName: string;
  description: string;
  ruleType: 'Business' | 'Technical';
  codeSnippet?: string;
}

const App: React.FC = () => {
  const [page, setPage] = useState<'config' | 'results'>('config');
  const [application, setApplication] = useState('');
  const [operation, setOperation] = useState('');
  const [domain, setDomain] = useState('');
  const [department, setDepartment] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);

  const isFormIncomplete = !application || !operation || !domain || !department;

  const handleCreatePrompt = useCallback(() => {
    if (isFormIncomplete) {
      setFormError('Please select a value for all dropdowns to create a prompt.');
      return;
    }
    setFormError(null);
    let prompt = '';
    const commonContext = `for the critical data elements like First Name, LastName, Middle Name, and CustomerID for the ${domain} domain in the ${department} department, within the context of the ${application} application.`;
    const datasetContext = `Additionally, include the context of how these elements relate to a provided dataset.`;

    switch (operation) {
      case 'Business_Rules':
        prompt = `I want to create Business data quality rules ${commonContext} ${datasetContext}`;
        break;
      case 'Technical_Rules':
        prompt = `I want to create technical data quality rules (e.g., SQL queries, Python scripts) ${commonContext} ${datasetContext}`;
        break;
      case 'Estimations':
        prompt = `I want to get estimations (e.g., effort in hours, complexity) for implementing data quality rules ${commonContext}`;
        break;
      case 'Schema':
        prompt = `I want to generate a data schema definition (e.g., JSON Schema, SQL DDL) ${commonContext}`;
        break;
      default:
        prompt = `Generate data quality information regarding ${operation} ${commonContext} ${datasetContext}`;
    }
    setGeneratedPrompt(prompt);
    setPage('results');
    setRules([]);
    setApiError(null);
  }, [application, operation, domain, department, isFormIncomplete]);

  const handleGenerateRules = async () => {
    setIsLoading(true);
    setApiError(null);
    setRules([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: `Based on the following context: "${generatedPrompt}", generate a list of data quality rules.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ruleName: { type: Type.STRING },
                description: { type: Type.STRING },
                ruleType: { type: Type.STRING, enum: ['Business', 'Technical'] },
                codeSnippet: { type: Type.STRING, description: 'Required for Technical rules. Provide a SQL or Python code snippet.' }
              },
              required: ['ruleName', 'description', 'ruleType']
            }
          }
        }
      });

      const parsedRules = JSON.parse(response.text);
      setRules(parsedRules);

    } catch (error) {
      console.error("Error generating rules:", error);
      setApiError("Failed to generate rules. The model may have returned an unexpected format. Please try refining your prompt.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string, type: string) => {
    if(text) {
        navigator.clipboard.writeText(text);
        alert(`${type} copied to clipboard!`);
    }
  }

  const handleBack = () => {
    setPage('config');
    setFormError(null);
  };

  const renderConfigPage = () => (
    <>
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          Data Quality AI Suite
        </h1>
        <p className="text-slate-400 mt-2">
          Streamline and Improve data quality with us.
        </p>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Dropdown
            label="Application"
            value={application}
            onChange={(e) => setApplication(e.target.value)}
            options={APPLICATIONS}
            placeholder="Select an Application"
          />
          <Dropdown
            label="Operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            options={OPERATIONS}
            placeholder="Select an Operation"
          />
          <Dropdown
            label="Domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            options={DOMAINS}
            placeholder="Select a Domain"
          />
          <Dropdown
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={DEPARTMENTS}
            placeholder="Select a Department"
          />
        </div>
        
        {formError && <p className="text-red-400 text-center mb-4">{formError}</p>}

        <div className="flex items-center justify-center gap-4">
          <Button variant="secondary" disabled>
            Upload Metadata
          </Button>
          <Button onClick={handleCreatePrompt} disabled={isFormIncomplete}>
            Create Prompt
          </Button>
        </div>
      </main>
    </>
  );

  const renderResultsPage = () => (
    <>
       <header className="w-full">
         <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-6">
            <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Configuration
         </button>
        </header>

       <main className="w-full">
          <div className="mb-6">
              <label htmlFor="prompt-output" className="block text-sm font-medium text-slate-300 mb-2">
                Generated Prompt (you can refine it here)
              </label>
              <div className="relative">
                <textarea
                    id="prompt-output"
                    value={generatedPrompt}
                    onChange={(e) => setGeneratedPrompt(e.target.value)}
                    className="w-full h-32 bg-slate-900 text-slate-300 p-4 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                    placeholder="Your generated prompt will appear here..."
                />
                <button onClick={() => copyToClipboard(generatedPrompt, "Prompt")} className="absolute top-3 right-3 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors" title="Copy to clipboard">
                   <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                   </svg>
                </button>
              </div>
          </div>
          
          <div className="text-center mb-8">
            <Button onClick={handleGenerateRules} disabled={isLoading || !generatedPrompt}>
              {isLoading ? 'Generating...' : 'Create Data Quality Rules'}
            </Button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating rules, please wait...</span>
            </div>
          )}

          {apiError && <p className="text-red-400 text-center mb-4">{apiError}</p>}
          
          {rules.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center text-slate-200 mb-4">Generated Rules</h2>
              <div className="overflow-x-auto bg-slate-800 border border-slate-700 rounded-lg">
                <table className="w-full text-sm text-left text-slate-400">
                  <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Rule Name</th>
                      <th scope="col" className="px-6 py-3">Type</th>
                      <th scope="col" className="px-6 py-3">Description</th>
                      <th scope="col" className="px-6 py-3">Code Snippet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule, index) => (
                      <tr key={index} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <th scope="row" className="px-6 py-4 font-medium text-indigo-400 whitespace-nowrap">
                          {rule.ruleName}
                        </th>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${rule.ruleType === 'Technical' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {rule.ruleType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {rule.description}
                        </td>
                        <td className="px-6 py-4">
                          {rule.codeSnippet ? (
                            <div className="relative">
                              <pre className="bg-slate-900 text-slate-300 p-3 rounded-md text-xs overflow-x-auto">
                                <code>{rule.codeSnippet}</code>
                              </pre>
                              <button onClick={() => copyToClipboard(rule.codeSnippet, "Code")} className="absolute top-2 right-2 p-1 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors" title="Copy code">
                                <svg xmlns="http://www.w.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
       </main>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl shadow-2xl shadow-indigo-500/10">
        {page === 'config' ? renderConfigPage() : renderResultsPage()}
      </div>
    </div>
  );
};

export default App;
