import Markdown from "react-markdown";

export default function Quiz({
  question,
  answers,
  selectedAnswerIndex,
  onChange,
  disabled = false,
}: {
  question: string;
  answers: string[];
  selectedAnswerIndex: number | null;
  onChange?: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <header>
        <Markdown className={"prose text-2xl mb-2"}>{question}</Markdown>
      </header>

      <div>
        {answers.map((answer, index) => (
          <div key={index}>
            <label className="flex items-center py-1">
              <input
                type="radio"
                id={`answer-${index}`}
                name="answer"
                value={index}
                checked={selectedAnswerIndex === index}
                disabled={disabled}
                className="mr-2"
                onChange={(e) => onChange?.(parseInt(e.target.value, 10))}
              />

              <Markdown className="prose">{answer}</Markdown>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
