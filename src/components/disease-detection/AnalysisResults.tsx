import { DetectionResult } from "@/types/DetectionResult";

interface AnalysisResultsProps {
  result: DetectionResult;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-kisan-green dark:text-kisan-gold">
        Detection Result
      </h2>
      <p>
        <span className="font-bold">Disease:</span> {result.disease_name}
      </p>
      <p>
        <span className="font-bold">Confidence:</span> {result.confidence}%
      </p>
      
      {/* Symptoms section */}
      <div>
        <span className="font-bold">Symptoms:</span>
        <ul>
          {result.symptoms && result.symptoms.map((symptom, index) => (
            <li key={index}>{symptom}</li>
          ))}
        </ul>
      </div>
      
      {/* Action plan replaces recommendations */}
      <div>
        <span className="font-bold">Action Plan:</span>
        <ul>
          {result.action_plan && result.action_plan.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      </div>
      
      {/* Treatments section */}
      {result.treatments && (
        <div>
          <span className="font-bold">Treatments:</span>
          <div className="ml-4">
            {result.treatments.organic && result.treatments.organic.length > 0 && (
              <div>
                <span className="font-semibold">Organic:</span>
                <ul>
                  {result.treatments.organic.map((treatment, index) => (
                    <li key={index}>{treatment}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.treatments.chemical && result.treatments.chemical.length > 0 && (
              <div>
                <span className="font-semibold">Chemical:</span>
                <ul>
                  {result.treatments.chemical.map((treatment, index) => (
                    <li key={index}>{treatment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      <p>
        <span className="font-bold">Disease Stage:</span> {result.disease_stage}
      </p>
      
      {/* Only display these fields if they exist */}
      {result.yield_impact && (
        <p>
          <span className="font-bold">Yield Impact:</span> {result.yield_impact}
        </p>
      )}
      
      {result.spread_risk && (
        <p>
          <span className="font-bold">Spread Risk:</span> {result.spread_risk}
        </p>
      )}
      
      {result.recovery_chance && (
        <p>
          <span className="font-bold">Recovery Chance:</span> {result.recovery_chance}
        </p>
      )}
    </div>
  );
};
