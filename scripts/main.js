"use strict";

const MODULE_ID = "filepicker-memory";
const FLAG_KEY = "lastPaths";
const SETTING_FORCE_RESTORE = "forceRestore";
const DEFAULT_TYPE = "default";
const VALID_SOURCES = new Set(["data", "public", "s3"]);
const FORCE_RESTORE_SEEN = new WeakSet();

Hooks.once("init", () => {
  registerSettings();
  registerFilePickerBrowseWrapper();
});

function registerSettings() {
  game.settings.register(MODULE_ID, SETTING_FORCE_RESTORE, {
    name: "FILEPICKER_MEMORY.Settings.ForceRestore.Name",
    hint: "FILEPICKER_MEMORY.Settings.ForceRestore.Hint",
    scope: "user",
    config: true,
    type: Boolean,
    default: true
  });
}

function registerFilePickerBrowseWrapper() {
  if (!globalThis.libWrapper?.register) {
    notifyMissingDependency();
    return;
  }

  const targets = [
    "foundry.applications.apps.FilePicker.prototype.browse",
    "FilePicker.prototype.browse"
  ];

  for (const target of targets) {
    try {
      libWrapper.register(MODULE_ID, target, filePickerBrowseWrapper, libWrapper.WRAPPER ?? "WRAPPER");
      console.log(`[${MODULE_ID}] Wrapped ${target}`);
      return;
    } catch (error) {
      console.warn(`[${MODULE_ID}] Failed to wrap ${target}`, error);
    }
  }

  console.error(`[${MODULE_ID}] Could not register a FilePicker browse wrapper.`);
}

function notifyMissingDependency() {
  console.error(`[${MODULE_ID}] libWrapper is required but not active.`);
  Hooks.once("ready", () => {
    ui.notifications?.error(t("FILEPICKER_MEMORY.Notifications.MissingLibWrapper"));
  });
}

async function filePickerBrowseWrapper(wrapped, ...args) {
  let nextArgs = args;
  try {
    nextArgs = maybeRestorePath(this, args);
  } catch (error) {
    console.warn(`[${MODULE_ID}] Failed while restoring last path`, error);
  }

  const result = await wrapped(...nextArgs);

  try {
    await saveCurrentPath(this, nextArgs);
  } catch (error) {
    console.warn(`[${MODULE_ID}] Failed while saving current path`, error);
  }

  return result;
}

function maybeRestorePath(picker, args) {
  if (!game.user) return args;

  const typeKey = getTypeKey(picker?.type);
  const memoryMap = getMemoryMap();
  const saved = memoryMap[typeKey];
  if (!isObject(saved)) return args;

  const forceRestore = isForceRestoreEnabled();
  if (forceRestore) {
    if (hasForceRestoreBeenApplied(picker)) return args;
  } else {
    const requestedTarget = extractRequestedTarget(picker, args);
    if (!shouldRestoreTarget(requestedTarget)) return args;
  }

  const restoredTarget = normalizeTarget(saved.target);
  if (restoredTarget == null) return args;

  const restoredSource = normalizeSource(saved.source);
  const restoredBucket = normalizeBucket(saved.bucket);
  const incomingOptions = normalizeOptions(args[1]);
  applyRestoredStateToPicker(picker, {
    source: restoredSource,
    target: restoredTarget,
    bucket: restoredBucket
  });

  if (restoredSource) incomingOptions.source = restoredSource;
  if (restoredSource === "s3") {
    if (restoredBucket) incomingOptions.bucket = restoredBucket;
    else delete incomingOptions.bucket;
  } else if ("bucket" in incomingOptions) {
    delete incomingOptions.bucket;
  }

  const patchedArgs = [...args];
  patchedArgs[0] = restoredTarget;
  patchedArgs[1] = incomingOptions;
  if (forceRestore) markForceRestoreApplied(picker);
  return patchedArgs;
}

