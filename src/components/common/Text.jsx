import { memo } from "react";

const Text = ({ children }) => {
  let text = children;

  if (!text) return text;

  if (typeof children === "string") {
    text = text.toLowerCase();
  } else {
    console.warn("Text component only accepts string as children");
  }

  return text;
};

export default memo(Text);
