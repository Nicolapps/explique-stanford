import SrcMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import clsx from "clsx";

export default function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <SrcMarkdown
      className={clsx("prose", className)}
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {text}
    </SrcMarkdown>
  );
}
