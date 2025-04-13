// Based on https://github.com/Balastrong/shadcn-autocomplete-demo/blob/main/src/components/autocomplete.tsx
// by Leonardo Montini / Balastrong : https://github.com/Balastrong

import {cn} from "@/lib/utils";
import {Command as CommandPrimitive} from "cmdk";
import {useMemo, useState} from "react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "./command";
import {Input} from "./input";
import {Popover, PopoverContent} from "./popover";
import {Skeleton} from "./skeleton";
import {PopoverAnchor} from "@radix-ui/react-popover";

type Props<T extends string> = {
    selectedValue: T,
    onSelectedValueChange: (value: T) => void,
    searchValue: string,
    onSearchValueChange: (value: string) => void,
    items: {
        value: T;
        label: string;
        common_name?: string;
        photo_url?: string;
    }[],
    isLoading?: boolean,
    emptyMessage?: string,
    placeholder?: string,
    name?: string
};

export function Autocomplete<T extends string>({
                                                   selectedValue,
                                                   onSelectedValueChange,
                                                   searchValue,
                                                   onSearchValueChange,
                                                   items,
                                                   isLoading,
                                                   emptyMessage = "No items.",
                                                   placeholder = "Search...",

                                               }: Props<T>) {
    const [open, setOpen] = useState(false);

    const labels = useMemo(
        () =>
            items.reduce((acc, item) => {
                acc[item.value] = item.label;
                return acc;
            }, {} as Record<string, string>),
        [items]
    );

    const reset = () => {
        onSelectedValueChange("" as T);
        onSearchValueChange("");
    };

    const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (
            !e.relatedTarget?.hasAttribute("cmdk-list") &&
            labels[selectedValue] !== searchValue
        ) {
            reset();
        }
    };

    const onSelectItem = (inputValue: string) => {
        if (inputValue === selectedValue) {
            reset();
        } else {
            onSelectedValueChange(inputValue as T);
            onSearchValueChange(labels[inputValue] ?? "");
        }
        setOpen(false);
    };

    return (
        <div className={cn("flex items-center")}>
            <Popover open={open} onOpenChange={setOpen}>
                <Command shouldFilter={false}>
                    <PopoverAnchor asChild>
                        <CommandPrimitive.Input
                            asChild
                            value={searchValue}
                            onValueChange={onSearchValueChange}
                            onKeyDown={(e) => setOpen(e.key !== "Escape")}
                            onMouseDown={() => setOpen((open) => !!searchValue || !open)}
                            onFocus={() => setOpen(true)}
                            onBlur={onInputBlur}
                        >
                            <Input placeholder={placeholder}/>
                        </CommandPrimitive.Input>
                    </PopoverAnchor>
                    {!open && <CommandList aria-hidden='true' className='hidden'/>}
                    <PopoverContent
                        asChild
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => {
                            if (
                                e.target instanceof Element &&
                                e.target.hasAttribute("cmdk-input")
                            ) {
                                e.preventDefault();
                            }
                        }}
                        className='w-[--radix-popover-trigger-width] p-0 bg-emerald-500'
                    >
                        <CommandList>
                            {isLoading && (
                                <CommandPrimitive.Loading>
                                    <div className='p-1'>
                                        <Skeleton className='h-6 w-full'/>
                                    </div>
                                </CommandPrimitive.Loading>
                            )}
                            {items.length > 0 && !isLoading ? (
                                <CommandGroup>
                                    {items.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onSelect={onSelectItem}
                                            className='bg-white m-y-2'
                                        >
                                            {/*<Check*/}
                                            {/*    className={cn(*/}
                                            {/*        "mr-2 h-4 w-4",*/}
                                            {/*        selectedValue === option.value*/}
                                            {/*            ? "opacity-100"*/}
                                            {/*            : "opacity-0"*/}
                                            {/*    )}*/}
                                            {/*/>*/}
                                            {option.photo_url &&
                                                <img
                                                    src={option.photo_url}
                                                    alt={option.label}
                                                    className='w-20 h-20 p-x-2 rounded-full'
                                                />}
                                            <div className='flex flex-col space-y-1'>
                                                <h4 className='block font-bold'>{option.common_name}</h4>
                                                <h5 className='block italic'>{option.label}</h5>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ) : null}
                            {!isLoading ? (
                                <CommandEmpty>{emptyMessage ?? "No items."}</CommandEmpty>
                            ) : null}
                        </CommandList>
                    </PopoverContent>
                </Command>
            </Popover>
        </div>
    );
}
