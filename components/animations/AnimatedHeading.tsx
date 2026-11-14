"use client";

import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motionEase } from "@/lib/motion";

type HeadingLevel = "h1" | "h2" | "h3";
const headingTags = { h1: motion.h1, h2: motion.h2, h3: motion.h3 };
const interactiveTags = new Set(["a", "button", "input", "select", "textarea"]);

type SplitState = { wordIndex: number };

function splitWords(
  node: ReactNode,
  path: string,
  state: SplitState,
  mobile: boolean,
): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    const parts = String(node).split(/(\s+)/);
    return parts.map((part, index) => {
      if (!part) return null;
      if (/^\s+$/.test(part)) return part;

      const wordIndex = state.wordIndex++;
      return (
        <span className="motion-word-mask" key={`${path}-word-${index}`}>
          <motion.span
            className="motion-heading-word"
            custom={wordIndex}
            variants={{
              hidden: {
                opacity: 0,
                y: mobile ? 28 : 48,
                filter: `blur(${mobile ? 4 : 8}px)`,
              },
              visible: (index: number) => ({
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  duration: mobile ? 0.65 : 0.85,
                  delay: index * (mobile ? 0.025 : 0.05),
                  ease: motionEase,
                },
              }),
            }}
          >
            {part}
          </motion.span>
        </span>
      );
    });
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const childPath = `${path}-array-${index}`;
      return (
        <Fragment key={childPath}>
          {splitWords(child, childPath, state, mobile)}
        </Fragment>
      );
    });
  }

  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    const key = `${path}-element`;

    if (element.type === "br" || (typeof element.type === "string" && interactiveTags.has(element.type))) {
      return cloneElement(element, { key });
    }

    return cloneElement(
      element,
      { key },
      splitWords(element.props.children, key, state, mobile),
    );
  }

  return node;
}

function textContent(node: ReactNode): string {
  let text = "";
  Children.forEach(node, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      text += child;
    } else if (isValidElement(child)) {
      if (child.type === "br") text += " ";
      else text += textContent((child as ReactElement<{ children?: ReactNode }>).props.children);
    }
  });
  return text.replace(/\s+/g, " ").trim();
}

export function AnimatedHeading({
  as = "h2",
  className,
  children,
}: {
  as?: HeadingLevel;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const animate = mounted && reduceMotion !== true;
  const Heading = headingTags[as];
  const visualChildren = splitWords(children, "heading", { wordIndex: 0 }, mobile);

  return (
    <Heading
      className={className ? `animated-heading ${className}` : "animated-heading"}
      aria-label={textContent(children)}
      initial={animate ? "hidden" : false}
      whileInView={animate ? "visible" : undefined}
      viewport={{ once: true, amount: 0.65 }}
    >
      {visualChildren}
    </Heading>
  );
}
