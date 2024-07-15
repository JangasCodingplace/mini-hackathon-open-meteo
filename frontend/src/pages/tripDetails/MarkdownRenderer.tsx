import React from "react";

import {
  Text,
  UnorderedList,
  OrderedList,
  ListItem,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
} from "@chakra-ui/react";

interface MarkdownComponent {
  kind: "block";
  rawContent: string;
  reactElement?: React.ReactElement;
}

interface MarkdownRendererProps {
  markdown: string;
}

const getMDBlockType = (block: string): string => {
  if (block.match(/^# /)) {
    return "title";
  } else if (block.startsWith("- ")) {
    return "enum";
  } else if (block.match(/^\d+\. /)) {
    return "orderedEnum";
  } else if (block.match(/^\|/)) {
    return "table";
  } else if (block.startsWith("> ")) {
    return "quote";
  } else {
    return "paragraph";
  }
};

interface ParsedTextElementProps {
  text: string;
}

const ParsedTextElement: React.FC<ParsedTextElementProps> = ({ text }) => {
  const renderText = (inputText: string) => {
    return inputText.split(/(\*\*.*?\*\*|__.+?__)/g).map((boldPart, index) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
        return <b key={"b" + index}>{renderItalic(boldPart.slice(2, -2))}</b>;
      } else if (boldPart.startsWith("__") && boldPart.endsWith("__")) {
        return <b key={"b" + index}>{renderItalic(boldPart.slice(2, -2))}</b>;
      } else {
        return renderItalic(boldPart);
      }
    });
  };

  const renderItalic = (text: string) => {
    return text.split(/(\*.*?\*|_.*?_)/g).map((italicPart, index) => {
      if (
        (italicPart.startsWith("*") && italicPart.endsWith("*")) ||
        (italicPart.startsWith("_") && italicPart.endsWith("_"))
      ) {
        return <i key={"i" + index}>{italicPart.slice(1, -1)}</i>;
      }
      return italicPart;
    });
  };

  return <>{renderText(text)}</>;
};

