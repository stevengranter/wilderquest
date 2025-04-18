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
import { Badge } from "@/components/ui/badge";

import { MotionGif } from "@/components/editor/MotionGif";
import CustomGifPicker from "@/components/editor/CustomGifPicker";
import { CgMenuMotion } from "react-icons/cg";
import { useMemo } from "react";

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
          // @ts-expect-error TODO: fix error for type: motionGif
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
  const renderedItems = useMemo(() => {
    let currentGroup: string | undefined;
    const renderedItems = [];
    for (let i = 0; i < props.items.length; i++) {
      const item = props.items[i];
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        renderedItems.push(
            <div className={"bn-suggestion-menu-name"} key={currentGroup}>
            {currentGroup}
          </div>,
        );
      }
      renderedItems.push(
        <div
          className={"bn-suggestion-menu-item" + " flex"}
          id={`bn-suggestion-menu-item-${i}`}
          key={item.title}
          onClick={() => {
            props.onItemClick?.(item);
          }}
        >
          <div className="bg-primary-100 p-2 m-1 aspect-square">
            {item.icon}
          </div>
          <div className="flex content-center items-center w-full">
            <div className="flex flex-col">
              {item.title}
              <div className="text-xs">{item.subtext}</div>
            </div>
          </div>
          <div className="w-40  flex justify-end h-5">
            {item.badge && <Badge>{item.badge}</Badge>}
          </div>
        </div>,
      );
    }
    return renderedItems;
  }, [props.items]);

  return (
    <div className="flex flex-col w-100 bg-primary-300">{renderedItems}</div>
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
          // @ts-expect-error TODO: fix error for editor type mismatch
          filterSuggestionItems(getCustomSlashMenuItems(editor), query)
        }
        suggestionMenuComponent={CustomSlashMenu}
      />
      <GridSuggestionMenuController
        triggerCharacter={">"}
        // @ts-expect-error TODO: fix error for gridSuggestionMenuComponent
        gridSuggestionMenuComponent={CustomGifPicker}
        getItems={async (query) => {
          // @ts-expect-error TODO: fix error for editor type
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
