import {
  BlockNoteEditor,
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  filterSuggestionItems,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  GridSuggestionMenuController,
  SuggestionMenuController,
  SuggestionMenuProps,
  useCreateBlockNote,
} from "@blocknote/react";

import { MotionGif } from "@/components/editor/MotionGif";
import CustomGifPicker from "@/components/editor/CustomGifPicker";
import { CgMenuMotion } from "react-icons/cg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdownmenu";
import { Button } from "@/components/ui/button";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    // Adds all default blocks.
    ...defaultBlockSpecs,
  },
  inlineContentSpecs: {
    // Adds all default inline content.
    ...defaultInlineContentSpecs,
    motionGif: MotionGif,
  },
});

async function fetchGifs(): Promise<{ url: string; id: string }[]> {
  try {
    const response = await fetch("/api/gifs");

    if (!response.ok) {
      throw new Error("Failed to load GIFs");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

const getMotionGifItems = async (editor: BlockNoteEditor) => {
  const gifs = await fetchGifs();

  return gifs.map((gif) => ({
    title: gif.url,
    id: gif.id,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "motionGif",
          props: {
            url: gif.url,
            textAlignment: "left",
            textColor: "",
          },
        },
        " ", // add a space after the mention
      ]);
    },
    icon: <img src={gif.url} alt="gif" />,
  }));
};

const insertMotionGif = (editor: BlockNoteEditor) => ({
  title: "MotionGif",
  description: "GIFs with motion",
  onItemClick: () => {
    editor.openSuggestionMenu(">");
  },
  group: "Others",
  icon: <CgMenuMotion size={18} />,
});

// Custom component to replace the default Slash Menu.
function CustomSlashMenu(
  props: SuggestionMenuProps<DefaultReactSuggestionItem>,
) {
  return (
    <div className={"slash-menu flex flex-col"}>
      {props.items.map((item, index) => (
        <div
          className={`slash-menu-item ${
            props.selectedIndex === index ? " selected" : ""
          }`}
          onClick={() => {
            props.onItemClick?.(item);
          }}
          key={index}
        >
          {item.icon} {item.title} {item.subtext}
        </div>
      ))}
    </div>
  );
}

const getCustomSlashMenuItems = (
  editor: BlockNoteEditor,
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertMotionGif(editor),
];

export function Editor() {
  const editor = useCreateBlockNote({
    schema,
    initialContent: [
      {
        type: "paragraph",
        content: "Welcome to this demo!",
      },
      {
        type: "paragraph",
        content:
          "Press the '/' key to insert a block (headings, paragraphs, lists)",
      },
      {
        type: "paragraph",
        content:
          "Press the '>' key to open gif menu, start typing to filter" +
          " results",
      },
      {
        type: "paragraph",
      },
    ],
  });

  return (
    <BlockNoteView editor={editor} slashMenu={false} emojiPicker={true}>
      <SuggestionMenuController
        triggerCharacter={"/"}
        // Replaces the default Slash Menu items with our custom ones.
        getItems={async (query) =>
          filterSuggestionItems(getCustomSlashMenuItems(editor), query)
        }
        // suggestionMenuComponent={CustomSlashMenu}
      />
      <GridSuggestionMenuController
        triggerCharacter={">"}
        gridSuggestionMenuComponent={CustomGifPicker}
        getItems={async (query) => {
          const gifItems = await getMotionGifItems(editor);
          return filterSuggestionItems(gifItems, query);
        }}
        columns={8}
        minQueryLength={0}
      />
    </BlockNoteView>
  );
}

export default Editor;