const ParsedTitleElement: React.FC<ParsedTextElementProps> = ({ text }) => {
  const level = text.match(/^#*/)?.[0].length;
  if (level === undefined) return <>{text}</>;
  else if (level === 1)
    return (
      <Text fontSize="3xl">
        <ParsedTextElement text={text.slice(1)} />
      </Text>
    );
  else if (level === 2)
    return (
      <Text fontSize="2xl">
        <ParsedTextElement text={text.slice(2)} />
      </Text>
    );
  else if (level === 3)
    return (
      <Text fontSize="xl">
        <ParsedTextElement text={text.slice(3)} />
      </Text>
    );
  return (
    <Text>
      <b>
        <ParsedTextElement text={text.replace("#", "")} />
      </b>
    </Text>
  );
};

interface ListItemObj {
  content: string;
  childs: ListItemObj[];
}

const ParsedEnumElement: React.FC<ParsedTextElementProps> = ({ text }) => {
  const lines = text.split("\n");
  const result: ListItemObj[] = [];
  const stack: ListItemObj[] = [];
  let currentList: ListItemObj[] = result;

  lines.forEach((line) => {
    const level = (line.match(/^\s*/)?.[0]?.length || 0) / 2;

    const listItem: ListItemObj = {
      content: line.trim().replace(/^- /, ""),
      childs: [],
    };

    if (stack.length > level) {
      stack.splice(level);
      currentList = stack.length > 0 ? stack[stack.length - 1].childs : result;
    }

    if (level === stack.length) {
      if (stack.length > 0) {
        stack[stack.length - 1].childs.push(listItem);
      } else {
        result.push(listItem);
      }
      stack.push(listItem);
    } else if (level > stack.length) {
      if (stack.length > 0) {
        stack[stack.length - 1].childs.push(listItem);
      }
      stack.push(listItem);
    } else {
      currentList.push(listItem);
      stack.pop();
    }
  });

  return (
    <UnorderedList>
      {currentList.map((item, index) => {
        return (
          <ListItem key={index}>
            <ParsedTextElement text={item.content} />
            {item.childs.length > 0 ? (
              <ParsedEnumElement
                text={item.childs
                  .map((child) => `- ${child.content}`)
                  .join("\n")}
              />
            ) : (
              <></>
            )}
          </ListItem>
        );
      })}
    </UnorderedList>
  );
};

const ParsedOrderedEnumElement: React.FC<ParsedTextElementProps> = ({
  text,
}) => {
  return (
    <OrderedList>
      {text.split("\n").map((item, index) => {
        const number = item.match(/^\d+/)?.[0];
        const sliceNumber = number?.length ?? 0;
        return (
          <ListItem key={index}>
            <ParsedTextElement text={item.slice(sliceNumber + 1)} />
          </ListItem>
        );
      })}
    </OrderedList>
  );
};

const ParsedQuoteElement: React.FC<ParsedTextElementProps> = ({ text }) => {
  return (
    <Text>
      {text.split("> ").map((row, index) => (
        <Text as="i" color="gray.500" key={index}>
          {row}
          <br />
        </Text>
      ))}
    </Text>
  );
};

const ParsedTableElement: React.FC<ParsedTextElementProps> = ({ text }) => {
  const rows = text.split("\n").map((row) =>
    row
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim()),
  );
  const headerBodySplitterIndex = rows.findIndex((row) =>
    row.every((cell) => /^-+$/.test(cell.trim())),
  );

  return (
    <TableContainer overflowX="hidden">
      <Table variant="striped">
        {headerBodySplitterIndex > -1 ? (
          <Thead>
            <Tr>
              {rows[0].map((cell, index) => (
                <Th key={index}>
                  <ParsedTextElement text={cell} />
                </Th>
              ))}
            </Tr>
          </Thead>
        ) : (
          <></>
        )}
        {rows
          .filter((_, index) => index > headerBodySplitterIndex)
          .map((row, index) => {
            return (
              <Tbody key={index}>
                <Tr
                  whiteSpace="normal"
                  wordBreak="break-word"
                  verticalAlign="top"
                >
                  {row.map((cell, index) => (
                    <Th key={index}>
                      <ParsedTextElement text={cell} />
                    </Th>
                  ))}
                </Tr>
              </Tbody>
            );
          })}
      </Table>
    </TableContainer>
  );
};

const getBlocks = (markdown: string): MarkdownComponent[] => {
  return markdown.split("\n\n").map((block) => {
    const mdBlockType = getMDBlockType(block);

    switch (mdBlockType) {
      case "paragraph":
        return {
          kind: "block",
          rawContent: block,
          reactElement: <ParsedTextElement text={block} />,
        };
      case "title":
        return {
          kind: "block",
          rawContent: block,
          reactElement: <ParsedTitleElement text={block} />,
        };
      case "enum":
        return {
          kind: "block",
          rawContent: block,
          reactElement: <ParsedEnumElement text={block} />,
        };
      case "orderedEnum":
        return {
          kind: "block",
          rawContent: block,
          reactElement: <ParsedOrderedEnumElement text={block} />,
        };
      case "quote":
        return {
          kind: "block",
          rawContent: block,
          reactElement: <ParsedQuoteElement text={block} />,
        };
      case "table":
        return {
          kind: "block",
          rawContent: block,
          reactElement: <ParsedTableElement text={block} />,
        };
      default:
        return {
          kind: "block",
          rawContent: block,
          reactElement: <Text>{block}</Text>,
        };
    }
  });
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown }) => {
  const blocks = getBlocks(markdown);
  return (
    <div>
      {blocks.map((block, index) => (
        <span key={index}>{block.reactElement}</span>
      ))}
    </div>
  );
};

export default MarkdownRenderer;