async function saveCurrentPath(picker, args) {
  if (!game.user) return;

  const typeKey = getTypeKey(picker?.type);
  const source = normalizeSource(picker?.activeSource ?? args?.[1]?.source);
  if (!source) return;

  const pickerSource = isObject(picker?.source) ? picker.source : null;
  const target = normalizeTarget(
    picker?.target ?? pickerSource?.target ?? picker?.request ?? args?.[0]
  );
  if (target == null) return;

  const bucket =
    source === "s3"
      ? normalizeBucket(pickerSource?.bucket ?? args?.[1]?.bucket)
      : null;

  const nextEntry = {
    source,
    target,
    bucket
  };

  const memoryMap = getMemoryMap();
  if (isSameEntry(memoryMap[typeKey], nextEntry)) return;

  memoryMap[typeKey] = nextEntry;
  await game.user.setFlag(MODULE_ID, FLAG_KEY, memoryMap);
}

function getMemoryMap() {
  const flag = game.user?.getFlag(MODULE_ID, FLAG_KEY);
  return isObject(flag) ? flag : {};
}

function getTypeKey(type) {
  if (typeof type !== "string") return DEFAULT_TYPE;
  const trimmed = type.trim().toLowerCase();
  return trimmed || DEFAULT_TYPE;
}

function extractRequestedTarget(picker, args) {
  const argTarget = normalizeTarget(args?.[0]);
  if (argTarget != null) return argTarget;

  const pickerTarget = normalizeTarget(picker?.target);
  if (pickerTarget != null) return pickerTarget;

  const requestTarget = normalizeTarget(picker?.request);
  return requestTarget ?? "";
}

function shouldRestoreTarget(target) {
  const t = String(target ?? "").trim();
  return t === "" || t === "." || t === "/";
}

function normalizeOptions(options) {
  return isObject(options) ? { ...options } : {};
}

function normalizeSource(source) {
  if (typeof source !== "string") return null;
  const s = source.trim().toLowerCase();
  return VALID_SOURCES.has(s) ? s : null;
}

function normalizeTarget(target) {
  if (typeof target !== "string") return null;
  const t = target.trim();
  return t || ".";
}

function normalizeBucket(bucket) {
  if (typeof bucket !== "string") return null;
  const b = bucket.trim();
  return b || null;
}

function isSameEntry(existing, next) {
  if (!isObject(existing)) return false;
  return (
    existing.source === next.source &&
    existing.target === next.target &&
    (existing.bucket ?? null) === (next.bucket ?? null)
  );
}

function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function applyRestoredStateToPicker(picker, restored) {
  if (!isObject(picker)) return;

  const sourceKey = restored.source;
  const target = restored.target;
  const bucket = restored.bucket ?? null;

  if (sourceKey && VALID_SOURCES.has(sourceKey)) {
    picker.activeSource = sourceKey;
  }

  if (!isObject(picker.sources)) picker.sources = {};

  if (sourceKey) {
    const currentSource = isObject(picker.sources[sourceKey]) ? picker.sources[sourceKey] : {};
    currentSource.target = target;
    if (sourceKey === "s3") {
      if (bucket) currentSource.bucket = bucket;
      else delete currentSource.bucket;
    } else if ("bucket" in currentSource) {
      delete currentSource.bucket;
    }
    picker.sources[sourceKey] = currentSource;
  }

  picker.request = target;
}

function isForceRestoreEnabled() {
  return Boolean(game.settings?.get(MODULE_ID, SETTING_FORCE_RESTORE));
}

function hasForceRestoreBeenApplied(picker) {
  if (!isObject(picker)) return false;
  return FORCE_RESTORE_SEEN.has(picker);
}

function markForceRestoreApplied(picker) {
  if (!isObject(picker)) return;
  FORCE_RESTORE_SEEN.add(picker);
}

function t(key) {
  return game.i18n?.localize?.(key) ?? key;
}
