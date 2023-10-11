// @ts-check
// vendors
"use client"
import React, { useEffect, useRef, forwardRef, useCallback } from "react";

// utils
import { replaceAllTextEmojis } from "./textInput/utils/emoji-utils";
import { handleCopy, totalCharacters } from "./textInput/utils/input-event-utils";

// hooks
import { useExpose } from "./textInput/hooks/use-expose";
import { useEmit } from "./textInput/hooks/use-emit";

// components
import TextInput from "./textInput/text-input";
import EmojiPickerWrapper from "./textInput/components/emoji-picker-wrapper";
import MentionWrapper from "./textInput/components/mention-wrapper";
import { useEventListeners } from "./textInput/hooks/use-event-listeners";
import { useSanitize } from "./textInput/hooks/use-sanitize";
import { usePollute } from "./textInput/hooks/user-pollute";

function InputEmoji(props, ref) {
    const {
        onChange,
        onEnter,
        shouldReturn,
        onResize,
        onClick,
        onFocus,
        onBlur,
        onKeyDown,
        theme,
        cleanOnEnter,
        placeholder,
        maxLength,
        keepOpened,
        inputClass,
        disableRecent,
        tabIndex,
        value,
        customEmojis,
        language,
        searchMention,
        buttonElement,
        buttonRef,
        // style
        borderRadius,
        borderColor,
        fontSize,
        fontFamily,
    } = props;

    /** @type {React.MutableRefObject<import('./text-input').Ref | null>} */
    const textInputRef = useRef(null);

    const { addEventListener, listeners } = useEventListeners();

    const { addSanitizeFn, sanitize, sanitizedTextRef } = useSanitize(props.shouldReturn);

    const { addPolluteFn, pollute } = usePollute();

    const updateHTML = useCallback(
        (nextValue = "") => {
            if (textInputRef.current === null) return;

            textInputRef.current.html = replaceAllTextEmojis(nextValue);
            sanitizedTextRef.current = nextValue;
        },
        [sanitizedTextRef]
    );

    const setValue = useCallback(
        /**
         *
         * @param {string} value
         */
        (value) => {
            updateHTML(value);
        },
        [updateHTML]
    );

    const emitChange = useEmit(textInputRef, onResize, onChange);

    useExpose({
        ref,
        setValue,
        textInputRef,
        emitChange
    });

    useEffect(() => {
        if (sanitizedTextRef.current !== value) {
            setValue(value);
        }
    }, [sanitizedTextRef, setValue, value]);

    // useEffect(() => {
    //   updateHTML();
    // }, [updateHTML]);

    useEffect(() => {
        /**
         * Handle keydown event
         * @param {React.KeyboardEvent} event
         * @return {boolean}
         */
        function handleKeydown(event) {
            if (
                typeof maxLength !== "undefined" &&
                event.key !== "Backspace" &&
                textInputRef.current !== null &&
                totalCharacters(textInputRef.current) >= maxLength
            ) {
                event.preventDefault();
            }

            if (event.key === "Enter" && textInputRef.current) {
                event.preventDefault();

                const text = sanitize(textInputRef.current.html);

                emitChange(sanitizedTextRef.current);

                if (
                    typeof onEnter === "function" &&
                    listeners.enter.currentListerners.length === 0
                ) {
                    onEnter(text);
                }

                if (cleanOnEnter && listeners.enter.currentListerners.length === 0) {
                    updateHTML("");
                }

                if (typeof onKeyDown === "function") {
                    onKeyDown(event.nativeEvent);
                }

                return false;
            }

            if (typeof onKeyDown === "function") {
                onKeyDown(event.nativeEvent);
            }

            return true;
        }

        const unsubscribe = addEventListener("keyDown", handleKeydown);

        return () => {
            unsubscribe();
        };
    }, [
        addEventListener,
        cleanOnEnter,
        emitChange,
        listeners.enter.currentListerners.length,
        maxLength,
        onEnter,
        onKeyDown,
        sanitize,
        sanitizedTextRef,
        updateHTML
    ]);

    useEffect(() => {
        /** */
        function handleFocus() {
            if (typeof onClick === "function") {
                onClick();
            }

            if (typeof onFocus === "function") {
                onFocus();
            }
        }

        const unsubscribe = addEventListener("focus", handleFocus);

        return () => {
            unsubscribe();
        };
    }, [addEventListener, onClick, onFocus]);

    useEffect(() => {
        /** */
        function handleBlur() {
            if (typeof onBlur === "function") {
                onBlur();
            }
        }

        const unsubscribe = addEventListener("blur", handleBlur);

        return () => {
            unsubscribe();
        };
    }, [addEventListener, onBlur]);

    /**
     *
     * @param {string} html
     */
    function handleTextInputChange(html) {
        sanitize(html);

        if (value !== sanitizedTextRef.current) {
            emitChange(sanitizedTextRef.current);
        }
    }

    /**
     *
     * @param {string} html
     */
    function appendContent(html) {
        //this is the magic
        if (
            typeof maxLength !== "undefined" &&
            textInputRef.current !== null &&
            totalCharacters(textInputRef.current) >= maxLength
        ) {
            return;
        }

        if (textInputRef.current !== null) {
            textInputRef.current.appendContent(html);
        }
    }

    /**
     * Handle past on input
     * @param {React.ClipboardEvent} event
     */
    function handlePaste(event) {
        event.preventDefault();
        let content;
        if (event.clipboardData) {
            content = event.clipboardData.getData("text/plain");
            content = pollute(content);
            document.execCommand("insertHTML", false, content);
        }
    }

    return (
        <div className="react-emoji">
            <TextInput
                ref={textInputRef}
                onCopy={handleCopy}
                onPaste={handlePaste}
                shouldReturn={shouldReturn}
                onBlur={listeners.blur.publish}
                onFocus={listeners.focus.publish}
                onArrowUp={listeners.arrowUp.publish}
                onArrowDown={listeners.arrowDown.publish}
                onKeyUp={listeners.keyUp.publish}
                onKeyDown={listeners.keyDown.publish}
                onEnter={listeners.enter.publish}
                placeholder={placeholder}
                style={{
                    borderRadius,
                    borderColor,
                    fontSize,
                    fontFamily
                }}
                tabIndex={tabIndex}
                className={inputClass}
                onChange={handleTextInputChange}
            />
            <EmojiPickerWrapper
                theme={theme}
                keepOpened={keepOpened}
                disableRecent={disableRecent}
                customEmojis={customEmojis}
                addSanitizeFn={addSanitizeFn}
                addPolluteFn={addPolluteFn}
                appendContent={appendContent}
                buttonElement={buttonElement}
                buttonRef={buttonRef}
                language={language}
            />
        </div>
    );
}

const InputEmojiWithRef = forwardRef(InputEmoji);

InputEmojiWithRef.defaultProps = {
    theme: /** @type {const} */ ("auto"),
    height: 30,
    placeholder: "Type a message",
    borderRadius: 21,
    borderColor: "#EAEAEA",
    fontSize: 15,
    fontFamily: "sans-serif",
    tabIndex: 0,
    shouldReturn: false,
    customEmojis: [],
    language: undefined,
};

export default InputEmojiWithRef;
