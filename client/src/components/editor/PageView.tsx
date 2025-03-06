import parse from "html-react-parser";
import { useEffect, useState } from "react";

async function parseHtmlFile(urlString: string) {
  try {
    const response = await fetch(urlString);
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const html = await response.text();
    console.log(html);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      return bodyMatch[1];
    } else {
      return "No body tag found";
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return null;
  }
}

export default function PageView({ urlString = "" }: { urlString: string }) {
  const [bodyContent, setBodyContent] = useState<string>("");

  useEffect(() => {
    parseHtmlFile(urlString).then((res) => {
      if (res) {
        console.log(res);
        setBodyContent(res);
      }
    });
  }, []);

  return (
    bodyContent && (
      <div>
        <h1>Extracted Body Content</h1>
        <div>{parse(bodyContent)}</div>
      </div>
    )
  );
}
