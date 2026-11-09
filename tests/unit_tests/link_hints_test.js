import "./test_helper.js";
import { withPromise } from "./test_helper.js";
import "../../lib/handler_stack.js";
import "../../lib/keyboard_utils.js";
import "../../lib/settings.js";
import "../../content_scripts/mode.js";
import "../../content_scripts/link_hints.js";

context("With insufficient link characters", () => {
  setup(async () => {
    await Settings.onLoaded();
  });

  teardown(async () => {
    await Settings.clear();
  });

  should("throw error in AlphabetHints", async () => {
    await Settings.set("linkHintCharacters", "ab");
    new AlphabetHints();
    await Settings.set("linkHintCharacters", "a");
    assert.throwsError(() => new AlphabetHints(), "Error");
  });

  should("throw error in FilterHints", async () => {
    await Settings.set("linkHintNumbers", "12");
    new FilterHints();
    await Settings.set("linkHintNumbers", "1");
    assert.throwsError(() => new FilterHints(), "Error");
  });
});

context("Bookmark bar shortcuts", () => {
  let messages;

  setup(async () => {
    await Settings.onLoaded();
    messages = [];
    stub(chrome.runtime, "sendMessage", withPromise((message) => messages.push(message)));
    stub(globalThis, "document", { documentElement: {} });
    stub(globalThis, "windowIsFocused", () => false);
    stub(Mode.prototype, "init", () => {});
    stub(Mode.prototype, "onExit", () => {});
  });

  teardown(async () => {
    await Settings.clear();
  });

  should("allow opening a bookmark on a page without links", () => {
    const mode = new LinkHintsMode([]);
    assert.isTrue(mode.hintMode != null);
    assert.equal(handlerStack.suppressEvent, mode.onKeyDownInMode({ key: "4" }));
    assert.equal({ handler: "openBookmarkBarItem", index: 3, openInNewTab: false }, messages[1]);
  });

  should("preserve numeric link hints when filtering by link text", async () => {
    await Settings.set("filterLinkHints", true);
    stub(globalThis, "frameId", 0);
    stub(LinkHintsMode.prototype, "renderHints", () => {});
    const mode = new LinkHintsMode([{ frameId: 1, linkText: "Example" }]);
    mode.onKeyDownInMode({ key: "4" });

    assert.equal(["4"], mode.markerMatcher.hintKeystrokeQueue);
    assert.equal("updateKeyState", messages[0].messageType);
  });
});
